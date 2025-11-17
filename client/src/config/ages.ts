// Age/Era system configuration for Age of Empires 2 Web

import type { Resources } from '../types/game'

export enum AgeType {
  DarkAge = 'dark_age',
  FeudalAge = 'feudal_age',
  CastleAge = 'castle_age',
  ImperialAge = 'imperial_age',
}

export interface AgeRequirements {
  buildingRequired?: string
  buildingsCount?: number
  resourceCost: Resources
  researchTime: number // in seconds
}

export interface AgeUnlocks {
  units: string[]
  buildings: string[]
  technologies: string[]
}

export interface AgeConfig {
  id: AgeType
  name: string
  description: string
  requirements: AgeRequirements
  unlocks: AgeUnlocks
  bonuses: {
    maxPopulation: number
    buildingHPBonus: number
    militaryUnlockLevel: number
  }
}

export const AGE_PROGRESSION: Record<AgeType, AgeConfig> = {
  [AgeType.DarkAge]: {
    id: AgeType.DarkAge,
    name: 'Dark Age',
    description: 'Starting age - focus on basic economy and exploration',
    requirements: {
      resourceCost: { food: 0, wood: 0, gold: 0, stone: 0 },
      researchTime: 0,
    },
    unlocks: {
      units: ['villager', 'scout'],
      buildings: ['town_center', 'house', 'mill', 'lumber_camp', 'mining_camp', 'dock'],
      technologies: ['loom'],
    },
    bonuses: {
      maxPopulation: 50,
      buildingHPBonus: 0,
      militaryUnlockLevel: 0,
    },
  },

  [AgeType.FeudalAge]: {
    id: AgeType.FeudalAge,
    name: 'Feudal Age',
    description: 'Unlock basic military and economic buildings',
    requirements: {
      buildingsCount: 2, // Need 2 Dark Age buildings (besides houses)
      resourceCost: { food: 500, wood: 0, gold: 0, stone: 0 },
      researchTime: 130, // 130 seconds
    },
    unlocks: {
      units: [
        'militia',
        'spearman',
        'archer',
        'skirmisher',
        'scout_cavalry',
        'fishing_ship',
        'trade_cart',
      ],
      buildings: [
        'barracks',
        'archery_range',
        'stable',
        'market',
        'blacksmith',
        'palisade_wall',
        'palisade_gate',
        'outpost',
      ],
      technologies: [
        'double_bit_axe',
        'horse_collar',
        'wheelbarrow',
        'fletching',
        'padded_archer_armor',
        'forging',
        'scale_mail_armor',
        'scale_barding_armor',
      ],
    },
    bonuses: {
      maxPopulation: 75,
      buildingHPBonus: 0.1,
      militaryUnlockLevel: 1,
    },
  },

  [AgeType.CastleAge]: {
    id: AgeType.CastleAge,
    name: 'Castle Age',
    description: 'Unlock powerful units, castles, and advanced technologies',
    requirements: {
      buildingRequired: 'blacksmith',
      buildingsCount: 2, // Need 2 Feudal Age buildings
      resourceCost: { food: 800, wood: 0, gold: 200, stone: 0 },
      researchTime: 160, // 160 seconds
    },
    unlocks: {
      units: [
        'knight',
        'camel',
        'crossbowman',
        'pikeman',
        'eagle_warrior',
        'monk',
        'battering_ram',
        'mangonel',
        'scorpion',
        'galley',
        'fire_ship',
      ],
      buildings: [
        'castle',
        'university',
        'monastery',
        'siege_workshop',
        'stone_wall',
        'stone_gate',
        'watch_tower',
      ],
      technologies: [
        'bow_saw',
        'heavy_plow',
        'hand_cart',
        'bodkin_arrow',
        'leather_archer_armor',
        'iron_casting',
        'chain_mail_armor',
        'chain_barding_armor',
        'ballistics',
        'murder_holes',
        'squires',
        'arson',
      ],
    },
    bonuses: {
      maxPopulation: 100,
      buildingHPBonus: 0.2,
      militaryUnlockLevel: 2,
    },
  },

  [AgeType.ImperialAge]: {
    id: AgeType.ImperialAge,
    name: 'Imperial Age',
    description: 'Unlock elite units and ultimate technologies',
    requirements: {
      buildingRequired: 'castle',
      buildingsCount: 2, // Need 2 Castle Age buildings (Castle or University)
      resourceCost: { food: 1000, wood: 0, gold: 800, stone: 0 },
      researchTime: 190, // 190 seconds
    },
    unlocks: {
      units: [
        'paladin',
        'heavy_camel',
        'arbalest',
        'halberdier',
        'elite_eagle_warrior',
        'hand_cannoneer',
        'bombard_cannon',
        'siege_ram',
        'onager',
        'heavy_scorpion',
        'war_galley',
        'fast_fire_ship',
      ],
      buildings: ['wonder'],
      technologies: [
        'two_man_saw',
        'crop_rotation',
        'bracer',
        'ring_archer_armor',
        'blast_furnace',
        'plate_mail_armor',
        'plate_barding_armor',
        'chemistry',
        'siege_engineers',
        'hoardings',
        'sappers',
        'conscription',
        'spies',
      ],
    },
    bonuses: {
      maxPopulation: 200,
      buildingHPBonus: 0.3,
      militaryUnlockLevel: 3,
    },
  },
}

