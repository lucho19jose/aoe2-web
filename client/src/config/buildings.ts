// Extended building configuration for Age of Empires 2 Web

export interface BuildingConfig {
  name: string
  type: string
  category: 'economic' | 'military' | 'defensive' | 'special'
  age: 'dark_age' | 'feudal_age' | 'castle_age' | 'imperial_age'
  hp: number
  meleeArmor: number
  pierceArmor: number
  lineOfSight: number
  size: {
    width: number
    height: number
  }
  cost: {
    wood?: number
    stone?: number
    gold?: number
  }
  buildTime: number // seconds
  produces?: string[]
  technologies?: string[]
  populationSpace?: number
  garrisonCapacity?: number
  attackDamage?: number
  attackRange?: number
  attackSpeed?: number
}

export const BUILDINGS: Record<string, BuildingConfig> = {
  // ECONOMIC BUILDINGS
  town_center: {
    name: 'Town Center',
    type: 'town_center',
    category: 'economic',
    age: 'dark_age',
    hp: 2400,
    meleeArmor: 3,
    pierceArmor: 5,
    lineOfSight: 8,
    size: { width: 4, height: 4 },
    cost: { wood: 275, stone: 100 },
    buildTime: 150,
    produces: ['villager'],
    technologies: ['loom', 'feudal_age', 'castle_age', 'imperial_age'],
    garrisonCapacity: 20,
    attackDamage: 5,
    attackRange: 8,
    attackSpeed: 2.0,
  },

  house: {
    name: 'House',
    type: 'house',
    category: 'economic',
    age: 'dark_age',
    hp: 550,
    meleeArmor: 0,
    pierceArmor: 1,
    lineOfSight: 2,
    size: { width: 2, height: 2 },
    cost: { wood: 25 },
    buildTime: 25,
    populationSpace: 5,
  },

  mill: {
    name: 'Mill',
    type: 'mill',
    category: 'economic',
    age: 'dark_age',
    hp: 600,
    meleeArmor: 0,
    pierceArmor: 1,
    lineOfSight: 4,
    size: { width: 2, height: 2 },
    cost: { wood: 100 },
    buildTime: 35,
    technologies: ['horse_collar', 'heavy_plow', 'crop_rotation'],
  },

  lumber_camp: {
    name: 'Lumber Camp',
    type: 'lumber_camp',
    category: 'economic',
    age: 'dark_age',
    hp: 600,
    meleeArmor: 0,
    pierceArmor: 1,
    lineOfSight: 4,
    size: { width: 2, height: 2 },
    cost: { wood: 100 },
    buildTime: 35,
    technologies: ['double_bit_axe', 'bow_saw', 'two_man_saw'],
  },

  mining_camp: {
    name: 'Mining Camp',
    type: 'mining_camp',
    category: 'economic',
    age: 'dark_age',
    hp: 600,
    meleeArmor: 0,
    pierceArmor: 1,
    lineOfSight: 4,
    size: { width: 2, height: 2 },
    cost: { wood: 100 },
    buildTime: 35,
    technologies: ['gold_mining', 'stone_mining', 'gold_shaft_mining', 'stone_shaft_mining'],
  },

  market: {
    name: 'Market',
    type: 'market',
    category: 'economic',
    age: 'feudal_age',
    hp: 1800,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 60,
    produces: ['trade_cart'],
    technologies: ['caravan', 'coinage', 'banking', 'guilds'],
  },

  dock: {
    name: 'Dock',
    type: 'dock',
    category: 'economic',
    age: 'dark_age',
    hp: 1800,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 8,
    size: { width: 3, height: 3 },
    cost: { wood: 150 },
    buildTime: 35,
    produces: ['fishing_ship', 'trade_cog', 'transport_ship', 'galley', 'fire_ship'],
    technologies: ['gillnets', 'careening', 'dry_dock', 'shipwright'],
  },

  farm: {
    name: 'Farm',
    type: 'farm',
    category: 'economic',
    age: 'dark_age',
    hp: 480,
    meleeArmor: 0,
    pierceArmor: 1,
    lineOfSight: 2,
    size: { width: 2, height: 2 },
    cost: { wood: 60 },
    buildTime: 15,
  },

  // MILITARY BUILDINGS
  barracks: {
    name: 'Barracks',
    type: 'barracks',
    category: 'military',
    age: 'feudal_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: [
      'militia',
      'man_at_arms',
      'long_swordsman',
      'two_handed_swordsman',
      'champion',
      'spearman',
      'pikeman',
      'halberdier',
      'eagle_scout',
      'eagle_warrior',
      'elite_eagle_warrior',
    ],
    technologies: ['supplies', 'squires', 'arson'],
  },

  archery_range: {
    name: 'Archery Range',
    type: 'archery_range',
    category: 'military',
    age: 'feudal_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: [
      'archer',
      'crossbowman',
      'arbalest',
      'skirmisher',
      'elite_skirmisher',
      'cavalry_archer',
      'heavy_cavalry_archer',
      'hand_cannoneer',
    ],
    technologies: ['thumb_ring', 'parthian_tactics'],
  },

  stable: {
    name: 'Stable',
    type: 'stable',
    category: 'military',
    age: 'feudal_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: [
      'scout_cavalry',
      'light_cavalry',
      'hussar',
      'knight',
      'cavalier',
      'paladin',
      'camel',
      'heavy_camel',
    ],
    technologies: ['bloodlines', 'husbandry'],
  },

  blacksmith: {
    name: 'Blacksmith',
    type: 'blacksmith',
    category: 'military',
    age: 'feudal_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 150 },
    buildTime: 40,
    technologies: [
      'forging',
      'iron_casting',
      'blast_furnace',
      'scale_mail_armor',
      'chain_mail_armor',
      'plate_mail_armor',
      'scale_barding_armor',
      'chain_barding_armor',
      'plate_barding_armor',
      'fletching',
      'bodkin_arrow',
      'bracer',
      'padded_archer_armor',
      'leather_archer_armor',
      'ring_archer_armor',
    ],
  },

  siege_workshop: {
    name: 'Siege Workshop',
    type: 'siege_workshop',
    category: 'military',
    age: 'castle_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 200 },
    buildTime: 40,
    produces: [
      'battering_ram',
      'capped_ram',
      'siege_ram',
      'mangonel',
      'onager',
      'siege_onager',
      'scorpion',
      'heavy_scorpion',
      'bombard_cannon',
    ],
    technologies: ['siege_engineers'],
  },

  monastery: {
    name: 'Monastery',
    type: 'monastery',
    category: 'military',
    age: 'castle_age',
    hp: 1050,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 40,
    produces: ['monk'],
    technologies: [
      'redemption',
      'atonement',
      'herbal_medicine',
      'heresy',
      'sanctity',
      'fervor',
      'faith',
      'illumination',
      'block_printing',
      'theocracy',
    ],
    garrisonCapacity: 10,
  },

  university: {
    name: 'University',
    type: 'university',
    category: 'military',
    age: 'castle_age',
    hp: 1200,
    meleeArmor: 0,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 3, height: 3 },
    cost: { wood: 200 },
    buildTime: 60,
    technologies: [
      'masonry',
      'architecture',
      'fortified_wall',
      'ballistics',
      'heated_shot',
      'murder_holes',
      'treadmill_crane',
      'arrowslits',
      'chemistry',
      'bombard_tower',
      'siege_engineers',
      'keep',
    ],
  },

  // DEFENSIVE BUILDINGS
  castle: {
    name: 'Castle',
    type: 'castle',
    category: 'defensive',
    age: 'castle_age',
    hp: 4800,
    meleeArmor: 8,
    pierceArmor: 11,
    lineOfSight: 11,
    size: { width: 4, height: 4 },
    cost: { stone: 650 },
    buildTime: 200,
    produces: ['trebuchet', 'petard'],
    technologies: ['conscription', 'sappers', 'spies', 'hoardings'],
    garrisonCapacity: 20,
    attackDamage: 11,
    attackRange: 8,
    attackSpeed: 2.0,
  },

  tower: {
    name: 'Watch Tower',
    type: 'tower',
    category: 'defensive',
    age: 'feudal_age',
    hp: 700,
    meleeArmor: 0,
    pierceArmor: 4,
    lineOfSight: 9,
    size: { width: 2, height: 2 },
    cost: { stone: 125 },
    buildTime: 80,
    garrisonCapacity: 5,
    attackDamage: 5,
    attackRange: 7,
    attackSpeed: 3.0,
  },

  guard_tower: {
    name: 'Guard Tower',
    type: 'guard_tower',
    category: 'defensive',
    age: 'castle_age',
    hp: 1000,
    meleeArmor: 0,
    pierceArmor: 5,
    lineOfSight: 10,
    size: { width: 2, height: 2 },
    cost: { stone: 125 },
    buildTime: 80,
    garrisonCapacity: 5,
    attackDamage: 6,
    attackRange: 8,
    attackSpeed: 3.0,
  },

  keep: {
    name: 'Keep',
    type: 'keep',
    category: 'defensive',
    age: 'imperial_age',
    hp: 1500,
    meleeArmor: 0,
    pierceArmor: 6,
    lineOfSight: 11,
    size: { width: 2, height: 2 },
    cost: { stone: 125 },
    buildTime: 80,
    garrisonCapacity: 5,
    attackDamage: 7,
    attackRange: 8,
    attackSpeed: 3.0,
  },

  bombard_tower: {
    name: 'Bombard Tower',
    type: 'bombard_tower',
    category: 'defensive',
    age: 'imperial_age',
    hp: 1500,
    meleeArmor: 0,
    pierceArmor: 7,
    lineOfSight: 11,
    size: { width: 2, height: 2 },
    cost: { stone: 125, gold: 125 },
    buildTime: 80,
    garrisonCapacity: 5,
    attackDamage: 40,
    attackRange: 7,
    attackSpeed: 6.5,
  },

  outpost: {
    name: 'Outpost',
    type: 'outpost',
    category: 'defensive',
    age: 'feudal_age',
    hp: 500,
    meleeArmor: 0,
    pierceArmor: 2,
    lineOfSight: 10,
    size: { width: 1, height: 1 },
    cost: { wood: 25, stone: 5 },
    buildTime: 15,
  },

  palisade_wall: {
    name: 'Palisade Wall',
    type: 'palisade_wall',
    category: 'defensive',
    age: 'dark_age',
    hp: 250,
    meleeArmor: 0,
    pierceArmor: 2,
    lineOfSight: 2,
    size: { width: 1, height: 1 },
    cost: { wood: 2 },
    buildTime: 5,
  },

  stone_wall: {
    name: 'Stone Wall',
    type: 'stone_wall',
    category: 'defensive',
    age: 'castle_age',
    hp: 900,
    meleeArmor: 0,
    pierceArmor: 8,
    lineOfSight: 2,
    size: { width: 1, height: 1 },
    cost: { stone: 5 },
    buildTime: 10,
  },

  fortified_wall: {
    name: 'Fortified Wall',
    type: 'fortified_wall',
    category: 'defensive',
    age: 'imperial_age',
    hp: 1380,
    meleeArmor: 0,
    pierceArmor: 11,
    lineOfSight: 2,
    size: { width: 1, height: 1 },
    cost: { stone: 5 },
    buildTime: 10,
  },

  palisade_gate: {
    name: 'Palisade Gate',
    type: 'palisade_gate',
    category: 'defensive',
    age: 'dark_age',
    hp: 400,
    meleeArmor: 0,
    pierceArmor: 2,
    lineOfSight: 2,
    size: { width: 2, height: 1 },
    cost: { wood: 20 },
    buildTime: 15,
  },

  stone_gate: {
    name: 'Stone Gate',
    type: 'stone_gate',
    category: 'defensive',
    age: 'castle_age',
    hp: 2750,
    meleeArmor: 0,
    pierceArmor: 8,
    lineOfSight: 2,
    size: { width: 2, height: 1 },
    cost: { stone: 30 },
    buildTime: 20,
  },

  // SPECIAL BUILDINGS
  wonder: {
    name: 'Wonder',
    type: 'wonder',
    category: 'special',
    age: 'imperial_age',
    hp: 4800,
    meleeArmor: 3,
    pierceArmor: 3,
    lineOfSight: 6,
    size: { width: 6, height: 6 },
    cost: { wood: 1000, stone: 1000, gold: 1000 },
    buildTime: 300,
  },
}

export function getBuildingConfig(buildingType: string): BuildingConfig | undefined {
  return BUILDINGS[buildingType]
}

export function getBuildingsByAge(age: string): BuildingConfig[] {
  return Object.values(BUILDINGS).filter((building) => building.age === age)
}

export function getBuildingsByCategory(category: string): BuildingConfig[] {
  return Object.values(BUILDINGS).filter((building) => building.category === category)
}

export function getAllBuildings(): BuildingConfig[] {
  return Object.values(BUILDINGS)
}
