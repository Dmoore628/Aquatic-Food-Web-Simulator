import { Injectable, computed, signal } from '@angular/core';
import {
  Species,
  SpeciesId,
  SimulationStepRecord,
  EnvironmentalParameters,
  CausalChainEvent,
  EcosystemScenario,
  TrophicTierSummary
} from '../domain/models';
import {
  SPECIES_REGISTRY,
  DEFAULT_ENVIRONMENT,
  SCENARIOS
} from '../data/ecosystem-data';
import { SimulationEngine } from '../domain/simulation-engine';

@Injectable({
  providedIn: 'root'
})
export class SimulationStateService {
  // Static registry
  readonly speciesList = signal<Species[]>(SPECIES_REGISTRY);

  // Active scenario
  readonly activeScenarioId = signal<string>('baseline');
  readonly scenarios = signal<EcosystemScenario[]>(SCENARIOS);

  // Environmental parameters
  readonly environment = signal<EnvironmentalParameters>({ ...DEFAULT_ENVIRONMENT });

  // Initial populations baseline (at step 0 of current experiment/scenario)
  private readonly initialPopulations = signal<Record<SpeciesId, number>>(
    this.createDefaultPopulations()
  );

  // Current simulation timeline history
  readonly history = signal<SimulationStepRecord[]>([]);
  readonly currentStep = signal<number>(0);

  // Playback control
  readonly isPlaying = signal<boolean>(false);
  readonly playbackSpeed = signal<number>(200); // ms per step
  private playbackTimer: ReturnType<typeof setInterval> | null = null;
  readonly maxSteps = 100;

  // Selection & UI focus
  readonly selectedSpeciesId = signal<SpeciesId | null>(null);
  readonly highlightedSpeciesIds = signal<Set<SpeciesId>>(new Set());
  readonly hoveredSpeciesId = signal<SpeciesId | null>(null);
  readonly activeCausalEventId = signal<string | null>(null);

  // Chart visibility filters
  readonly visibleChartSpecies = signal<Set<SpeciesId>>(
    new Set(['apex_shark', 'predatory_fish', 'forage_fish', 'zooplankton', 'phytoplankton'])
  );

  // Modals & Panels
  readonly showAboutModal = signal<boolean>(false);
  readonly showConceptsModal = signal<boolean>(false);
  readonly activeConceptId = signal<string | null>(null);

  // Map accessor for fast lookup
  readonly speciesMap = computed(() => {
    const map = new Map<SpeciesId, Species>();
    for (const sp of this.speciesList()) {
      map.set(sp.id, sp);
    }
    return map;
  });

  // Current active step record
  readonly currentRecord = computed<SimulationStepRecord | null>(() => {
    const hist = this.history();
    const step = this.currentStep();
    if (hist.length === 0) return null;
    return hist[Math.min(step, hist.length - 1)] ?? null;
  });

  // Current populations at current step
  readonly currentPopulations = computed<Record<SpeciesId, number>>(() => {
    const record = this.currentRecord();
    if (record) return record.populations;
    return this.initialPopulations();
  });

  // Selected species object
  readonly selectedSpecies = computed<Species | null>(() => {
    const id = this.selectedSpeciesId();
    if (!id) return null;
    return this.speciesMap().get(id) ?? null;
  });

  // Active scenario object
  readonly activeScenario = computed<EcosystemScenario | null>(() => {
    const id = this.activeScenarioId();
    return this.scenarios().find((s) => s.id === id) ?? null;
  });

  // Causal explanation chain
  readonly causalEvents = computed<CausalChainEvent[]>(() => {
    const hist = this.history();
    const step = this.currentStep();
    if (hist.length === 0) return [];
    const slicedHistory = hist.slice(0, step + 1);
    const scenario = this.activeScenario();
    return SimulationEngine.analyzeCausalChain(
      slicedHistory,
      this.speciesMap(),
      this.environment(),
      scenario?.initialPopulationOverrides
    );
  });

  // Trophic Tier distribution (Pyramid of Biomass)
  readonly trophicTiers = computed<TrophicTierSummary[]>(() => {
    const currentPops = this.currentPopulations();
    const basePops = this.initialPopulations();
    return SimulationEngine.computeTrophicTiers(currentPops, basePops);
  });

