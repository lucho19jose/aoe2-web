/**
 * Technology configuration and definitions
 */

export enum TechCategory {
  MILITARY = 'military',
  ECONOMY = 'economy',
  DEFENSE = 'defense'
}

export interface Technology {
  id: string
  name: string
  description: string
  category: TechCategory
  cost: {
    food?: number
    wood?: number
    gold?: number
    stone?: number
  }
  researchTime: number // in seconds
  effects: {
    type: 'unit_stat' | 'building_stat' | 'resource_rate' | 'unlock'
    target?: string
    stat?: string
    value: number | string
  }[]
  requires?: string[] // Technology IDs that must be researched first
  availableAt: string[] // Building types where this can be researched
  age?: number // Minimum age required (1-4)
}

export const TECHNOLOGIES: Record<string, Technology> = {
  // Military Technologies - Blacksmith
  FORGING: {
    id: 'forging',
    name: 'Forging',
    description: '+1 attack for infantry',
    category: TechCategory.MILITARY,
    cost: { food: 150 },
    researchTime: 50,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'swordsman', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'spearman', stat: 'attack', value: 1 }
    ],
    availableAt: ['blacksmith']
  },

  IRON_CASTING: {
    id: 'iron_casting',
    name: 'Iron Casting',
    description: '+1 attack for infantry',
    category: TechCategory.MILITARY,
    cost: { food: 220, gold: 120 },
    researchTime: 75,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'swordsman', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'spearman', stat: 'attack', value: 1 }
    ],
    requires: ['forging'],
    availableAt: ['blacksmith']
  },

  FLETCHING: {
    id: 'fletching',
    name: 'Fletching',
    description: '+1 attack and +1 range for archers',
    category: TechCategory.MILITARY,
    cost: { food: 100, gold: 50 },
    researchTime: 40,
    effects: [
      { type: 'unit_stat', target: 'archer', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'archer', stat: 'range', value: 1 }
    ],
    availableAt: ['blacksmith']
  },

  BODKIN_ARROW: {
    id: 'bodkin_arrow',
    name: 'Bodkin Arrow',
    description: '+1 attack and +1 range for archers',
    category: TechCategory.MILITARY,
    cost: { food: 200, gold: 100 },
    researchTime: 50,
    effects: [
      { type: 'unit_stat', target: 'archer', stat: 'attack', value: 1 },
      { type: 'unit_stat', target: 'archer', stat: 'range', value: 1 }
    ],
    requires: ['fletching'],
    availableAt: ['blacksmith']
  },

  SCALE_MAIL: {
    id: 'scale_mail',
    name: 'Scale Mail Armor',
    description: '+1 armor for infantry',
    category: TechCategory.DEFENSE,
    cost: { food: 100 },
    researchTime: 40,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'defense', value: 1 },
      { type: 'unit_stat', target: 'swordsman', stat: 'defense', value: 1 },
      { type: 'unit_stat', target: 'spearman', stat: 'defense', value: 1 }
    ],
    availableAt: ['blacksmith']
  },

  CHAIN_MAIL: {
    id: 'chain_mail',
    name: 'Chain Mail Armor',
    description: '+1 armor for infantry',
    category: TechCategory.DEFENSE,
    cost: { food: 200, gold: 100 },
    researchTime: 55,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'defense', value: 1 },
      { type: 'unit_stat', target: 'swordsman', stat: 'defense', value: 1 },
      { type: 'unit_stat', target: 'spearman', stat: 'defense', value: 1 }
    ],
    requires: ['scale_mail'],
    availableAt: ['blacksmith']
  },

  // Economy Technologies - Market
  WHEELBARROW: {
    id: 'wheelbarrow',
    name: 'Wheelbarrow',
    description: 'Villagers carry +25% resources and move 10% faster',
    category: TechCategory.ECONOMY,
    cost: { food: 175, wood: 50 },
    researchTime: 75,
    effects: [
      { type: 'unit_stat', target: 'villager', stat: 'speed', value: 0.5 },
      { type: 'resource_rate', stat: 'carry_capacity', value: 1.25 }
    ],
    availableAt: ['market']
  },

  HAND_CART: {
    id: 'hand_cart',
    name: 'Hand Cart',
    description: 'Villagers carry +50% resources and move 10% faster',
    category: TechCategory.ECONOMY,
    cost: { food: 300, wood: 200 },
    researchTime: 55,
    effects: [
      { type: 'unit_stat', target: 'villager', stat: 'speed', value: 0.5 },
      { type: 'resource_rate', stat: 'carry_capacity', value: 1.5 }
    ],
    requires: ['wheelbarrow'],
    availableAt: ['market']
  },

  GOLD_MINING: {
    id: 'gold_mining',
    name: 'Gold Mining',
    description: '+15% gold mining rate',
    category: TechCategory.ECONOMY,
    cost: { food: 100, wood: 75 },
    researchTime: 30,
    effects: [
      { type: 'resource_rate', stat: 'gold', value: 1.15 }
    ],
    availableAt: ['market']
  },

  STONE_MINING: {
    id: 'stone_mining',
    name: 'Stone Mining',
    description: '+15% stone mining rate',
    category: TechCategory.ECONOMY,
    cost: { food: 100, wood: 75 },
    researchTime: 30,
    effects: [
      { type: 'resource_rate', stat: 'stone', value: 1.15 }
    ],
    availableAt: ['market']
  },

  DOUBLE_BIT_AXE: {
    id: 'double_bit_axe',
    name: 'Double-Bit Axe',
    description: '+20% wood gathering rate',
    category: TechCategory.ECONOMY,
    cost: { food: 50, wood: 25 },
    researchTime: 25,
    effects: [
      { type: 'resource_rate', stat: 'wood', value: 1.2 }
    ],
    availableAt: ['market']
  },

  // Barracks Technologies
  TRACKING: {
    id: 'tracking',
    name: 'Tracking',
    description: 'Infantry units have +2 line of sight',
    category: TechCategory.MILITARY,
    cost: { food: 75 },
    researchTime: 35,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'sight', value: 2 },
      { type: 'unit_stat', target: 'swordsman', stat: 'sight', value: 2 },
      { type: 'unit_stat', target: 'spearman', stat: 'sight', value: 2 }
    ],
    availableAt: ['barracks']
  },

  SQUIRES: {
    id: 'squires',
    name: 'Squires',
    description: 'Infantry move 10% faster',
    category: TechCategory.MILITARY,
    cost: { food: 100 },
    researchTime: 40,
    effects: [
      { type: 'unit_stat', target: 'militia', stat: 'speed', value: 0.5 },
      { type: 'unit_stat', target: 'swordsman', stat: 'speed', value: 0.5 },
      { type: 'unit_stat', target: 'spearman', stat: 'speed', value: 0.5 }
    ],
    availableAt: ['barracks']
  },

  // Archery Range Technologies
  THUMB_RING: {
    id: 'thumb_ring',
    name: 'Thumb Ring',
    description: 'Archers fire faster with 100% accuracy',
    category: TechCategory.MILITARY,
    cost: { food: 300, wood: 250 },
    researchTime: 45,
    effects: [
      { type: 'unit_stat', target: 'archer', stat: 'attack_speed', value: 1.2 }
    ],
    availableAt: ['archery_range']
  },

  // Stable Technologies
  HUSBANDRY: {
    id: 'husbandry',
    name: 'Husbandry',
    description: 'Cavalry move 10% faster',
    category: TechCategory.MILITARY,
    cost: { food: 250 },
    researchTime: 50,
    effects: [
      { type: 'unit_stat', target: 'knight', stat: 'speed', value: 0.6 },
      { type: 'unit_stat', target: 'scout', stat: 'speed', value: 0.6 }
    ],
    availableAt: ['stable']
  }
}

/**
 * Get technologies available at a specific building
 */
export function getTechnologiesForBuilding(buildingType: string): Technology[] {
  return Object.values(TECHNOLOGIES).filter(tech =>
    tech.availableAt.includes(buildingType.toLowerCase())
  )
}

/**
 * Check if technology requirements are met
 */
export function canResearchTechnology(
  techId: string,
  researchedTechs: Set<string>,
  resources: { food: number; wood: number; gold: number; stone: number }
): boolean {
  const tech = TECHNOLOGIES[techId.toUpperCase()]
  if (!tech) return false

  // Check if already researched
  if (researchedTechs.has(techId)) return false

  // Check prerequisites
  if (tech.requires) {
    for (const reqTechId of tech.requires) {
      if (!researchedTechs.has(reqTechId)) {
        return false
      }
    }
  }

  // Check resources
  const cost = tech.cost
  if (cost.food && resources.food < cost.food) return false
  if (cost.wood && resources.wood < cost.wood) return false
  if (cost.gold && resources.gold < cost.gold) return false
  if (cost.stone && resources.stone < cost.stone) return false

  return true
}
