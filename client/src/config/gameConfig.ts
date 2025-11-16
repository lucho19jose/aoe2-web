/**
 * Game configuration and constants
 */

export const GAME_CONFIG = {
  // Rendering
  RENDER: {
    TARGET_FPS: 60,
    CAMERA_FOV: 60,
    CAMERA_NEAR: 0.1,
    CAMERA_FAR: 1000,
    SHADOW_MAP_SIZE: 2048,
  },

  // Map
  MAP: {
    SMALL: { size: 100, gridSize: 50 },
    MEDIUM: { size: 200, gridSize: 100 },
    LARGE: { size: 300, gridSize: 150 },
  },

  // Game mechanics
  TICK_RATE: 20, // Updates per second
  MOVEMENT_SPEED: 5,
  GATHERING_RATE: 1, // Resources per second

  // Resources
  STARTING_RESOURCES: {
    food: 200,
    wood: 200,
    gold: 100,
    stone: 100,
  },

  // Population
  STARTING_POPULATION: 3,
  MAX_POPULATION: 200,
  POPULATION_PER_HOUSE: 5,

  // Units
  UNIT_SIZE: 1,
  UNIT_SELECTION_RADIUS: 1.5,
  MAX_SELECTION: 60,

  // Buildings
  BUILDING_CONSTRUCTION_TIME: 5, // seconds

  // Combat
  ATTACK_RANGE: {
    MELEE: 1.5,
    RANGED: 10,
    SIEGE: 15,
  },

  ATTACK_SPEED: 2, // Attacks per second

  // Victory conditions
  VICTORY: {
    CONQUEST: {
      enabled: true,
      checkInterval: 5, // seconds
    },
    POPULATION: {
      enabled: true,
      target: 200, // Alcanzar 200 población para ganar
      checkInterval: 10, // seconds
    },
    TIME_LIMIT: {
      enabled: false,
      minutes: 60, // 60 minutos límite
    },
  },
}

export const COLORS = {
  PLAYER: [
    '#0000FF', // Blue
    '#FF0000', // Red
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#FFA500', // Orange
    '#800080', // Purple
  ],

  TERRAIN: {
    GRASS: 0x3a7d3a,
    DIRT: 0x8b7355,
    WATER: 0x4a90e2,
    STONE: 0x808080,
  },

  UI: {
    HEALTH_BAR_GREEN: 0x00ff00,
    HEALTH_BAR_YELLOW: 0xffff00,
    HEALTH_BAR_RED: 0xff0000,
    SELECTION_BOX: 0x00ff00,
  },
}

export const UNIT_TYPES = {
  VILLAGER: {
    name: 'Villager',
    hp: 25,
    attack: 3,
    defense: 0,
    speed: 5,
    cost: { food: 50 },
    trainTime: 25,
  },
  MILITIA: {
    name: 'Militia',
    hp: 40,
    attack: 4,
    defense: 1,
    speed: 4,
    cost: { food: 60, gold: 20 },
    trainTime: 21,
  },
  ARCHER: {
    name: 'Archer',
    hp: 30,
    attack: 4,
    defense: 0,
    speed: 4,
    range: 10,
    cost: { wood: 25, gold: 45 },
    trainTime: 35,
  },
  KNIGHT: {
    name: 'Knight',
    hp: 100,
    attack: 10,
    defense: 2,
    speed: 6,
    cost: { food: 60, gold: 75 },
    trainTime: 30,
  },
}

export const BUILDING_TYPES = {
  TOWN_CENTER: {
    name: 'Town Center',
    hp: 2400,
    size: { width: 4, height: 4 },
    cost: { wood: 275, stone: 100 },
    buildTime: 150,
    produces: ['villager'],
  },
  HOUSE: {
    name: 'House',
    hp: 550,
    size: { width: 2, height: 2 },
    cost: { wood: 25 },
    buildTime: 25,
    populationSpace: 5,
  },
  BARRACKS: {
    name: 'Barracks',
    hp: 1200,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: ['militia', 'spearman', 'swordsman'],
  },
  ARCHERY_RANGE: {
    name: 'Archery Range',
    hp: 1200,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: ['archer', 'skirmisher', 'cavalry_archer'],
  },
  STABLE: {
    name: 'Stable',
    hp: 1200,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 50,
    produces: ['scout', 'knight', 'camel'],
  },
  MARKET: {
    name: 'Market',
    hp: 1800,
    size: { width: 3, height: 3 },
    cost: { wood: 175 },
    buildTime: 60,
  },
  BLACKSMITH: {
    name: 'Blacksmith',
    hp: 1200,
    size: { width: 3, height: 3 },
    cost: { wood: 150 },
    buildTime: 40,
  },
}

export const RESOURCE_TYPES = {
  FOOD: {
    name: 'Food',
    color: 0xff6b6b,
    icon: 'food_bank',
    gatherRate: 1,
  },
  WOOD: {
    name: 'Wood',
    color: 0x8b7355,
    icon: 'forest',
    gatherRate: 1,
  },
  GOLD: {
    name: 'Gold',
    color: 0xffd700,
    icon: 'diamond',
    gatherRate: 0.8,
  },
  STONE: {
    name: 'Stone',
    color: 0x808080,
    icon: 'architecture',
    gatherRate: 0.6,
  },
}

export const RESOURCE_NODES = {
  TREE: {
    name: 'Tree',
    resourceType: 'wood',
    amount: 125,
    harvestRate: 0.5,
    regenerates: false,
    size: 1.5,
    color: 0x228b22,
    height: 4,
  },
  GOLD_MINE: {
    name: 'Gold Mine',
    resourceType: 'gold',
    amount: 800,
    harvestRate: 0.38,
    regenerates: false,
    size: 2,
    color: 0xffd700,
    height: 2.5,
  },
  STONE_MINE: {
    name: 'Stone Mine',
    resourceType: 'stone',
    amount: 350,
    harvestRate: 0.36,
    regenerates: false,
    size: 2,
    color: 0x808080,
    height: 2,
  },
  BERRY_BUSH: {
    name: 'Berry Bush',
    resourceType: 'food',
    amount: 125,
    harvestRate: 0.31,
    regenerates: true,
    regenerationTime: 120, // seconds
    size: 1,
    color: 0x9370db,
    height: 1.5,
  },
  DEER: {
    name: 'Deer',
    resourceType: 'food',
    amount: 140,
    harvestRate: 0.41,
    regenerates: false,
    size: 1,
    color: 0xd2691e,
    height: 1.2,
  },
}

export const RESOURCE_SPAWN = {
  TREE: {
    minClusters: 8,
    maxClusters: 15,
    minPerCluster: 5,
    maxPerCluster: 12,
    clusterRadius: 8,
  },
  GOLD_MINE: {
    minClusters: 4,
    maxClusters: 7,
    minPerCluster: 4,
    maxPerCluster: 7,
    clusterRadius: 4,
  },
  STONE_MINE: {
    minClusters: 3,
    maxClusters: 6,
    minPerCluster: 3,
    maxPerCluster: 5,
    clusterRadius: 4,
  },
  BERRY_BUSH: {
    minClusters: 4,
    maxClusters: 8,
    minPerCluster: 4,
    maxPerCluster: 6,
    clusterRadius: 3,
  },
  DEER: {
    minClusters: 3,
    maxClusters: 6,
    minPerCluster: 2,
    maxPerCluster: 4,
    clusterRadius: 5,
  },
}
