// Civilizations configuration for Age of Empires 2 Web

export enum CivilizationType {
  Britons = 'britons',
  Franks = 'franks',
  Goths = 'goths',
  Teutons = 'teutons',
  Japanese = 'japanese',
  Chinese = 'chinese',
  Byzantines = 'byzantines',
  Persians = 'persians',
  Saracens = 'saracens',
  Turks = 'turks',
  Vikings = 'vikings',
  Mongols = 'mongols',
}

export enum BonusType {
  UnitCost = 'unit_cost',
  UnitHP = 'unit_hp',
  UnitAttack = 'unit_attack',
  UnitDefense = 'unit_defense',
  UnitSpeed = 'unit_speed',
  UnitRange = 'unit_range',
  UnitTrainingSpeed = 'unit_training_speed',
  BuildingHP = 'building_hp',
  BuildingCost = 'building_cost',
  ResourceGathering = 'resource_gathering',
  TechnologyCost = 'technology_cost',
  StartingResources = 'starting_resources',
  PopulationSpace = 'population_space',
}

export interface CivilizationBonus {
  type: BonusType
  value: number
  target?: string // Unit type, building type, or resource type
  description: string
}

export interface CivilizationConfig {
  id: CivilizationType
  name: string
  description: string
  bonuses: CivilizationBonus[]
  uniqueUnits: string[]
  uniqueTechnologies: string[]
  teamBonus: CivilizationBonus
}

