/**
 * Component definitions for the Entity Component System
 * Each component represents a specific aspect of game entities
 */

/**
 * Position component - where an entity is located
 */
export interface PositionComponent {
  x: number
  y: number
}

/**
 * Health component - entity health and vitality
 */
export interface HealthComponent {
  current: number
  max: number
}

/**
 * Movement component - entity movement state and properties
 */
export interface MovementComponent {
  targetX: number | null
  targetY: number | null
  speed: number // pixels per second
  isMoving: boolean
}

/**
 * Combat component - entity combat stats
 */
export interface CombatComponent {
  attack: number
  armor: number
  attackSpeed: number // attacks per second
  range: number // attack range in pixels
  lastAttackTime: number // timestamp of last attack
}

/**
 * Render component - visual representation
 */
export interface RenderComponent {
  color: string
  radius: number
  type: 'circle' | 'sprite'
}

/**
 * Selection component - indicates if entity is selected
 */
export interface SelectionComponent {
  isSelected: boolean
}

/**
 * Owner component - which player owns this entity
 */
export interface OwnerComponent {
  playerId: number
  team: number
}

/**
 * Unit type component - what kind of unit this is
 */
export interface UnitTypeComponent {
  type: 'villager' | 'militia' | 'archer' | 'knight'
  name: string
}

/**
 * Collection of all possible components for an entity
 */
export interface EntityComponents {
  position?: PositionComponent
  health?: HealthComponent
  movement?: MovementComponent
  combat?: CombatComponent
  render?: RenderComponent
  selection?: SelectionComponent
  owner?: OwnerComponent
  unitType?: UnitTypeComponent
}

/**
 * Component type names
 */
export type ComponentType = keyof EntityComponents

/**
 * Helper function to create a position component
 */
export function createPositionComponent(x: number, y: number): PositionComponent {
  return { x, y }
}

/**
 * Helper function to create a health component
 */
export function createHealthComponent(max: number): HealthComponent {
  return { current: max, max }
}

/**
 * Helper function to create a movement component
 */
export function createMovementComponent(speed: number): MovementComponent {
  return {
    targetX: null,
    targetY: null,
    speed,
    isMoving: false
  }
}

/**
 * Helper function to create a combat component
 */
export function createCombatComponent(
  attack: number,
  armor: number,
  attackSpeed: number,
  range: number
): CombatComponent {
  return {
    attack,
    armor,
    attackSpeed,
    range,
    lastAttackTime: 0
  }
}

/**
 * Helper function to create a render component
 */
export function createRenderComponent(
  color: string,
  radius: number,
  type: 'circle' | 'sprite' = 'circle'
): RenderComponent {
  return { color, radius, type }
}

/**
 * Helper function to create a selection component
 */
export function createSelectionComponent(): SelectionComponent {
  return { isSelected: false }
}

/**
 * Helper function to create an owner component
 */
export function createOwnerComponent(playerId: number, team: number): OwnerComponent {
  return { playerId, team }
}

/**
 * Helper function to create a unit type component
 */
export function createUnitTypeComponent(
  type: 'villager' | 'militia' | 'archer' | 'knight',
  name: string
): UnitTypeComponent {
  return { type, name }
}