  // Ecosystem overall health evaluation
  readonly ecosystemHealth = computed(() => {
    const rec = this.currentRecord();
    if (!rec) return { status: 'stable', label: 'Ecosystem Equilibrium', color: 'text-emerald-400' };

    if (rec.extinctCount >= 3) {
      return {
        status: 'collapsed',
        label: 'Severe Trophic Collapse',
        color: 'text-red-400',
        detail: `${rec.extinctCount} species extirpated; trophic energy pathway severed.`
      };
    }
    if (rec.extinctCount >= 1) {
      return {
        status: 'disturbed',
        label: 'Trophic Structure Impaired',
        color: 'text-amber-400',
        detail: `${rec.extinctCount} species extinct; secondary imbalances accumulating.`
      };
    }

    // Check balance between apex and forage fish
    const shark = rec.populations.apex_shark || 0;
    const predatory = rec.populations.predatory_fish || 0;
    const forage = rec.populations.forage_fish || 0;

    if (shark < 15 && predatory > 130) {
      return {
        status: 'imbalanced',
        label: 'Mesopredator Release Active',
        color: 'text-amber-300',
        detail: 'Depleted apex predators allowing mid-tier predatory fish to surge and overconsume forage fish.'
      };
    }

    if (forage < 40) {
      return {
        status: 'stressed',
        label: 'Forage Base Depleted',
        color: 'text-amber-400',
        detail: 'Critical forage fish abundance is low, threatening seabirds and higher marine predators.'
      };
    }

    return {
      status: 'stable',
      label: 'Stable Marine Equilibrium',
      color: 'text-emerald-400',
      detail: 'Energy flow balanced across all 5 trophic tiers; carrying capacities respected.'
    };
  });

  constructor() {
    this.initSimulation();
  }

  private createDefaultPopulations(): Record<SpeciesId, number> {
    const pops: Partial<Record<SpeciesId, number>> = {};
    for (const sp of SPECIES_REGISTRY) {
      pops[sp.id] = sp.initialPopulation;
    }
    return pops as Record<SpeciesId, number>;
  }

  /**
   * Initializes or resets the simulation to step 0 with the current scenario / population overrides.
   */
  public initSimulation() {
    this.pause();
    const scenario = this.activeScenario();
    const basePops = this.createDefaultPopulations();

    // Apply scenario overrides if present
    if (scenario?.initialPopulationOverrides) {
      for (const [id, val] of Object.entries(scenario.initialPopulationOverrides)) {
        if (typeof val === 'number') {
          basePops[id as SpeciesId] = val;
        }
      }
    }

    // Apply environmental overrides
    if (scenario?.environmentalOverrides) {
      this.environment.set({
        ...DEFAULT_ENVIRONMENT,
        ...scenario.environmentalOverrides
      });
    }

    this.initialPopulations.set(basePops);

    // Initial record at t=0
    let totalBiomass = 0;
    let extinctCount = 0;
    for (const val of Object.values(basePops)) {
      totalBiomass += val;
      if (val <= 0) extinctCount++;
    }

    let biodiversityIndex = 0;
    if (totalBiomass > 0) {
      for (const val of Object.values(basePops)) {
        if (val > 0) {
          const p = val / totalBiomass;
          biodiversityIndex += -1 * p * Math.log(p);
        }
      }
    }

    const step0Record: SimulationStepRecord = {
      step: 0,
      populations: { ...basePops },
      deltas: this.createZeroRecord(),
      deltaFromBaseline: this.createZeroRecord(),
      growthTerms: this.createZeroRecord(),
      predationLosses: this.createZeroRecord(),
      mortalityLosses: this.createZeroRecord(),
      fishingLosses: this.createZeroRecord(),
      totalBiomass: Number(totalBiomass.toFixed(1)),
      biodiversityIndex: Number(biodiversityIndex.toFixed(2)),
      extinctCount
    };

    this.history.set([step0Record]);
    this.currentStep.set(0);
  }

  private createZeroRecord(): Record<SpeciesId, number> {
    const r: Partial<Record<SpeciesId, number>> = {};
    for (const sp of SPECIES_REGISTRY) {
      r[sp.id] = 0;
    }
    return r as Record<SpeciesId, number>;
  }

  /**
   * Advances the simulation by 1 step.
   */
  public stepForward() {
    const hist = this.history();
    const currStep = this.currentStep();

    // If user is currently scrubbed to a past step, but history already exists beyond this step
    if (currStep < hist.length - 1) {
      this.currentStep.update((s) => s + 1);
      return;
    }

    if (currStep >= this.maxSteps) {
      this.pause();
      return;
    }

    const latestRecord = hist[hist.length - 1];
    const newRecord = SimulationEngine.computeStep(
      latestRecord.step,
      latestRecord.populations,
      this.initialPopulations(),
      this.speciesMap(),
      this.environment()
    );

    this.history.update((h) => [...h, newRecord]);
    this.currentStep.set(newRecord.step);
  }

