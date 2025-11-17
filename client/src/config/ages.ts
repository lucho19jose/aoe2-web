/**
 * Age System - Dark Age, Feudal Age, Castle Age, Imperial Age
 * Controls technology progression and unlocks
 */

export type AgeType = 'dark' | 'feudal' | 'castle' | 'imperial'

export interface AgeRequirement {
  food: number
  gold: number
  buildings?: string[] // Required buildings to advance
}

export interface AgeUnlock {
  units: string[]
  buildings: string[]
  technologies: string[]
}

export interface Age {
  id: AgeType
  name: string
  displayName: string
  researchTime: number // seconds
  cost: AgeRequirement
  unlocks: AgeUnlock
  description: string
}

export const AGES: Record<AgeType, Age> = {
  dark: {
    id: 'dark',
    name: 'Dark Age',
    displayName: 'Edad Oscura',
    researchTime: 0,
    cost: {
      food: 0,
      gold: 0
    },
    unlocks: {
      units: ['villager', 'militia'],
      buildings: [
        'town_center',
        'house',
        'barracks',
        'lumber_camp',
        'mining_camp',
        'mill'
      ],
      technologies: [
        'loom' // +15 HP, +1/+1 armor for villagers
      ]
    },
    description: 'Edad inicial. Enfócate en recolectar recursos y explorar.'
  },

  feudal: {
    id: 'feudal',
    name: 'Feudal Age',
    displayName: 'Edad Feudal',
    researchTime: 130, // 2:10 minutes
    cost: {
      food: 500,
      gold: 0,
      buildings: ['barracks', 'barracks'] // Need 2 dark age buildings
    },
    unlocks: {
      units: [
        'archer',
        'skirmisher',
        'spearman',
        'scout_cavalry',
        'man_at_arms' // upgraded militia
      ],
      buildings: [
        'archery_range',
        'stable',
        'blacksmith',
        'market',
        'palisade_wall',
        'palisade_gate',
        'outpost',
        'dock'
      ],
      technologies: [
        'double_bit_axe', // Wood gathering +20%
        'horse_collar', // Farm food +75
        'gold_mining', // Gold gathering +15%
        'stone_mining', // Stone gathering +15%
        'padded_archer_armor', // Archer armor +1/+1
        'fletching', // Archer attack +1, range +1
        'forging', // Infantry/cavalry attack +1
        'scale_mail_armor', // Infantry armor +1/+1
        'scale_barding_armor' // Cavalry armor +1/+1
      ]
    },
    description: 'Primera mejora de edad. Desbloquea unidades militares básicas y economía mejorada.'
  },

  castle: {
    id: 'castle',
    name: 'Castle Age',
    displayName: 'Edad de los Castillos',
    researchTime: 160, // 2:40 minutes
    cost: {
      food: 800,
      gold: 200,
      buildings: ['archery_range', 'stable'] // Need 2 feudal age buildings
    },
    unlocks: {
      units: [
        'knight',
        'crossbowman',
        'pikeman',
        'mangonel', // siege weapon
        'monk',
        'battering_ram'
      ],
      buildings: [
        'castle',
        'siege_workshop',
        'monastery',
        'university',
        'stone_wall',
        'stone_gate',
        'guard_tower'
      ],
      technologies: [
        'bow_saw', // Wood gathering +20%
        'heavy_plow', // Farm food +125
        'gold_shaft_mining', // Gold gathering +15%
        'stone_shaft_mining', // Stone gathering +15%
        'bodkin_arrow', // Archer attack +1, range +1
        'leather_archer_armor', // Archer armor +1/+1
        'iron_casting', // Infantry/cavalry attack +1
        'chain_mail_armor', // Infantry armor +1/+1
        'chain_barding_armor', // Cavalry armor +1/+1
        'siege_engineers', // Siege weapons +1 range
        'murder_holes', // Towers +3 attack vs rams
        'hoardings', // Castle min range removed
        'heated_shot', // Towers +125% attack vs ships
        'ballistics', // Missile units fire more accurately
        'chemistry', // Gunpowder units +1 attack
        'redemption', // Monks can convert siege
        'atonement', // Monks can convert monks
        'block_printing', // Monk conversion speed +33%
        'sanctity', // Monk HP +15
        'fervor' // Monk speed +15%
      ]
    },
    description: 'Edad media. Desbloquea caballería pesada, monjes, asedio y castillos.'
  },

  imperial: {
    id: 'imperial',
    name: 'Imperial Age',
    displayName: 'Edad Imperial',
    researchTime: 190, // 3:10 minutes
    cost: {
      food: 1000,
      gold: 800,
      buildings: ['castle', 'university'] // Need 2 castle age buildings
    },
    unlocks: {
      units: [
        'paladin', // upgraded knight
        'arbalester', // upgraded crossbowman
        'halberdier', // upgraded pikeman
        'onager', // upgraded mangonel
        'trebuchet',
        'bombard_cannon',
        'elite_skirmisher',
        'champion', // upgraded swordsman
        'heavy_cavalry_archer',
        'hussar' // upgraded light cavalry
      ],
      buildings: [
        'wonder',
        'bombard_tower',
        'keep' // upgraded guard tower
      ],
      technologies: [
        'two_man_saw', // Wood gathering +10%
        'crop_rotation', // Farm food +175
        'guilds', // Trade gold +15%
        'ring_archer_armor', // Archer armor +1/+2
        'bracer', // Archer attack +1, range +1
        'blast_furnace', // Infantry/cavalry attack +2
        'plate_mail_armor', // Infantry armor +1/+2
        'plate_barding_armor', // Cavalry armor +1/+2
        'siege_onager', // Onager upgrade
        'capped_ram', // Ram upgrade
        'heavy_scorpion', // Scorpion upgrade
        'faith', // Monks convert 50% slower
        'illumination', // Monk tech research faster
        'theocracy', // Only one monk needed for conversions
        'heresy', // Converted units die instead
        'sappers', // Infantry +15 attack vs buildings
        'arrowslits', // Towers +5 attack
        'hoardings', // Castles +1/+1 armor
        'conscription', // Military units created 33% faster
        'spies', // Reveal enemy positions
        'architecture', // Buildings +20% HP
        'chemistry', // Gunpowder units +1 attack
        'bombard_tower_tech' // Bombard Tower upgrade
      ]
    },
    description: 'Edad final. Desbloquea las unidades y tecnologías más poderosas.'
  }
}

