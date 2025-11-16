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
  Blacksmith = 'blacksmith'
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
