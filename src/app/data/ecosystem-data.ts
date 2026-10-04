import { Species, EcosystemScenario, EducationalConcept, EnvironmentalParameters } from '../domain/models';

export const DEFAULT_ENVIRONMENT: EnvironmentalParameters = {
  waterTempAnomaly: 0.0,
  nutrientAvailability: 1.0,
  fishingPressure: 0.0,
};

export const SPECIES_REGISTRY: Species[] = [
  {
    id: 'phytoplankton',
    commonName: 'Phytoplankton',
    scientificName: 'Bacillariophyceae & Dinoflagellata',
    trophicLevel: 1.0,
    trophicCategory: 'primary_producer',
    initialPopulation: 100,
    carryingCapacity: 160,
    growthRate: 0.42,
    baselineMortality: 0.08,
    preyIds: [],
    predatorIds: ['zooplankton', 'benthic_bivalves', 'forage_fish'],
    consumptionEfficiency: {},
    handlingTime: {},
    fishingVulnerability: 0.0,
    thermalPreference: 0.1,
    description: 'Microscopic single-celled algae (predominantly diatoms and dinoflagellates) that form the foundational energetic base of coastal marine food webs through photosynthesis.',
    habitat: 'Euphotic surface layer (0–30m depth) along temperate coastal shelves.',
    dietSummary: 'Photoautotrophic: consumes dissolved inorganic nitrogen, phosphorus, and solar irradiance.',
    ecologicalRole: 'Primary producer generating organic carbon and dissolved oxygen that supports all higher trophic marine life.',
    biologicalFacts: [
      'Generates approximately 50% of Earth’s atmospheric oxygen via marine photosynthesis.',
      'Diatom blooms occur rapidly in spring following upwelling of nutrient-rich benthic waters.',
      'Extremely sensitive to nutrient depletion and surface water thermal stratification.'
    ],
    sources: [
      {
        title: 'NOAA Northeast Continental Shelf Ecosystem Status Report',
        institution: 'NOAA Fisheries / NEFSC',
        year: 2024,
        url: 'https://www.fisheries.noaa.gov',
        notes: 'Documented seasonal diatom blooms and coastal chlorophyll-a baselines.'
      },
      {
        title: 'The role of marine phytoplankton in global biogeochemical cycles',
        institution: 'Smithsonian Ocean',
        year: 2021
      }
    ],
    diagramPosition: { x: 22, y: 78 },
    color: '#10b981' // emerald
  },
  {
    id: 'zooplankton',
    commonName: 'Zooplankton',
    scientificName: 'Calanus finmarchicus & Euphausiacea',
    trophicLevel: 2.0,
    trophicCategory: 'primary_consumer',
    initialPopulation: 100,
    carryingCapacity: 140,
    growthRate: 0.28,
    baselineMortality: 0.07,
    preyIds: ['phytoplankton'],
    predatorIds: ['forage_fish', 'crustaceans'],
    consumptionEfficiency: { phytoplankton: 0.0035 },
    handlingTime: { phytoplankton: 0.004 },
    fishingVulnerability: 0.0,
    thermalPreference: -0.4, // cold-water adapted
    description: 'Calanoid copepods and small pelagic crustaceans that graze on phytoplankton, functioning as the primary energetic conduit between algae and forage fish.',
    habitat: 'Mid-water coastal column, undergoing diel vertical migrations between depths at day and surface at night.',
    dietSummary: 'Herbivorous filter-feeding on microscopic phytoplankton cells and ciliates.',
    ecologicalRole: 'Essential trophic intermediary transferring lipids and energy from microalgae to juvenile and pelagic schooling fish.',
    biologicalFacts: [
      'Calanus finmarchicus stores lipid sacs that are critical high-calorie nourishment for larval fish.',
      'Undergoes diel vertical migration: sinks to deeper waters during daytime to evade visual predators.',
      'Vulnerable to thermal warming, which reduces individual body size and reproductive clutch size.'
    ],
    sources: [
      {
        title: 'Calanus finmarchicus in the North Atlantic: Key species in a changing climate',
        institution: 'ICES Journal of Marine Science',
        year: 2022
      },
      {
        title: 'Zooplankton Ecology & Pelagic Food Webs',
        institution: 'NOAA Northeast Fisheries Science Center',
        year: 2023
      }
    ],
    diagramPosition: { x: 38, y: 60 },
    color: '#06b6d4' // cyan
  },
  {
    id: 'benthic_bivalves',
    commonName: 'Benthic Bivalves',
    scientificName: 'Mytilus edulis & Mya arenaria',
    trophicLevel: 2.1,
    trophicCategory: 'primary_consumer',
    initialPopulation: 100,
    carryingCapacity: 130,
    growthRate: 0.20,
    baselineMortality: 0.06,
    preyIds: ['phytoplankton'],
    predatorIds: ['crustaceans', 'predatory_fish'],
    consumptionEfficiency: { phytoplankton: 0.0028 },
    handlingTime: { phytoplankton: 0.005 },
    fishingVulnerability: 0.25,
    thermalPreference: -0.2,
    description: 'Sessile blue mussels and softshell clams anchored to rocky substrate and sediment, actively pumping water to filter phytoplankton and organic particulates.',
    habitat: 'Intertidal and shallow subtidal rocky reefs and sandy muddy bottoms.',
    dietSummary: 'Suspension feeder filtering microalgae, flagellates, and suspended detrital particles from passing currents.',
    ecologicalRole: 'Biofilters maintaining coastal water clarity and structural biogenic reef habitats for epifaunal species.',
    biologicalFacts: [
      'A single adult blue mussel can filter over 40 to 50 liters of seawater each day.',
      'Bivalve aggregations create biogenic reef architecture stabilizing sediments against erosion.',
      'Primary prey for coastal benthic decapod crabs and predatory bottom fish.'
    ],
    sources: [
      {
        title: 'Ecosystem engineers in coastal zones: Bivalve filtration and habitat provision',
        institution: 'Smithsonian Environmental Research Center',
        year: 2020
      },
      {
        title: 'Mytilus edulis Species Profile & Ecological Guidelines',
        institution: 'U.S. Fish & Wildlife Service',
        year: 2019
      }
    ],
    diagramPosition: { x: 16, y: 60 },
    color: '#0284c7' // sky
  },
  {
    id: 'forage_fish',
    commonName: 'Forage Fish',
    scientificName: 'Brevoortia tyrannus & Clupea harengus',
    trophicLevel: 2.8,
    trophicCategory: 'secondary_consumer',
    initialPopulation: 100,
    carryingCapacity: 140,
    growthRate: 0.26,
    baselineMortality: 0.08,
    preyIds: ['zooplankton', 'phytoplankton'],
    predatorIds: ['predatory_fish', 'marine_bird', 'marine_mammal', 'apex_shark'],
    consumptionEfficiency: { zooplankton: 0.0032, phytoplankton: 0.0012 },
    handlingTime: { zooplankton: 0.003, phytoplankton: 0.002 },
    fishingVulnerability: 0.65, // targeted by reduction fishery
    thermalPreference: 0.1,
    description: 'Densely schooling pelagic planktivores (Atlantic menhaden and herring) that form the energetic backbone of coastal predator diets.',
    habitat: 'Coastal bays, estuaries, and continental shelf waters, forming massive synchronized schools.',
    dietSummary: 'Filter-feeding on calanoid copepods, larval crustaceans, and larger phytoplankton cells.',
    ecologicalRole: 'The essential energetic pivot: efficiently converts microscopic plankton into dense, lipid-rich biomass consumed by birds, predatory fish, and marine mammals.',
    biologicalFacts: [
      'Often called "the most important fish in the sea" because nearly every coastal predator feeds upon it.',
      'Adult menhaden possess specialized gill rakers capable of filtering particles down to 100 microns.',
      'Highly sensitive to reduction purse-seine fishing, with removals directly cascading to osprey and striped bass nutrition.'
    ],
    sources: [
      {
        title: 'Atlantic Menhaden Benchmark Stock Assessment',
        institution: 'Atlantic States Marine Fisheries Commission (ASMFC)',
        year: 2023,
        url: 'https://www.asmfc.org'
      },
      {
        title: 'Ecological Role of Forage Fish in Northwest Atlantic Shelf Food Webs',
        institution: 'NOAA Fisheries',
        year: 2022
      }
    ],
    diagramPosition: { x: 42, y: 44 },
    color: '#38bdf8' // light sky
  },
  {
    id: 'crustaceans',
    commonName: 'Crustaceans',
    scientificName: 'Crangon septemspinosa & Callinectes sapidus',
    trophicLevel: 3.0,
    trophicCategory: 'secondary_consumer',
    initialPopulation: 100,
    carryingCapacity: 130,
    growthRate: 0.22,
    baselineMortality: 0.07,
    preyIds: ['zooplankton', 'benthic_bivalves'],
    predatorIds: ['predatory_fish', 'marine_bird', 'marine_mammal'],
    consumptionEfficiency: { zooplankton: 0.0024, benthic_bivalves: 0.0028 },
    handlingTime: { zooplankton: 0.003, benthic_bivalves: 0.005 },
    fishingVulnerability: 0.45,
    thermalPreference: 0.2,
    description: 'Benthic sand shrimp and blue crabs functioning as mobile scavengers and active predators of benthic bivalves and small invertebrates.',
    habitat: 'Estuarine seagrass beds, salt marshes, and shallow continental shelf soft sediments.',
    dietSummary: 'Benthic carnivore and scavenger feeding on small bivalves, worms, and settling zooplankton.',
    ecologicalRole: 'Connects benthic and pelagic food webs by processing benthic shellfish and providing prey for demersal predators.',
    biologicalFacts: [
      'Crabs use powerful chelae (claws) to crush bivalve shells, exerting strong top-down selection on mussel shell thickness.',
      'Subject to severe predation by juvenile and adult striped bass.',
      'Molting periods make crustaceans highly vulnerable to opportunistic predators.'
    ],
    sources: [
      {
        title: 'Blue Crab Trophic Ecology and Subtidal Habitat Dynamics',
        institution: 'Smithsonian Environmental Research Center',
        year: 2021
      },
      {
        title: 'Benthic Invertebrate Communities of the Mid-Atlantic Bight',
        institution: 'U.S. Geological Survey (USGS)',
        year: 2020
      }
    ],
    diagramPosition: { x: 20, y: 44 },
    color: '#f97316' // orange
  },
  {
    id: 'predatory_fish',
    commonName: 'Predatory Fish',
    scientificName: 'Morone saxatilis & Pomatomus saltatrix',
    trophicLevel: 4.0,
    trophicCategory: 'tertiary_consumer',
    initialPopulation: 100,
    carryingCapacity: 120,
    growthRate: 0.16,
    baselineMortality: 0.06,
    preyIds: ['forage_fish', 'crustaceans', 'benthic_bivalves'],
    predatorIds: ['apex_shark', 'marine_mammal'],
    consumptionEfficiency: { forage_fish: 0.0036, crustaceans: 0.0022, benthic_bivalves: 0.0010 },
    handlingTime: { forage_fish: 0.003, crustaceans: 0.004, benthic_bivalves: 0.006 },
    fishingVulnerability: 0.85, // primary recreational & commercial target
    thermalPreference: 0.0,
    description: 'Top predatory finfish such as Striped Bass and Bluefish that migrate along coastal shelf corridors pursuing schooling forage fish and crabs.',
    habitat: 'Coastal waters, tidal rips, estuaries, and surf zones along the Atlantic continental shelf.',
    dietSummary: 'Active piscivore feeding primarily on schooling menhaden, sand lance, crabs, and juvenile fish.',
    ecologicalRole: 'Major tertiary predator exerting top-down control over forage fish and crustacean populations.',
    biologicalFacts: [
      'Anadromous species: adults migrate from saltwater into freshwater rivers to spawn each spring.',
      'Subject to intense recreational and commercial fishing pressure; historically recovered through harvest moratoriums.',
      'When apex sharks decline, predatory fish undergo "mesopredator release" and expand dramatically.'
    ],
    sources: [
      {
        title: 'Striped Bass Stock Assessment and Biological Reference Points',
        institution: 'Atlantic States Marine Fisheries Commission (ASMFC)',
        year: 2024,
        url: 'https://www.asmfc.org'
      },
      {
        title: 'Trophic interactions of coastal piscivores in temperate estuaries',
        institution: 'Marine Ecology Progress Series',
        year: 2022
      }
    ],
    diagramPosition: { x: 34, y: 28 },
    color: '#eab308' // amber/gold
  },
  {
    id: 'marine_bird',
    commonName: 'Marine Bird',
    scientificName: 'Pandion haliaetus & Phalacrocorax auritus',
    trophicLevel: 4.1,
    trophicCategory: 'tertiary_consumer',
    initialPopulation: 100,
    carryingCapacity: 110,
    growthRate: 0.14,
    baselineMortality: 0.05,
    preyIds: ['forage_fish', 'predatory_fish'],
    predatorIds: [],
    consumptionEfficiency: { forage_fish: 0.0030, predatory_fish: 0.0015 },
    handlingTime: { forage_fish: 0.004, predatory_fish: 0.006 },
    fishingVulnerability: 0.10, // indirect bycatch/nest entanglement
    thermalPreference: 0.0,
    description: 'Piscivorous coastal raptors and diving seabirds (Osprey, Double-crested Cormorants) that forage on surface-schooling fish in coastal shallows.',
    habitat: 'Coastal shorelines, estuaries, marsh edges, and offshore feeding waters.',
    dietSummary: 'Specialized piscivore hunting live forage fish and shallow-swimming predatory fish.',
    ecologicalRole: 'Cross-ecosystem energy vector transferring marine biomass to coastal terrestrial and avian food webs.',
    biologicalFacts: [
      'Osprey feet have reversible outer toes and barbed pads (spicules) specialized for gripping slippery live fish.',
      'Nesting success correlates directly with local schooling menhaden and herring density.',
      'Provides an early biological indicator of coastal forage fish depletion.'
    ],
    sources: [
      {
        title: 'Piscivorous bird breeding success linked to forage fish availability',
        institution: 'Journal of Animal Ecology',
        year: 2021
      },
      {
        title: 'Coastal Bird Population Survey and Habitat Protection',
        institution: 'U.S. Fish & Wildlife Service',
        year: 2023
      }
    ],
    diagramPosition: { x: 62, y: 28 },
    color: '#a855f7' // purple/violet-tint neutral
  },
  {
    id: 'marine_mammal',
    commonName: 'Marine Mammal',
    scientificName: 'Phoca vitulina',
    trophicLevel: 4.3,
    trophicCategory: 'tertiary_consumer',
    initialPopulation: 100,
    carryingCapacity: 110,
    growthRate: 0.12,
    baselineMortality: 0.05,
    preyIds: ['forage_fish', 'predatory_fish', 'crustaceans'],
    predatorIds: ['apex_shark'],
    consumptionEfficiency: { forage_fish: 0.0028, predatory_fish: 0.0022, crustaceans: 0.0012 },
    handlingTime: { forage_fish: 0.003, predatory_fish: 0.005, crustaceans: 0.005 },
    fishingVulnerability: 0.15, // gillnet entanglement
    thermalPreference: -0.3, // cold-water pinniped
    description: 'Pinnipeds (Harbor Seals) utilizing coastal ledges and haul-outs, diving to hunt schooling fish, gadids, and macro-crustaceans.',
    habitat: 'Rocky intertidal ledges, sandy barrier islands, and nearshore coastal waters.',
    dietSummary: 'Carnivorous pinniped consuming schooling forage fish, striped bass, flatfish, and crabs.',
    ecologicalRole: 'High-trophic consumer exerting moderate top-down pressure on predatory fish and forage species, while serving as primary prey for large coastal sharks.',
    biologicalFacts: [
      'Can remain submerged for up to 30 minutes while hunting demersal prey along the continental shelf.',
      'Protected under the 1972 Marine Mammal Protection Act, leading to substantial population recoveries in New England.',
      'Significant prey item for apex coastal sharks, driving seasonal shark aggregations near haul-out beaches.'
    ],
    sources: [
      {
        title: 'Harbor Seal Population Assessment & Ecological Role',
        institution: 'NOAA Fisheries / Protected Resources',
        year: 2023
      },
      {
        title: 'Pinniped predation on commercially valuable fish stocks',
        institution: 'Marine Mammal Science',
        year: 2020
      }
    ],
    diagramPosition: { x: 78, y: 28 },
    color: '#64748b' // slate
  },
  {
    id: 'apex_shark',
    commonName: 'Apex Shark',
    scientificName: 'Carcharhinus plumbeus & Carcharodon carcharias',
    trophicLevel: 4.8,
    trophicCategory: 'apex_predator',
    initialPopulation: 100,
    carryingCapacity: 100,
    growthRate: 0.09,
    baselineMortality: 0.04,
    preyIds: ['predatory_fish', 'marine_mammal', 'forage_fish'],
    predatorIds: [],
    consumptionEfficiency: { predatory_fish: 0.0032, marine_mammal: 0.0028, forage_fish: 0.0012 },
    handlingTime: { predatory_fish: 0.004, marine_mammal: 0.006, forage_fish: 0.003 },
    fishingVulnerability: 0.60, // longline and bycatch susceptibility
    thermalPreference: 0.2,
    description: 'Large coastal elasmobranchs (Sandbar, Bull, and White Sharks) that dominate the apex tier of the marine food web with no natural adult predators.',
    habitat: 'Coastal waters, shelf breaks, and pelagic migratory corridors from surface to 200m depth.',
    dietSummary: 'Apex carnivore preying on large predatory teleost fish, harbor seals, and schooling pelagic fish.',
    ecologicalRole: 'Keystone apex predator maintaining ecosystem balance by curbing mesopredator overpopulation and culling diseased individuals.',
    biologicalFacts: [
      'K-selected life history: slow growth, late sexual maturity (10-15 years), and low fecundity make sharks highly vulnerable to overexploitation.',
      'Loss of apex sharks triggers mesopredator release, causing secondary predators to decimate foundational shellfish and forage fish.',
      'Possesses specialized electroreceptors (Ampullae of Lorenzini) capable of sensing minute muscular contractions in prey.'
    ],
    sources: [
      {
        title: 'Cascading effects of the loss of apex predatory sharks from a coastal ocean',
        institution: 'Science (Myers et al.)',
        year: 2007,
        url: 'https://www.science.org/doi/10.1126/science.1138657',
        notes: 'Seminal paper demonstrating shark depletion triggering cownose ray explosion and scallop fishery collapse.'
      },
      {
        title: 'Atlantic Highly Migratory Species Management Overview',
        institution: 'NOAA Fisheries',
        year: 2024
      }
    ],
    diagramPosition: { x: 50, y: 12 },
    color: '#ef4444' // red/crimson
  },
  {
    id: 'benthic_decomposers',
    commonName: 'Benthic Decomposers',
    scientificName: 'Marine Microbiota & Detritivores',
    trophicLevel: 1.5,
    trophicCategory: 'decomposer',
    initialPopulation: 100,
    carryingCapacity: 150,
    growthRate: 0.32,
    baselineMortality: 0.09,
    preyIds: [],
    predatorIds: [],
    consumptionEfficiency: {},
    handlingTime: {},
    fishingVulnerability: 0.0,
    thermalPreference: 0.1,
    description: 'Heterotrophic marine bacteria and benthic micro-invertebrates inhabiting bottom sediments that mineralize organic biological detritus.',
    habitat: 'Benthic sediment-water interface, organic detritus layer, and marine snow aggregates.',
    dietSummary: 'Saprophytic: consumes particulate organic matter, feces, and carcasses settling from upper waters.',
    ecologicalRole: 'Nutrient remineralization: converts organic carcasses and waste back into dissolved nitrate and phosphate required by phytoplankton.',
    biologicalFacts: [
      'Closes the circular nutrient loop: without microbial remineralization, the ocean surface would run out of nutrients in weeks.',
      'Processes the "biological pump" that transports carbon fixed by algae down into deep sediment reservoirs.',
      'Activity increases in response to mass mortality events occurring in the water column above.'
    ],
    sources: [
      {
        title: 'Microbial Oceanography and Benthic-Pelagic Coupling',
        institution: 'Annual Review of Marine Science',
        year: 2022
      },
      {
        title: 'The Biological Pump and Marine Carbon Cycle',
        institution: 'Smithsonian Ocean',
        year: 2021
      }
    ],
    diagramPosition: { x: 80, y: 78 },
    color: '#84cc16' // lime
  }
];