/**
 * Get age configuration
 */
export function getAge(ageId: AgeType): Age {
  return AGES[ageId]
}

/**
 * Get all ages in progression order
 */
export function getAllAges(): Age[] {
  return [
    AGES.dark,
    AGES.feudal,
    AGES.castle,
    AGES.imperial
  ]
}

/**
 * Get next age
 */
export function getNextAge(currentAge: AgeType): Age | null {
  const ageOrder: AgeType[] = ['dark', 'feudal', 'castle', 'imperial']
  const currentIndex = ageOrder.indexOf(currentAge)

  if (currentIndex === -1 || currentIndex === ageOrder.length - 1) {
    return null
  }

  return AGES[ageOrder[currentIndex + 1]]
}

/**
 * Check if player can advance to next age
 */
export function canAdvanceAge(
  currentAge: AgeType,
  playerResources: { food: number; gold: number },
  buildingsOwned: string[]
): { canAdvance: boolean; reason?: string } {
  const nextAge = getNextAge(currentAge)

  if (!nextAge) {
    return { canAdvance: false, reason: 'Ya estás en la edad máxima' }
  }

  // Check resources
  if (playerResources.food < nextAge.cost.food) {
    return {
      canAdvance: false,
      reason: `Necesitas ${nextAge.cost.food} comida (tienes ${playerResources.food})`
    }
  }

  if (playerResources.gold < nextAge.cost.gold) {
    return {
      canAdvance: false,
      reason: `Necesitas ${nextAge.cost.gold} oro (tienes ${playerResources.gold})`
    }
  }

  // Check required buildings
  if (nextAge.cost.buildings) {
    const requiredCount = nextAge.cost.buildings.length
    const ownedCount = buildingsOwned.filter(b =>
      nextAge.cost.buildings!.includes(b)
    ).length

    if (ownedCount < requiredCount) {
      return {
        canAdvance: false,
        reason: `Necesitas ${requiredCount} edificios de la edad anterior`
      }
    }
  }

  return { canAdvance: true }
}

/**
 * Check if unit is unlocked in current age
 */
export function isUnitUnlocked(unitType: string, currentAge: AgeType): boolean {
  const ageOrder: AgeType[] = ['dark', 'feudal', 'castle', 'imperial']
  const currentAgeIndex = ageOrder.indexOf(currentAge)

  // Check all ages up to and including current age
  for (let i = 0; i <= currentAgeIndex; i++) {
    const age = AGES[ageOrder[i]]
    if (age.unlocks.units.includes(unitType)) {
      return true
    }
  }

  return false
}

/**
 * Check if building is unlocked in current age
 */
export function isBuildingUnlocked(buildingType: string, currentAge: AgeType): boolean {
  const ageOrder: AgeType[] = ['dark', 'feudal', 'castle', 'imperial']
  const currentAgeIndex = ageOrder.indexOf(currentAge)

  // Check all ages up to and including current age
  for (let i = 0; i <= currentAgeIndex; i++) {
    const age = AGES[ageOrder[i]]
    if (age.unlocks.buildings.includes(buildingType)) {
      return true
    }
  }

  return false
}

/**
 * Check if technology is unlocked in current age
 */
export function isTechnologyUnlocked(techId: string, currentAge: AgeType): boolean {
  const ageOrder: AgeType[] = ['dark', 'feudal', 'castle', 'imperial']
  const currentAgeIndex = ageOrder.indexOf(currentAge)

  // Check all ages up to and including current age
  for (let i = 0; i <= currentAgeIndex; i++) {
    const age = AGES[ageOrder[i]]
    if (age.unlocks.technologies.includes(techId)) {
      return true
    }
  }

  return false
}