  /**
   * Plays the simulation continuously until maxSteps or paused.
   */
  public play() {
    if (this.isPlaying()) return;
    if (this.currentStep() >= this.maxSteps) {
      this.currentStep.set(0);
    }
    this.isPlaying.set(true);

    this.playbackTimer = setInterval(() => {
      if (this.currentStep() >= this.maxSteps) {
        this.pause();
        return;
      }
      this.stepForward();
    }, this.playbackSpeed());
  }

  public pause() {
    this.isPlaying.set(false);
    if (this.playbackTimer) {
      clearInterval(this.playbackTimer);
      this.playbackTimer = null;
    }
  }

  public togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  public reset() {
    this.initSimulation();
  }

  public scrubTo(step: number) {
    const clamped = Math.max(0, Math.min(step, this.history().length - 1));
    this.currentStep.set(clamped);
  }

  public loadScenario(scenarioId: string) {
    this.pause();
    this.activeScenarioId.set(scenarioId);
    this.initSimulation();

    const scenario = this.activeScenario();
    if (scenario?.highlightedSpecies && scenario.highlightedSpecies.length > 0) {
      this.highlightedSpeciesIds.set(new Set(scenario.highlightedSpecies));
    } else {
      this.highlightedSpeciesIds.set(new Set());
    }
  }

  /**
   * Modifies a species population directly in current step & baseline.
   */
  public setSpeciesPopulation(speciesId: SpeciesId, newPop: number) {
    const clamped = Math.max(0, Math.min(newPop, 350));
    const curr = { ...this.currentPopulations() };
    curr[speciesId] = Number(clamped.toFixed(1));

    // Reset history from current step or re-anchor baseline
    this.initialPopulations.update((init) => ({
      ...init,
      [speciesId]: clamped
    }));
    this.initSimulation();
  }

  public removeSpecies(speciesId: SpeciesId) {
    this.setSpeciesPopulation(speciesId, 0);
  }

  public restoreSpecies(speciesId: SpeciesId) {
    const sp = this.speciesMap().get(speciesId);
    if (sp) {
      this.setSpeciesPopulation(speciesId, sp.initialPopulation);
    }
  }

  public updateEnvironment(params: Partial<EnvironmentalParameters>) {
    this.environment.update((env) => ({
      ...env,
      ...params
    }));
  }

  public resetEnvironment() {
    this.environment.set({ ...DEFAULT_ENVIRONMENT });
  }

  public setPlaybackSpeed(speedMs: number) {
    this.playbackSpeed.set(speedMs);
    if (this.isPlaying()) {
      this.pause();
      this.play();
    }
  }

  public selectSpecies(id: SpeciesId | null) {
    this.selectedSpeciesId.set(id);
  }

  public setHoveredSpecies(id: SpeciesId | null) {
    this.hoveredSpeciesId.set(id);
  }

  public toggleChartSpecies(id: SpeciesId) {
    this.visibleChartSpecies.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        if (next.size > 1) {
          next.delete(id);
        }
      } else {
        next.add(id);
      }
      return next;
    });
  }

  public selectAllChartSpecies() {
    this.visibleChartSpecies.set(new Set(SPECIES_REGISTRY.map((s) => s.id)));
  }

  public selectKeyChartSpecies() {
    this.visibleChartSpecies.set(
      new Set(['apex_shark', 'predatory_fish', 'forage_fish', 'zooplankton', 'phytoplankton'])
    );
  }

  public highlightSpecies(ids: SpeciesId[]) {
    this.highlightedSpeciesIds.set(new Set(ids));
  }

  public clearHighlights() {
    this.highlightedSpeciesIds.set(new Set());
  }

  public openConceptModal(conceptId?: string) {
    this.activeConceptId.set(conceptId ?? 'trophic_cascade');
    this.showConceptsModal.set(true);
  }

  public closeConceptModal() {
    this.showConceptsModal.set(false);
  }

  public openAboutModal() {
    this.showAboutModal.set(true);
  }

  public closeAboutModal() {
    this.showAboutModal.set(false);
  }
}
