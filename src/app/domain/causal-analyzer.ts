import {
  Species,
  SpeciesId,
  EnvironmentalParameters,
  SimulationStepRecord,
  CausalChainEvent
} from './models';

export class CausalAnalyzer {
  /**
   * Analyzes the simulation history graph to construct a chronologically ordered,
   * biologically grounded causal chain explaining how disturbances propagated.
   */
  public static traceCausalChain(
    history: SimulationStepRecord[],
    speciesMap: Map<SpeciesId, Species>,
    env: EnvironmentalParameters,
    initialOverrides?: Partial<Record<SpeciesId, number>>
  ): CausalChainEvent[] {
    if (history.length === 0) return [];

    const events: CausalChainEvent[] = [];
    const latest = history[history.length - 1];
    const initial = history[0];

    // 1. Trace direct human / experimental interventions at t=0
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
            headline: `${sp.commonName} extirpated by direct intervention`,
            explanation: `${sp.commonName} (${sp.scientificName}) abundance was set to zero at t=0 to evaluate top-down or bottom-up ecological cascade effects.`,
            percentChange: -100,
            direction: 'extinct',
            severity: 'critical'
          });
        } else if (typeof overridePop === 'number' && overridePop < 60) {
          const delta = overridePop - 100;
          events.push({
            id: `direct-reduction-${id}`,
            stepObserved: 0,
            targetSpeciesId: id,
            relationship: 'direct_perturbation',
            headline: `${sp.commonName} stock suppressed to ${overridePop}`,
            explanation: `${sp.commonName} was manually reduced to ${overridePop} normalized units (${delta}% relative to baseline).`,
            percentChange: delta,
            direction: 'decreased',
            severity: 'moderate'
          });
        } else if (typeof overridePop === 'number' && overridePop > 120) {
          const delta = overridePop - 100;
          events.push({
            id: `direct-boost-${id}`,
            stepObserved: 0,
            targetSpeciesId: id,
            relationship: 'direct_perturbation',
            headline: `${sp.commonName} population augmented (+${delta}%)`,
            explanation: `${sp.commonName} stock was augmented to ${overridePop} units to simulate conservation reintroduction or stocking.`,
            percentChange: delta,
            direction: 'increased',
            severity: 'moderate'
          });
        }
      }
    }

    // 2. Trace abiotic environmental stressors
    if (env.fishingPressure > 0.4) {
      events.push({
        id: 'abiotic-fishing-pressure',
        stepObserved: 0,
        targetSpeciesId: 'predatory_fish',
        relationship: 'environmental_stress',
        headline: `Commercial harvest intensity active (${env.fishingPressure.toFixed(1)}x)`,
        explanation: `Intensive commercial and recreational harvest removes biomass across vulnerable teleost fish (Striped Bass and Menhaden), shifting energy pathways away from natural marine predators.`,
        percentChange: -Math.round(env.fishingPressure * 25),
        direction: 'decreased',
        severity: env.fishingPressure > 1.2 ? 'critical' : 'moderate'
      });
    }

    if (env.nutrientAvailability < 0.75) {
      events.push({
        id: 'abiotic-nutrient-scarcity',
        stepObserved: 0,
        targetSpeciesId: 'phytoplankton',
        relationship: 'nutrient_limitation',
        headline: `Nutrient upwelling reduced to ${(env.nutrientAvailability * 100).toFixed(0)}%`,
        explanation: `Restricted dissolved nitrates and phosphates limit the photosynthetic carrying capacity of phytoplankton, curtailing primary production across the entire food web.`,
        percentChange: -Math.round((1 - env.nutrientAvailability) * 100),
        direction: 'decreased',
        severity: 'moderate'
      });
    }

    if (Math.abs(env.waterTempAnomaly) >= 1.5) {
      events.push({
        id: 'abiotic-thermal-stress',
        stepObserved: 0,
        targetSpeciesId: 'zooplankton',
        relationship: 'environmental_stress',
        headline: `Thermal anomaly: ${env.waterTempAnomaly > 0 ? '+' : ''}${env.waterTempAnomaly.toFixed(1)}°C`,
        explanation: `Persistent water temperature displacement increases basal metabolic costs and reduces fecundity in cold-adapted marine copepods (Calanus finmarchicus) and seals.`,
        percentChange: -Math.round(Math.abs(env.waterTempAnomaly) * 12),
        direction: 'decreased',
        severity: 'moderate'
      });
    }

    // 3. Trace food-web links for significant propagating shifts (first, second, third order)
    for (const [id, sp] of speciesMap.entries()) {
      const latestPop = latest.populations[id] || 0;
      const baselinePop = initial.populations[id] || 100;
      const pctDelta = ((latestPop - baselinePop) / baselinePop) * 100;

      // Filter out negligible variations (< 15%)
      if (Math.abs(pctDelta) < 15 && latestPop > 0) continue;

      // Check: Was this caused by a predator declining? (Predation release / mesopredator release)
      for (const predId of sp.predatorIds) {
        const predLatest = latest.populations[predId] || 0;
        const predBase = initial.populations[predId] || 100;
        const predDelta = ((predLatest - predBase) / predBase) * 100;

        if (predDelta <= -35 && pctDelta > 15) {
          const predSp = speciesMap.get(predId);
          const isMesopredator =
            sp.trophicLevel >= 3.5 &&
            sp.trophicLevel < 4.5 &&
            !!predSp &&
            predSp.trophicLevel >= 4.5;

          events.push({
            id: `cascade-release-${predId}-to-${id}`,
            stepObserved: Math.min(latest.step, 8),
            sourceSpeciesId: predId,
            targetSpeciesId: id,
            relationship: isMesopredator ? 'mesopredator_release' : 'predation_release',
            headline: isMesopredator
              ? `Mesopredator release: ${sp.commonName} surged`
              : `Predation release: ${sp.commonName} population expanded`,
            explanation: `With its primary predator ${predSp?.commonName || predId} depleted (${predDelta.toFixed(0)}%), top-down mortality on ${sp.commonName} dropped sharply, allowing its numbers to climb by +${pctDelta.toFixed(0)}%.`,
            percentChange: Number(pctDelta.toFixed(0)),
            direction: 'increased',
            severity: 'moderate'
          });
          break;
        }
      }

      // Check: Was this caused by a predator exploding? (Overgrazing)
      let predatorSurgeFound = false;
      for (const predId of sp.predatorIds) {
        const predLatest = latest.populations[predId] || 0;
        const predBase = initial.populations[predId] || 100;
        const predDelta = ((predLatest - predBase) / predBase) * 100;

        if (predDelta >= 25 && pctDelta <= -20) {
          const predSp = speciesMap.get(predId);
          events.push({
            id: `cascade-overgrazing-${predId}-to-${id}`,
            stepObserved: Math.min(latest.step, 14),
            sourceSpeciesId: predId,
            targetSpeciesId: id,
            relationship: 'overgrazing',
            headline: `Top-down overgrazing: ${sp.commonName} suppressed`,
            explanation: `A dense population of ${predSp?.commonName || predId} (+${predDelta.toFixed(0)}%) exerted heightened consumption pressure, depressing ${sp.commonName} by ${pctDelta.toFixed(0)}%.`,
            percentChange: Number(pctDelta.toFixed(0)),
            direction: latestPop <= 0 ? 'extinct' : 'decreased',
            severity: latestPop <= 0 ? 'critical' : 'moderate'
          });
          predatorSurgeFound = true;
          break;
        }
      }

      // Check: Was this caused by prey collapse? (Bottom-up food starvation)
      if (pctDelta <= -20 && !predatorSurgeFound && sp.preyIds.length > 0) {
        for (const preyId of sp.preyIds) {
          const preyLatest = latest.populations[preyId] || 0;
          const preyBase = initial.populations[preyId] || 100;
          const preyDelta = ((preyLatest - preyBase) / preyBase) * 100;

          if (preyDelta <= -35) {
            const preySp = speciesMap.get(preyId);
            events.push({
              id: `cascade-starvation-${preyId}-to-${id}`,
              stepObserved: Math.min(latest.step, 18),
              sourceSpeciesId: preyId,
              targetSpeciesId: id,
              relationship: 'predator_starvation',
              headline: `Food scarcity: ${sp.commonName} declined due to prey collapse`,
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

    // Sort chronologically and by causal priority
    return events.sort((a, b) => {
      if (a.relationship === 'direct_perturbation') return -1;
      if (b.relationship === 'direct_perturbation') return 1;
      return a.stepObserved - b.stepObserved;
    });
  }
}
