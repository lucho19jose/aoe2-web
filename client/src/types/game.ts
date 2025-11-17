// Game type definitions

export interface Position {
  x: number
  y: number
  z?: number
}

export interface Unit {
  id: string
  name: string
  type: UnitType
  position: Position
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  ownerId: string
}

export enum UnitType {
  Villager = 'villager',
  Militia = 'militia',
  Archer = 'archer',
  Knight = 'knight',
  Monk = 'monk'
}

export interface Building {
  id: string
  name: string
  type: BuildingType
  position: Position
  hp: number
  maxHp: number
  ownerId: string
  isComplete: boolean
  productionQueue: string[]
}

export enum BuildingType {
  TownCenter = 'town_center',
  House = 'house',
  Barracks = 'barracks',
  ArcheryRange = 'archery_range',
  Stable = 'stable',
  Market = 'market',
  Blacksmith = 'blacksmith',
  Wonder = 'wonder'
}

export interface Resources {
  food: number
  wood: number
  gold: number
  stone: number
}

export interface Player {
  id: string
  name: string
  civilization: string
  color: string
  resources: Resources
  population: number
  maxPopulation: number
}

export interface GameConfig {
  mapSize: 'small' | 'medium' | 'large'
  maxPlayers: number
  startingResources: Resources
  difficulty: 'easy' | 'medium' | 'hard'
}

export enum ResourceType {
  Tree = 'tree',
  GoldMine = 'gold_mine',
  StoneMine = 'stone_mine',
  BerryBush = 'berry_bush',
  Deer = 'deer',
  Fish = 'fish'
}

export interface ResourceNode {
  id: string
  type: ResourceType
  position: Position
  amount: number
  maxAmount: number
  harvestRate: number
  regenerates: boolean
}

export interface Relic {
  id: string
  position: Position
  ownerId: string | null
  isGarrisoned: boolean
}

export interface GameStatistics {
  playerId: string
  resourcesGathered: Resources
  resourcesSpent: Resources
  unitsTrainedByType: Record<string, number>
  unitsKilledByType: Record<string, number>
  unitsLostByType: Record<string, number>
  buildingsBuilt: number
  buildingsLost: number
  technologiesResearched: number
  gameTime: number
}

export enum VictoryCondition {
  Conquest = 'conquest',
  Wonder = 'wonder',
  Relic = 'relic',
  Score = 'score'
}

export interface VictoryState {
  hasWon: boolean
  hasLost: boolean
  condition?: VictoryCondition
  winnerId?: string
  timestamp?: number
}
