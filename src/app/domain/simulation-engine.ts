import {
  Species,
  SpeciesId,
  EnvironmentalParameters,
  SimulationStepRecord,
  CausalChainEvent,
  TrophicTierSummary
} from './models';
import { CausalAnalyzer } from './causal-analyzer';

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
    return CausalAnalyzer.traceCausalChain(history, speciesMap, env, initialOverrides);
  }

  /**
   * Computes biomass aggregated by ecological trophic tier for Lindeman pyramid analysis.
   */
  public static computeTrophicTiers(
    currentPops: Record<SpeciesId, number>,
    basePops: Record<SpeciesId, number>
  ): TrophicTierSummary[] {
    const tierDefs = [
      { tier: 5, name: 'Apex Predators', category: 'apex_predator' as const, speciesIds: ['apex_shark'] as SpeciesId[] },
      { tier: 4, name: 'Tertiary Consumers', category: 'tertiary_consumer' as const, speciesIds: ['predatory_fish', 'marine_bird', 'marine_mammal'] as SpeciesId[] },
      { tier: 3, name: 'Secondary Consumers', category: 'secondary_consumer' as const, speciesIds: ['forage_fish', 'crustaceans'] as SpeciesId[] },
      { tier: 2, name: 'Primary Consumers', category: 'primary_consumer' as const, speciesIds: ['zooplankton', 'benthic_bivalves'] as SpeciesId[] },
      { tier: 1, name: 'Primary Producers', category: 'primary_producer' as const, speciesIds: ['phytoplankton'] as SpeciesId[] },
      { tier: 0, name: 'Benthic Decomposers', category: 'decomposer' as const, speciesIds: ['benthic_decomposers'] as SpeciesId[] }
    ];

    let totalEcosystemBiomass = 0;
    for (const pop of Object.values(currentPops)) {
      totalEcosystemBiomass += pop;
    }
    const safeTotal = Math.max(1, totalEcosystemBiomass);

    return tierDefs.map((def) => {
      let tierCurrentBiomass = 0;
      let tierBaselineBiomass = 0;

      for (const spId of def.speciesIds) {
        tierCurrentBiomass += currentPops[spId] ?? 0;
        tierBaselineBiomass += basePops[spId] ?? 100;
      }

      const diff = tierCurrentBiomass - tierBaselineBiomass;
      const pct = tierBaselineBiomass > 0 ? (diff / tierBaselineBiomass) * 100 : 0;

      return {
        tier: def.tier,
        name: def.name,
        category: def.category,
        speciesIds: def.speciesIds,
        totalBiomass: Number(tierCurrentBiomass.toFixed(1)),
        baselineBiomass: Number(tierBaselineBiomass.toFixed(1)),
        percentChange: Number(pct.toFixed(1)),
        fractionOfEcosystem: Number((tierCurrentBiomass / safeTotal).toFixed(3))
      };
    });
  }
}
