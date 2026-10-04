import {
  Species,
  SpeciesId,
  EnvironmentalParameters,
  SimulationStepRecord,
  CausalChainEvent
} from './models';

export class SimulationEngine {
  /**
   * Computes a single discrete time step in the ecosystem simulation.
   */
  public static computeStep(
    currentStep: number,
    currentPopulations: Record<SpeciesId, number>,
    baselinePopulations: Record<SpeciesId, number>,
    speciesMap: Map<SpeciesId, Species>,
    env: EnvironmentalParameters,
    dt = 0.5
  ): SimulationStepRecord {
    const nextPopulations: Partial<Record<SpeciesId, number>> = {};
    const deltas: Partial<Record<SpeciesId, number>> = {};
    const deltaFromBaseline: Partial<Record<SpeciesId, number>> = {};
    const growthTerms: Partial<Record<SpeciesId, number>> = {};
    const predationLosses: Partial<Record<SpeciesId, number>> = {};
    const mortalityLosses: Partial<Record<SpeciesId, number>> = {};
    const fishingLosses: Partial<Record<SpeciesId, number>> = {};

    // First, precompute predation consumption matrices using Holling Type II functional response
    // For each consumer k and prey j: rate of consumption per predator individual
    const consumptionRates: Record<string, number> = {};

    for (const [predId, predSpecies] of speciesMap.entries()) {
      const predPop = currentPopulations[predId] || 0;
      if (predPop <= 0 || predSpecies.preyIds.length === 0) continue;

      // Holling Type II denominator: 1 + sum(a_im * h_im * N_m)
      let denominator = 1.0;
      for (const preyId of predSpecies.preyIds) {
        const preyPop = currentPopulations[preyId] || 0;
        const attackRate = predSpecies.consumptionEfficiency[preyId] || 0.003;
        const handlingTime = predSpecies.handlingTime[preyId] || 0.003;
        denominator += attackRate * handlingTime * preyPop;
      }

      for (const preyId of predSpecies.preyIds) {
        const preyPop = currentPopulations[preyId] || 0;
        const attackRate = predSpecies.consumptionEfficiency[preyId] || 0.003;
        // Consumption rate per predator: (a_ij * N_j) / denominator
        const perCapitaIntake = (attackRate * preyPop) / Math.max(0.1, denominator);
        consumptionRates[`${predId}->${preyId}`] = perCapitaIntake;
      }
    }

    // Calculate total natural mortality to feed benthic decomposers
    let unassimilatedOrganicFlux = 0;

    // Now compute dynamics for each species
    for (const [speciesId, sp] of speciesMap.entries()) {
      const pop = currentPopulations[speciesId] || 0;

      // If extinct (0), stay 0 unless re-introduced manually
      if (pop <= 0.05) {
        nextPopulations[speciesId] = 0;
        deltas[speciesId] = 0;
        deltaFromBaseline[speciesId] = -100;
        growthTerms[speciesId] = 0;
        predationLosses[speciesId] = 0;
        mortalityLosses[speciesId] = 0;
        fishingLosses[speciesId] = 0;
        continue;
      }

      // Predation losses exerted on this species by all its predators
      let totalPredationLoss = 0;
      for (const predId of sp.predatorIds) {
        const predPop = currentPopulations[predId] || 0;
        if (predPop <= 0) continue;
        const rate = consumptionRates[`${predId}->${speciesId}`] || 0;
        // Total prey individuals consumed: rate * N_predator * scaling factor
        const loss = rate * predPop * 12.0;
        totalPredationLoss += loss;
      }

      // Baseline mortality with thermal stress modifier
      let thermalStress = 1.0;
      const tempDiff = Math.abs(env.waterTempAnomaly - sp.thermalPreference * 2.5);
      if (tempDiff > 1.8) {
        thermalStress += (tempDiff - 1.8) * 0.35; // elevated metabolic mortality under heat stress
      }
      const naturalMortality = sp.baselineMortality * pop * thermalStress;
      unassimilatedOrganicFlux += naturalMortality;

      // Fishing mortality
      const fishingLoss = sp.fishingVulnerability * env.fishingPressure * 0.16 * pop;

      let growth = 0;

      if (sp.trophicCategory === 'primary_producer') {
        // Phytoplankton: photoautotrophic logistic growth with nutrient and temperature multipliers
        const nutrientFactor = Math.max(0.15, env.nutrientAvailability);
        const tempGrowthFactor = Math.max(0.2, 1.0 + env.waterTempAnomaly * 0.06);
        const effectiveK = sp.carryingCapacity * nutrientFactor;
        const logisticTerm = 1.0 - pop / effectiveK;
        growth = sp.growthRate * pop * logisticTerm * tempGrowthFactor;
      } else if (sp.trophicCategory === 'decomposer') {
        // Benthic Decomposers: driven by organic detritus flux from water column
        const normalizedFlux = Math.min(2.5, Math.max(0.2, unassimilatedOrganicFlux / 12.0));
        const effectiveK = sp.carryingCapacity * normalizedFlux;
        const logisticTerm = 1.0 - pop / effectiveK;
        growth = sp.growthRate * pop * logisticTerm;
      } else {
        // Consumers: biomass synthesis from consumed prey
        let totalIntakeBiomass = 0;
        for (const preyId of sp.preyIds) {
          const intakeRate = consumptionRates[`${sp.id}->${preyId}`] || 0;
          const preyPop = currentPopulations[preyId] || 0;
          // Nutritional conversion: intake rate * conversion efficiency
          totalIntakeBiomass += intakeRate * preyPop * 8.5;
        }

        // Intrinsic ceiling limitation (territorial space / carrying capacity cap)
        const densityPenalty = Math.max(0.05, 1.0 - pop / (sp.carryingCapacity * 1.6));
        growth = sp.growthRate * pop * (totalIntakeBiomass / 25.0) * densityPenalty;
      }

      // Record components
      growthTerms[speciesId] = Number(growth.toFixed(2));
      predationLosses[speciesId] = Number(totalPredationLoss.toFixed(2));
      mortalityLosses[speciesId] = Number(naturalMortality.toFixed(2));
      fishingLosses[speciesId] = Number(fishingLoss.toFixed(2));

      // Net change
      const netDelta = (growth - totalPredationLoss - naturalMortality - fishingLoss) * dt;
      let newPop = pop + netDelta;

      // Biological thresholds:
      // If population falls below 0.8 index units, it suffers Allee effect / local extinction
      if (newPop < 0.8) {
        newPop = 0;
      }

      // Upper boundary clamp (prevents non-physical numerical explosion)
      const maxCap = sp.carryingCapacity * 2.5;
      if (newPop > maxCap) {
        newPop = maxCap;
      }

      nextPopulations[speciesId] = Number(newPop.toFixed(2));
      deltas[speciesId] = Number((newPop - pop).toFixed(2));

      const baseline = baselinePopulations[speciesId] || 100;
      const pctFromBase = baseline > 0 ? ((newPop - baseline) / baseline) * 100 : 0;
      deltaFromBaseline[speciesId] = Number(pctFromBase.toFixed(1));
    }

    // System-wide ecosystem metrics
    let totalBiomass = 0;
    let extinctCount = 0;
    const finalPops = nextPopulations as Record<SpeciesId, number>;

    for (const val of Object.values(finalPops)) {
      totalBiomass += val;
      if (val <= 0) extinctCount++;
    }

    // Shannon-Wiener Diversity Index H' = - sum(p_i * ln(p_i))
    let biodiversityIndex = 0;
    if (totalBiomass > 0) {
      for (const val of Object.values(finalPops)) {
        if (val > 0) {
          const p = val / totalBiomass;
          biodiversityIndex += -1 * p * Math.log(p);
        }
      }
    }

    return {
      step: currentStep + 1,
      populations: finalPops,
      deltas: deltas as Record<SpeciesId, number>,
      deltaFromBaseline: deltaFromBaseline as Record<SpeciesId, number>,
      growthTerms: growthTerms as Record<SpeciesId, number>,
      predationLosses: predationLosses as Record<SpeciesId, number>,
      mortalityLosses: mortalityLosses as Record<SpeciesId, number>,
      fishingLosses: fishingLosses as Record<SpeciesId, number>,
      totalBiomass: Number(totalBiomass.toFixed(1)),
      biodiversityIndex: Number(biodiversityIndex.toFixed(2)),
      extinctCount
    };
  }