export interface PlayerAge {
  currentAge: AgeType
  isResearching: boolean
  researchProgress: number
  nextAge?: AgeType
}

export function getNextAge(currentAge: AgeType): AgeType | null {
  switch (currentAge) {
    case AgeType.DarkAge:
      return AgeType.FeudalAge
    case AgeType.FeudalAge:
      return AgeType.CastleAge
    case AgeType.CastleAge:
      return AgeType.ImperialAge
    case AgeType.ImperialAge:
      return null
    default:
      return null
  }
}

export function canAdvanceToAge(
  currentAge: AgeType,
  resources: Resources,
  buildingsBuilt: string[]
): { canAdvance: boolean; reason?: string } {
  const nextAge = getNextAge(currentAge)
  if (!nextAge) {
    return { canAdvance: false, reason: 'Already at maximum age' }
  }

  const ageConfig = AGE_PROGRESSION[nextAge]
  const requirements = ageConfig.requirements

  // Check resource cost
  if (
    resources.food < requirements.resourceCost.food ||
    resources.wood < requirements.resourceCost.wood ||
    resources.gold < requirements.resourceCost.gold ||
    resources.stone < requirements.resourceCost.stone
  ) {
    return {
      canAdvance: false,
      reason: `Insufficient resources. Need ${requirements.resourceCost.food}F ${requirements.resourceCost.gold}G`,
    }
  }

  // Check building requirements
  if (requirements.buildingRequired) {
    const hasRequiredBuilding = buildingsBuilt.some((b) =>
      b.includes(requirements.buildingRequired!)
    )
    if (!hasRequiredBuilding) {
      return {
        canAdvance: false,
        reason: `Need to build ${requirements.buildingRequired}`,
      }
    }
  }

  if (requirements.buildingsCount) {
    // This is a simplified check - in reality, we'd need to count specific building types
    if (buildingsBuilt.length < requirements.buildingsCount) {
      return {
        canAdvance: false,
        reason: `Need ${requirements.buildingsCount} buildings from previous age`,
      }
    }
  }

  return { canAdvance: true }
}

export function getAgeConfig(age: AgeType): AgeConfig {
  return AGE_PROGRESSION[age]
}

export function getAllAges(): AgeConfig[] {
  return [
    AGE_PROGRESSION[AgeType.DarkAge],
    AGE_PROGRESSION[AgeType.FeudalAge],
    AGE_PROGRESSION[AgeType.CastleAge],
    AGE_PROGRESSION[AgeType.ImperialAge],
  ]
}

export function isUnitUnlockedInAge(unitType: string, age: AgeType): boolean {
  const ageConfig = AGE_PROGRESSION[age]
  return ageConfig.unlocks.units.includes(unitType)
}

export function isBuildingUnlockedInAge(buildingType: string, age: AgeType): boolean {
  const ageConfig = AGE_PROGRESSION[age]
  return ageConfig.unlocks.buildings.includes(buildingType)
}

export function isTechnologyUnlockedInAge(technologyId: string, age: AgeType): boolean {
  const ageConfig = AGE_PROGRESSION[age]
  return ageConfig.unlocks.technologies.includes(technologyId)
}

// Helper to get all available units up to current age
export function getAvailableUnits(currentAge: AgeType): string[] {
  const units: string[] = []
  const ages = [AgeType.DarkAge, AgeType.FeudalAge, AgeType.CastleAge, AgeType.ImperialAge]

  for (const age of ages) {
    units.push(...AGE_PROGRESSION[age].unlocks.units)
    if (age === currentAge) break
  }

  return units
}

// Helper to get all available buildings up to current age
export function getAvailableBuildings(currentAge: AgeType): string[] {
  const buildings: string[] = []
  const ages = [AgeType.DarkAge, AgeType.FeudalAge, AgeType.CastleAge, AgeType.ImperialAge]

  for (const age of ages) {
    buildings.push(...AGE_PROGRESSION[age].unlocks.buildings)
    if (age === currentAge) break
  }

  return buildings
}

// Helper to get all available technologies up to current age
export function getAvailableTechnologies(currentAge: AgeType): string[] {
  const technologies: string[] = []
  const ages = [AgeType.DarkAge, AgeType.FeudalAge, AgeType.CastleAge, AgeType.ImperialAge]

  for (const age of ages) {
    technologies.push(...AGE_PROGRESSION[age].unlocks.technologies)
    if (age === currentAge) break
  }

  return technologies
}
