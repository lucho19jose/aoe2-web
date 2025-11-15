/**
 * Component definitions for the Entity Component System (ECS)
 * Components are pure data containers with no logic
 */

/**
 * Position component - entity's location in the world
 */
export interface PositionComponent {
  x: number
  y: number
}

/**
 * Health component - entity's health and max health
 */
export interface HealthComponent {
  current: number
  max: number
}

/**
 * Movement component - entity's movement properties
 */
export interface MovementComponent {
  speed: number // pixels per second
  targetX: number | null
  targetY: number | null
  isMoving: boolean
}

/**
 * Combat component - entity's combat stats
 */
export interface CombatComponent {
  attack: number
  armor: number
  attackSpeed: number // seconds between attacks
  attackRange: number // pixels
  lastAttackTime: number
  targetEntityId: number | null
}

/**
 * Render component - visual representation
 */
export interface RenderComponent {
  type: 'circle' | 'sprite'
  color: string
  radius?: number // for circles
  spritePath?: string // for sprites
  width?: number
  height?: number
}

/**
 * Component types enum for type-safe component access
 */
export enum ComponentType {
  POSITION = 'position',
  HEALTH = 'health',
  MOVEMENT = 'movement',
  COMBAT = 'combat',
  RENDER = 'render'
}

/**
 * Map of component types to their data structures
 */
export interface ComponentMap {
  [ComponentType.POSITION]: PositionComponent
  [ComponentType.HEALTH]: HealthComponent
  [ComponentType.MOVEMENT]: MovementComponent
  [ComponentType.COMBAT]: CombatComponent
  [ComponentType.RENDER]: RenderComponent
}

/**
 * Helper type to get all components
 */
export type Component = ComponentMap[ComponentType]