export const CIVILIZATIONS: Record<CivilizationType, CivilizationConfig> = {
  [CivilizationType.Britons]: {
    id: CivilizationType.Britons,
    name: 'Britons',
    description: 'Masters of archery with exceptional range and economy',
    bonuses: [
      {
        type: BonusType.UnitRange,
        value: 1,
        target: 'archer',
        description: 'Archers have +1 range in Castle Age, +2 in Imperial Age',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.25,
        target: 'food',
        description: 'Shepherds work 25% faster',
      },
      {
        type: BonusType.BuildingCost,
        value: -0.1,
        target: 'town_center',
        description: 'Town Centers cost -10% wood (Age 2+)',
      },
    ],
    uniqueUnits: ['longbowman', 'warwolf'],
    uniqueTechnologies: ['yeomen', 'warwolf'],
    teamBonus: {
      type: BonusType.UnitTrainingSpeed,
      value: 0.2,
      target: 'archery_range',
      description: 'Archery Ranges work 20% faster',
    },
  },

  [CivilizationType.Franks]: {
    id: CivilizationType.Franks,
    name: 'Franks',
    description: 'Powerful cavalry civilization with strong economy',
    bonuses: [
      {
        type: BonusType.UnitHP,
        value: 20,
        target: 'knight',
        description: 'Cavalry +20% HP',
      },
      {
        type: BonusType.BuildingCost,
        value: -0.25,
        target: 'castle',
        description: 'Castles cost -25%',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.15,
        target: 'food',
        description: 'Foragers work 15% faster',
      },
    ],
    uniqueUnits: ['throwing_axeman', 'paladin'],
    uniqueTechnologies: ['bearded_axe', 'chivalry'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 2,
      target: 'knight',
      description: 'Knights have +2 line of sight',
    },
  },

  [CivilizationType.Goths]: {
    id: CivilizationType.Goths,
    name: 'Goths',
    description: 'Infantry specialists with overwhelming numbers',
    bonuses: [
      {
        type: BonusType.UnitCost,
        value: -0.35,
        target: 'militia',
        description: 'Infantry cost -35%',
      },
      {
        type: BonusType.UnitTrainingSpeed,
        value: 0.2,
        target: 'barracks',
        description: 'Infantry train 20% faster',
      },
      {
        type: BonusType.PopulationSpace,
        value: 10,
        description: '+10 population in Imperial Age',
      },
    ],
    uniqueUnits: ['huskarl', 'elite_huskarl'],
    uniqueTechnologies: ['anarchy', 'perfusion'],
    teamBonus: {
      type: BonusType.UnitTrainingSpeed,
      value: 0.2,
      target: 'barracks',
      description: 'Barracks work 20% faster',
    },
  },

  [CivilizationType.Teutons]: {
    id: CivilizationType.Teutons,
    name: 'Teutons',
    description: 'Defensive powerhouse with strong melee units',
    bonuses: [
      {
        type: BonusType.UnitDefense,
        value: 2,
        target: 'militia',
        description: 'Infantry +2 melee armor',
      },
      {
        type: BonusType.BuildingHP,
        value: 0.25,
        description: 'Buildings +25% HP',
      },
      {
        type: BonusType.TechnologyCost,
        value: -0.33,
        description: 'Farm upgrades free',
      },
    ],
    uniqueUnits: ['teutonic_knight', 'elite_teutonic_knight'],
    uniqueTechnologies: ['ironclad', 'crenellations'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 2,
      description: 'Units resist conversion better',
    },
  },

  [CivilizationType.Japanese]: {
    id: CivilizationType.Japanese,
    name: 'Japanese',
    description: 'Fast-attacking infantry and efficient fishing',
    bonuses: [
      {
        type: BonusType.UnitSpeed,
        value: 0.33,
        target: 'militia',
        description: 'Infantry attack 33% faster',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.5,
        target: 'fish',
        description: 'Fishing ships work 50% faster',
      },
      {
        type: BonusType.BuildingCost,
        value: -0.5,
        target: 'mill',
        description: 'Mills, Lumber Camps, Mining Camps cost -50%',
      },
    ],
    uniqueUnits: ['samurai', 'elite_samurai'],
    uniqueTechnologies: ['yasama', 'kataparuto'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 2,
      target: 'archery_range',
      description: 'Archery ranges work 25% faster',
    },
  },

  [CivilizationType.Chinese]: {
    id: CivilizationType.Chinese,
    name: 'Chinese',
    description: 'Strong start with extra villagers and diverse tech tree',
    bonuses: [
      {
        type: BonusType.StartingResources,
        value: 3,
        description: 'Start with 3 extra villagers, -200 food, -50 wood',
      },
      {
        type: BonusType.TechnologyCost,
        value: -0.1,
        description: 'Technologies cost -10% in Feudal, -15% in Castle, -20% in Imperial',
      },
      {
        type: BonusType.BuildingHP,
        value: 0.5,
        target: 'town_center',
        description: 'Town Centers support 10 population',
      },
    ],
    uniqueUnits: ['chu_ko_nu', 'elite_chu_ko_nu'],
    uniqueTechnologies: ['great_wall', 'rocketry'],
    teamBonus: {
      type: BonusType.ResourceGathering,
      value: 0.1,
      description: 'Farms +45 food',
    },
  },

  [CivilizationType.Byzantines]: {
    id: CivilizationType.Byzantines,
    name: 'Byzantines',
    description: 'Defensive specialists with cheap counter units',
    bonuses: [
      {
        type: BonusType.UnitCost,
        value: -0.25,
        target: 'spearman',
        description: 'Counter units (Camels, Halberdiers, Skirmishers) cost -25%',
      },
      {
        type: BonusType.BuildingHP,
        value: 0.1,
        description: 'Buildings +10% HP in Feudal, +20% Castle, +30% Imperial',
      },
      {
        type: BonusType.TechnologyCost,
        value: -0.5,
        target: 'imperial_age',
        description: 'Imperial Age costs -33%',
      },
    ],
    uniqueUnits: ['cataphract', 'elite_cataphract'],
    uniqueTechnologies: ['greek_fire', 'logistica'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 1,
      description: 'Monks heal 50% faster',
    },
  },

  [CivilizationType.Persians]: {
    id: CivilizationType.Persians,
    name: 'Persians',
    description: 'Strong cavalry and fast-working Town Centers',
    bonuses: [
      {
        type: BonusType.UnitTrainingSpeed,
        value: 0.5,
        target: 'town_center',
        description: 'Town Centers work 50% faster',
      },
      {
        type: BonusType.UnitHP,
        value: 0.5,
        target: 'knight',
        description: 'Cavalry +50% vs archers',
      },
      {
        type: BonusType.StartingResources,
        value: 50,
        target: 'food',
        description: 'Start with +50 food, +50 wood',
      },
    ],
    uniqueUnits: ['war_elephant', 'elite_war_elephant'],
    uniqueTechnologies: ['kamandaran', 'mahouts'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 2,
      target: 'knight',
      description: 'Knights have +2 attack vs archers',
    },
  },

  [CivilizationType.Saracens]: {
    id: CivilizationType.Saracens,
    name: 'Saracens',
    description: 'Trade and camel cavalry specialists',
    bonuses: [
      {
        type: BonusType.ResourceGathering,
        value: 0.33,
        target: 'gold',
        description: 'Market trade cost -5%, Market techs free',
      },
      {
        type: BonusType.UnitSpeed,
        value: 0.1,
        target: 'camel',
        description: 'Cavalry archers +4 vs buildings',
      },
      {
        type: BonusType.UnitTrainingSpeed,
        value: 0.5,
        target: 'archery_range',
        description: 'Foot archers +1 attack vs buildings',
      },
    ],
    uniqueUnits: ['mameluke', 'elite_mameluke'],
    uniqueTechnologies: ['zealotry', 'counterweights'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 1,
      target: 'archery_range',
      description: 'Foot archers +1 attack vs buildings (team)',
    },
  },

  [CivilizationType.Turks]: {
    id: CivilizationType.Turks,
    name: 'Turks',
    description: 'Gunpowder specialists with strong cavalry',
    bonuses: [
      {
        type: BonusType.UnitCost,
        value: -0.25,
        target: 'gunpowder',
        description: 'Gunpowder units +25% HP',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.2,
        target: 'gold',
        description: 'Gold miners work 20% faster',
      },
      {
        type: BonusType.TechnologyCost,
        value: -0.5,
        target: 'chemistry',
        description: 'Chemistry free',
      },
    ],
    uniqueUnits: ['janissary', 'elite_janissary'],
    uniqueTechnologies: ['sipahi', 'artillery'],
    teamBonus: {
      type: BonusType.UnitTrainingSpeed,
      value: 0.25,
      target: 'gunpowder',
      description: 'Gunpowder units created 25% faster',
    },
  },

  [CivilizationType.Vikings]: {
    id: CivilizationType.Vikings,
    name: 'Vikings',
    description: 'Naval and infantry powerhouse',
    bonuses: [
      {
        type: BonusType.UnitHP,
        value: 0.1,
        target: 'warship',
        description: 'Warships cost -15% in Feudal, -20% Castle, -25% Imperial',
      },
      {
        type: BonusType.UnitCost,
        value: -0.15,
        target: 'militia',
        description: 'Infantry +10% HP in Feudal, +15% Castle, +20% Imperial',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.15,
        target: 'food',
        description: 'Wheelbarrow, Hand Cart free',
      },
    ],
    uniqueUnits: ['berserk', 'elite_berserk'],
    uniqueTechnologies: ['chieftains', 'berserkergang'],
    teamBonus: {
      type: BonusType.BuildingCost,
      value: -0.25,
      target: 'dock',
      description: 'Docks cost -25%',
    },
  },

  [CivilizationType.Mongols]: {
    id: CivilizationType.Mongols,
    name: 'Mongols',
    description: 'Cavalry archer masters with mobile tactics',
    bonuses: [
      {
        type: BonusType.UnitSpeed,
        value: 0.5,
        target: 'cavalry_archer',
        description: 'Cavalry archers fire 25% faster',
      },
      {
        type: BonusType.UnitHP,
        value: 0.5,
        target: 'scout',
        description: 'Light cavalry +30% HP',
      },
      {
        type: BonusType.ResourceGathering,
        value: 0.5,
        target: 'food',
        description: 'Hunters work 50% faster',
      },
    ],
    uniqueUnits: ['mangudai', 'elite_mangudai'],
    uniqueTechnologies: ['nomads', 'drill'],
    teamBonus: {
      type: BonusType.UnitRange,
      value: 2,
      target: 'scout',
      description: 'Scout Cavalry line +2 line of sight',
    },
  },
}

export function getCivilizationConfig(civType: CivilizationType): CivilizationConfig {
  return CIVILIZATIONS[civType]
}

export function getAllCivilizations(): CivilizationConfig[] {
  return Object.values(CIVILIZATIONS)
}

export function applyCivilizationBonus(
  baseValue: number,
  bonus: CivilizationBonus,
  target?: string
): number {
  if (bonus.target && bonus.target !== target) {
    return baseValue
  }

  switch (bonus.type) {
    case BonusType.UnitCost:
    case BonusType.BuildingCost:
    case BonusType.TechnologyCost:
    case BonusType.ResourceGathering:
      return baseValue * (1 + bonus.value)
    case BonusType.UnitHP:
    case BonusType.BuildingHP:
    case BonusType.UnitAttack:
    case BonusType.UnitDefense:
    case BonusType.UnitRange:
      return baseValue + bonus.value
    case BonusType.StartingResources:
    case BonusType.PopulationSpace:
      return baseValue + bonus.value
    default:
      return baseValue
  }
}