  /**
   * Performs graph-based causal tracing to analyze how disturbances propagated
   * across trophic links, identifying primary perturbations and resulting cascades.
   */
  public static analyzeCausalChain(
    history: SimulationStepRecord[],
    speciesMap: Map<SpeciesId, Species>,
    env: EnvironmentalParameters,
    initialOverrides?: Partial<Record<SpeciesId, number>>
  ): CausalChainEvent[] {
    if (history.length === 0) return [];

    const events: CausalChainEvent[] = [];
    const latest = history[history.length - 1];
    const initial = history[0];

    // 1. Identify direct user perturbations (initial step alterations)
    if (initialOverrides) {
      for (const [rawId, overridePop] of Object.entries(initialOverrides)) {
        const id = rawId as SpeciesId;
        const sp = speciesMap.get(id);
        if (!sp) continue;

        if (overridePop === 0) {
          events.push({
            id: `direct-extirpation-${id}`,
            stepObserved: 0,
            targetSpeciesId: id,
            relationship: 'direct_perturbation',
            headline: `${sp.commonName} removed from ecosystem`,
            explanation: `User simulation disturbance: ${sp.commonName} (${sp.scientificName}) population was reduced to zero at t=0 to evaluate trophic consequences.`,
            percentChange: -100,
            direction: 'extinct',
            severity: 'critical'
          });
        } else if (typeof overridePop === 'number' && overridePop < 60) {
          events.push({
            id: `direct-reduction-${id}`,
            stepObserved: 0,
            targetSpeciesId: id,
            relationship: 'direct_perturbation',
            headline: `${sp.commonName} depleted by direct intervention`,
            explanation: `${sp.commonName} population was manually suppressed to ${overridePop} units (${overridePop - 100}% of baseline).`,
            percentChange: overridePop - 100,
            direction: 'decreased',
            severity: 'moderate'
          });
        } else if (typeof overridePop === 'number' && overridePop > 120) {
          events.push({
            id: `direct-boost-${id}`,
            stepObserved: 0,
            targetSpeciesId: id,
            relationship: 'direct_perturbation',
            headline: `${sp.commonName} population augmented`,
            explanation: `${sp.commonName} stock was enhanced to ${overridePop} units to simulate conservation reintroduction.`,
            percentChange: overridePop - 100,
            direction: 'increased',
            severity: 'moderate'
          });
        }
      }
    }

    // 2. Identify abiotic environmental drivers
    if (env.fishingPressure > 0.5) {
      events.push({
        id: 'abiotic-fishing',
        stepObserved: 0,
        targetSpeciesId: 'predatory_fish',
        relationship: 'environmental_stress',
        headline: 'Heavy commercial harvest pressure active',
        explanation: `Commercial fishing mortality coefficient is set to ${env.fishingPressure}x, disproportionately removing high-trophic finfish (Striped Bass) and forage fish.`,
        percentChange: -Math.round(env.fishingPressure * 25),
        direction: 'decreased',
        severity: env.fishingPressure > 1.2 ? 'critical' : 'moderate'
      });
    }

    if (env.nutrientAvailability < 0.7) {
      events.push({
        id: 'abiotic-nutrient-depletion',
        stepObserved: 0,
        targetSpeciesId: 'phytoplankton',
        relationship: 'nutrient_limitation',
        headline: 'Nutrient availability reduced',
        explanation: `Dissolved nitrate and phosphate levels restricted to ${(env.nutrientAvailability * 100).toFixed(0)}% of normal upwelling capacity, constraining primary production carrying capacity.`,
        percentChange: -Math.round((1 - env.nutrientAvailability) * 100),
        direction: 'decreased',
        severity: 'moderate'
      });
    }

    if (Math.abs(env.waterTempAnomaly) >= 2.0) {
      events.push({
        id: 'abiotic-temperature-anomaly',
        stepObserved: 0,
        targetSpeciesId: 'zooplankton',
        relationship: 'environmental_stress',
        headline: `Water temperature anomaly of ${env.waterTempAnomaly > 0 ? '+' : ''}${env.waterTempAnomaly.toFixed(1)}°C active`,
        explanation: `Severe thermal displacement increases metabolic costs for cold-adapted pelagic copepods (Calanus finmarchicus) and coastal pinnipeds.`,
        percentChange: -30,
        direction: 'decreased',
        severity: 'moderate'
      });
    }

    // 3. Trace food-web links for significant cascading population changes
    for (const [id, sp] of speciesMap.entries()) {
      const latestPop = latest.populations[id] || 0;
      const baselinePop = initial.populations[id] || 100;
      const pctDelta = ((latestPop - baselinePop) / baselinePop) * 100;

      // Skip negligible changes (< 15%)
      if (Math.abs(pctDelta) < 15 && latestPop > 0) continue;

      // Check: Was this caused by a predator declining? (Predation release / mesopredator release)
      for (const predId of sp.predatorIds) {
        const predLatest = latest.populations[predId] || 0;
        const predBase = initial.populations[predId] || 100;
        const predDelta = ((predLatest - predBase) / predBase) * 100;

        if (predDelta <= -40 && pctDelta > 15) {
          const predSp = speciesMap.get(predId);
          const isMesopredator =
            sp.trophicLevel >= 3.5 &&
            sp.trophicLevel < 4.5 &&
            !!predSp &&
            predSp.trophicLevel >= 4.5;

          events.push({
            id: `cascade-release-${predId}-to-${id}`,
            stepObserved: Math.min(latest.step, 10),
            sourceSpeciesId: predId,
            targetSpeciesId: id,
            relationship: isMesopredator ? 'mesopredator_release' : 'predation_release',
            headline: isMesopredator
              ? `Mesopredator release: ${sp.commonName} surged`
              : `Predation release: ${sp.commonName} population expanded`,
            explanation: `With its primary predator ${predSp?.commonName || predId} severely depleted (${predDelta.toFixed(0)}%), top-down mortality on ${sp.commonName} dropped sharply, allowing its numbers to climb by +${pctDelta.toFixed(0)}%.`,
            percentChange: Number(pctDelta.toFixed(0)),
            direction: 'increased',
            severity: 'moderate'
          });
          break;
        }
      }

      // Check: Was this caused by a predator exploding? (Overgrazing / top-down suppression)
      let predatorSurgeFound = false;
      for (const predId of sp.predatorIds) {
        const predLatest = latest.populations[predId] || 0;
        const predBase = initial.populations[predId] || 100;
        const predDelta = ((predLatest - predBase) / predBase) * 100;

        if (predDelta >= 25 && pctDelta <= -20) {
          const predSp = speciesMap.get(predId);
          events.push({
            id: `cascade-overgrazing-${predId}-to-${id}`,
            stepObserved: Math.min(latest.step, 15),
            sourceSpeciesId: predId,
            targetSpeciesId: id,
            relationship: 'overgrazing',
            headline: `Top-down overgrazing: ${sp.commonName} declined`,
            explanation: `An over-abundant population of ${predSp?.commonName || predId} (+${predDelta.toFixed(0)}%) exerted heightened consumption pressure, depressing ${sp.commonName} by ${pctDelta.toFixed(0)}%.`,
            percentChange: Number(pctDelta.toFixed(0)),
            direction: latestPop <= 0 ? 'extinct' : 'decreased',
            severity: latestPop <= 0 ? 'critical' : 'moderate'
          });
          predatorSurgeFound = true;
          break;
        }
      }

      // Check: Was this caused by prey collapse? (Bottom-up predator starvation)
      if (pctDelta <= -20 && !predatorSurgeFound && sp.preyIds.length > 0) {
        for (const preyId of sp.preyIds) {
          const preyLatest = latest.populations[preyId] || 0;
          const preyBase = initial.populations[preyId] || 100;
          const preyDelta = ((preyLatest - preyBase) / preyBase) * 100;

          if (preyDelta <= -35) {
            const preySp = speciesMap.get(preyId);
            events.push({
              id: `cascade-starvation-${preyId}-to-${id}`,
              stepObserved: Math.min(latest.step, 20),
              sourceSpeciesId: preyId,
              targetSpeciesId: id,
              relationship: 'predator_starvation',
              headline: `Food scarcity: ${sp.commonName} declined due to prey loss`,
              explanation: `The depletion of foundational prey ${preySp?.commonName || preyId} (${preyDelta.toFixed(0)}%) left ${sp.commonName} without sufficient caloric intake, forcing a ${pctDelta.toFixed(0)}% population drop.`,
              percentChange: Number(pctDelta.toFixed(0)),
              direction: latestPop <= 0 ? 'extinct' : 'decreased',
              severity: 'moderate'
            });
            break;
          }
        }
      }
    }

    // Sort events logically: direct perturbations first, then cascading consequences by step
    return events.sort((a, b) => {
      if (a.relationship === 'direct_perturbation') return -1;
      if (b.relationship === 'direct_perturbation') return 1;
      return a.stepObserved - b.stepObserved;
    });
  }
}