export const SCENARIOS: EcosystemScenario[] = [
  {
    id: 'apex_removal',
    title: 'Apex Predator Depletion',
    category: 'trophic_cascade',
    shortSummary: 'Eliminate apex coastal sharks and observe the resulting mesopredator release cascade.',
    question: 'What happens to lower trophic levels when top-down regulation is removed?',
    hypothesis: 'Without apex shark predation, mid-tier predatory fish will surge, increasing consumption of forage fish and crustaceans, ultimately disrupting plankton balance.',
    realWorldContext: 'Documented globally: overfishing of large coastal sharks (such as sandbar and dusky sharks) led to explosive increases in mesopredators, which subsequently decimated foundational shellfish and forage fish stocks (Myers et al., Science 2007).',
    initialPopulationOverrides: {
      apex_shark: 0
    },
    environmentalOverrides: {
      fishingPressure: 0.0
    },
    highlightedSpecies: ['apex_shark', 'predatory_fish', 'forage_fish', 'zooplankton']
  },
  {
    id: 'targeted_overfishing',
    title: 'Commercial Overfishing of Predatory Fish',
    category: 'harvest',
    shortSummary: 'Apply heavy fishing mortality to commercial predatory finfish (Striped Bass).',
    question: 'How does selective removal of a prized commercial fish propagate both up and down the web?',
    hypothesis: 'Depleting predatory fish relieves predation pressure on forage fish and crustaceans, while starving higher apex predators and seals.',
    realWorldContext: 'In the late 1970s and 1980s, overharvesting reduced Atlantic striped bass stocks to historic lows, triggering emergency moratoria and prompting ecological shifts in forage fish availability.',
    initialPopulationOverrides: {
      predatory_fish: 25
    },
    environmentalOverrides: {
      fishingPressure: 1.4
    },
    highlightedSpecies: ['predatory_fish', 'forage_fish', 'apex_shark', 'marine_bird']
  },
  {
    id: 'reduced_primary_production',
    title: 'Reduced Primary Production (Nutrient Scarcity)',
    category: 'bottom_up',
    shortSummary: 'Severely reduce phytoplankton abundance to simulate nutrient limitation or coastal light blocking.',
    question: 'How does bottom-up resource scarcity propagate upward through sequential trophic levels?',
    hypothesis: 'Plankton depletion will immediately starve primary consumers (zooplankton, bivalves), collapsing the forage fish bridge and ultimately depressing apex predators.',
    realWorldContext: 'Bottom-up forcing occurs during prolonged marine anomalies or when altered coastal currents disrupt nutrient upwelling, causing starvation across higher trophic wildlife.',
    initialPopulationOverrides: {
      phytoplankton: 35
    },
    environmentalOverrides: {
      nutrientAvailability: 0.4
    },
    highlightedSpecies: ['phytoplankton', 'zooplankton', 'forage_fish', 'predatory_fish']
  },
  {
    id: 'marine_heatwave',
    title: 'Marine Heatwave & Thermal Stress',
    category: 'climate',
    shortSummary: 'Introduce a +3.2°C temperature anomaly to test ecosystem resilience under thermal shock.',
    question: 'Which organisms thrive and which suffer when coastal water temperatures spike?',
    hypothesis: 'Cold-adapted zooplankton and pinnipeds will experience elevated metabolic stress and mortality, reducing lipid transfer to forage fish.',
    realWorldContext: 'Unprecedented marine heatwaves in the Gulf of Maine and Mid-Atlantic Bight have displaced cold-water Calanus copepods with smaller, less lipid-rich southern copepod species.',
    environmentalOverrides: {
      waterTempAnomaly: 3.2,
      nutrientAvailability: 0.85
    },
    highlightedSpecies: ['zooplankton', 'marine_mammal', 'forage_fish']
  },
  {
    id: 'predator_restoration',
    title: 'Apex Predator Restoration & Protection',
    category: 'restoration',
    shortSummary: 'Boost apex shark populations to evaluate recovery dynamics in an overgrazed coastal system.',
    question: 'Can reintroducing top predators restore stability to an ecosystem with excessive mesopredators?',
    hypothesis: 'Elevated shark abundance will re-establish top-down control over mesopredators, allowing depressed forage fish and benthic bivalves to rebound.',
    realWorldContext: 'Marine Protected Areas (MPAs) with strict elasmobranch protections demonstrate rapid trophic re-balancing, where apex predators suppress over-abundant herbivores and mesopredators.',
    initialPopulationOverrides: {
      apex_shark: 150,
      predatory_fish: 130
    },
    environmentalOverrides: {
      fishingPressure: 0.0
    },
    highlightedSpecies: ['apex_shark', 'predatory_fish', 'forage_fish']
  }
];

