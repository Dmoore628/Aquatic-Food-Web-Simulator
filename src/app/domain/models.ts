export type SpeciesId =
  | 'phytoplankton'
  | 'zooplankton'
  | 'benthic_bivalves'
  | 'forage_fish'
  | 'crustaceans'
  | 'predatory_fish'
  | 'marine_bird'
  | 'marine_mammal'
  | 'apex_shark'
  | 'benthic_decomposers';

export type TrophicLevelCategory =
  | 'primary_producer'
  | 'primary_consumer'
  | 'secondary_consumer'
  | 'tertiary_consumer'
  | 'apex_predator'
  | 'decomposer';

export interface ScientificSource {
  title: string;
  institution: string;
  year?: number;
  url?: string;
  notes?: string;
}

export interface Species {
  id: SpeciesId;
  commonName: string;
  scientificName: string;
  trophicLevel: number; // e.g. 1.0, 2.0, 3.2, 4.8
  trophicCategory: TrophicLevelCategory;
  initialPopulation: number; // Normalized index (baseline 100)
  carryingCapacity: number; // Carrying capacity K
  growthRate: number; // Intrinsic growth rate r
  baselineMortality: number; // Natural mortality rate m
  preyIds: SpeciesId[];
  predatorIds: SpeciesId[];
  // Feeding efficiency on specific prey (consumption parameter a_ij)
  consumptionEfficiency: Partial<Record<SpeciesId, number>>;
  // Handling time for Holling Type II response (h_ij)
  handlingTime: Partial<Record<SpeciesId, number>>;
  // Vulnerability to commercial / recreational harvest (0.0 to 1.0)
  fishingVulnerability: number;
  // Thermal sensitivity (-1.0 to 1.0, positive means prefers warmer, negative means cold-adapted)
  thermalPreference: number;
  // Biological context
  description: string;
  habitat: string;
  dietSummary: string;
  ecologicalRole: string;
  biologicalFacts: string[];
  sources: ScientificSource[];
  // Visual layout in SVG food web (percentage coordinates 0-100)
  diagramPosition: { x: number; y: number };
  color: string;
}

export interface EnvironmentalParameters {
  waterTempAnomaly: number; // °C deviation from baseline (-3.0 to +4.0)
  nutrientAvailability: number; // Relative multiplier (0.2 to 2.0, base 1.0)
  fishingPressure: number; // Relative harvest intensity (0.0 to 2.5, base 0.0)
}

export interface SimulationStepRecord {
  step: number;
  populations: Record<SpeciesId, number>;
  deltas: Record<SpeciesId, number>; // change compared to previous step
  deltaFromBaseline: Record<SpeciesId, number>; // change percentage from t=0
  growthTerms: Record<SpeciesId, number>;
  predationLosses: Record<SpeciesId, number>;
  mortalityLosses: Record<SpeciesId, number>;
  fishingLosses: Record<SpeciesId, number>;
  totalBiomass: number;
  biodiversityIndex: number; // Shannon-Wiener H'
  extinctCount: number;
}

export type CausalRelationshipType =
  | 'direct_perturbation'
  | 'predation_release'
  | 'predator_starvation'
  | 'overgrazing'
  | 'mesopredator_release'
  | 'trophic_cascade'
  | 'environmental_stress'
  | 'nutrient_limitation'
  | 'decomposer_flux';

export interface CausalChainEvent {
  id: string;
  stepObserved: number;
  sourceSpeciesId?: SpeciesId;
  targetSpeciesId: SpeciesId;
  relationship: CausalRelationshipType;
  headline: string;
  explanation: string;
  percentChange: number;
  direction: 'increased' | 'decreased' | 'extinct' | 'restored';
  severity: 'critical' | 'moderate' | 'mild';
}

export interface EcosystemScenario {
  id: string;
  title: string;
  category: 'trophic_cascade' | 'harvest' | 'bottom_up' | 'climate' | 'restoration';
  shortSummary: string;
  question: string;
  hypothesis: string;
  realWorldContext: string;
  initialPopulationOverrides?: Partial<Record<SpeciesId, number>>;
  environmentalOverrides?: Partial<EnvironmentalParameters>;
  highlightedSpecies?: SpeciesId[];
}

export interface EducationalConcept {
  id: string;
  title: string;
  category: string;
  summary: string;
  mechanism: string;
  aquaticExample: string;
  simulatorRelevance: string;
}

export interface TrophicTierSummary {
  tier: number;
  name: string;
  category: TrophicLevelCategory;
  speciesIds: SpeciesId[];
  totalBiomass: number;
  baselineBiomass: number;
  percentChange: number;
  fractionOfEcosystem: number;
}

export interface PerturbationEvent {
  step: number;
  description: string;
  targetId?: SpeciesId;
  type: 'species_modification' | 'environmental_shift' | 'scenario_load';
}
