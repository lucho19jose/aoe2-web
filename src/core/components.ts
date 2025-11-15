/**
 * Component definitions for the Entity Component System (ECS)
 */

export interface Position {
  x: number
  y: number
}

export interface Health {
  current: number
  max: number
}

export interface Movement {
  speed: number
  path: Position[]
  targetIndex: number
  velocity: { x: number; y: number }
}

export interface Combat {
  attack: number
  armor: number
  range: number
  attackSpeed: number // seconds between attacks
  attackCooldown: number // current cooldown timer
  target: number | null // entity ID of target
  projectileType?: string // for ranged units
}

export interface Vision {
  range: number
}

export interface Renderable {
  color: string
  radius: number
  sprite?: string
}

export interface Selectable {
  selected: boolean
  hovered: boolean
}

export interface Owner {
  playerId: number
  team: number
}

/**
 * Entity type definitions
 */
export enum EntityType {
  UNIT = 'unit',
  BUILDING = 'building',
  RESOURCE = 'resource',
  PROJECTILE = 'projectile'
}