export const EDUCATIONAL_CONCEPTS: EducationalConcept[] = [
  {
    id: 'trophic_cascade',
    title: 'Trophic Cascades',
    category: 'Ecosystem Dynamics',
    summary: 'A powerful indirect ecological interaction that originates at the top of the food web and cascades down through successive trophic levels.',
    mechanism: 'When apex predators are altered, their consumption of secondary consumers changes. This flips the grazing pressure exerted by those secondary consumers on primary consumers, which in turn alters primary producer biomass (an alternating positive/negative sign cascade).',
    aquaticExample: 'Removing coastal sharks relieves predation on mesopredatory fish. These unchecked fish multiply and overconsume forage fish and filter-feeding bivalves, causing coastal water quality to degrade.',
    simulatorRelevance: 'Run Scenario 1 ("Apex Predator Depletion") and track the alternating population changes across tiers in the Population Chart.'
  },
  {
    id: 'carrying_capacity',
    title: 'Carrying Capacity (K) & Logistic Limits',
    category: 'Population Modeling',
    summary: 'The maximum population size of a biological species that a particular environment can sustain indefinitely.',
    mechanism: 'In our discrete-time mathematical model, populations follow logistic self-regulation: as population N approaches carrying capacity K, per-capita growth declines toward zero due to intra-species competition for space, nesting habitat, and dissolved nutrients.',
    aquaticExample: 'Even with unlimited copepods, a coastal estuary has finite reef crevices, spawning nurseries, and oxygen saturation that caps the maximum sustainable density of forage fish.',
    simulatorRelevance: 'Carrying capacity values (K) prevent runaway exponential growth in the simulation and anchor the baseline equilibrium.'
  },
  {
    id: 'functional_response',
    title: 'Holling Type II Functional Response',
    category: 'Mathematical Ecology',
    summary: 'A mathematical description of predator feeding rates that incorporates predator "handling time" and prey density.',
    mechanism: 'Unlike simple linear Lotka-Volterra equations where a predator eats prey at an infinite rate if prey density explodes, Holling Type II introduces saturation: feeding rate increases with prey density at low numbers, but decelerates and levels off at a maximum asymptote as predators spend time capturing, handling, and digesting prey.',
    aquaticExample: 'A striped bass cannot consume an infinite number of menhaden in an hour; pursuit, swallowing, and gut capacity impose a physiological limit regardless of school size.',
    simulatorRelevance: 'This non-linear saturation prevents immediate ecosystem collapse from minor perturbations, producing stable, biologically plausible cycles.'
  },
  {
    id: 'bottom_up_vs_top_down',
    title: 'Top-Down vs. Bottom-Up Regulation',
    category: 'Trophic Control',
    summary: 'The two foundational forces that govern biomass and energy distribution in natural ecosystems.',
    mechanism: 'Top-Down control occurs when predators limit the abundance of their prey. Bottom-Up control occurs when primary production (nutrients and sunlight) limits the total energy available to higher trophic levels.',
    aquaticExample: 'Overfishing sharks is a top-down disturbance. An offshore upwelling collapse or nutrient limitation that cuts phytoplankton production by 60% is a bottom-up disturbance.',
    simulatorRelevance: 'Contrast Scenario 1 (Top-Down: Shark removal) with Scenario 3 (Bottom-Up: Reduced primary production) to see the completely different propagation directions.'
  },
  {
    id: 'model_assumptions',
    title: 'Simulation Assumptions & Model Limitations',
    category: 'Scientific Methodology',
    summary: 'Crucial distinction between educational computational models and predictive ecological stock assessments.',
    mechanism: 'This simulator uses normalized indices (baseline 100) and simplified discrete-time differential equations to demonstrate ecological principles and qualitative relationship dynamics.',
    aquaticExample: 'Real oceans feature complex age structures (larvae vs. juveniles vs. adults), spatial migrations across thousands of miles, multi-species behavioral switching, and fluctuating weather regimes.',
    simulatorRelevance: 'The simulator is designed to build intuition regarding interconnected causal cascades, not to forecast exact commercial fish tonnage or date-specific population counts.'
  }
];
