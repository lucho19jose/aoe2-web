import type { Entity, EntityManager } from '../../core/EntityManager'
import { ComponentType } from '../../core/components'

/**
 * Unit configuration options
 */
export interface UnitConfig {
  x: number
  y: number
  color?: string
  health?: number
  speed?: number
  attack?: number
  armor?: number
}

/**
 * Unit factory - creates units using the ECS
 * This is not a class instance, but a set of helper functions
 */
export class UnitFactory {
  /**
   * Create a basic unit entity
   */
  public static createUnit(
    entityManager: EntityManager,
    config: UnitConfig
  ): Entity {
    const entity = entityManager.createEntity()

    // Add Position component
    entityManager.addComponent(entity, ComponentType.POSITION, {
      x: config.x,
      y: config.y
    })

    // Add Health component
    const maxHealth = config.health ?? 100
    entityManager.addComponent(entity, ComponentType.HEALTH, {
      current: maxHealth,
      max: maxHealth
    })

    // Add Movement component
    entityManager.addComponent(entity, ComponentType.MOVEMENT, {
      speed: config.speed ?? 100, // pixels per second
      targetX: null,
      targetY: null,
      isMoving: false
    })

    // Add Combat component
    entityManager.addComponent(entity, ComponentType.COMBAT, {
      attack: config.attack ?? 5,
      armor: config.armor ?? 0,
      attackSpeed: 2.0, // 2 seconds between attacks
      attackRange: 48, // 1.5 tiles
      lastAttackTime: 0,
      targetEntityId: null
    })

    // Add Render component
    entityManager.addComponent(entity, ComponentType.RENDER, {
      type: 'circle',
      color: config.color ?? this.getRandomUnitColor(),
      radius: 16
    })

    return entity
  }

  /**
   * Create multiple random units for testing
   */
  public static createRandomUnits(
    entityManager: EntityManager,
    count: number,
    mapSizeInTiles: number,
    tileSize: number
  ): Entity[] {
    const units: Entity[] = []
    const colors = [
      '#FF6B6B', // Red
      '#4ECDC4', // Cyan
      '#45B7D1', // Blue
      '#FFA07A', // Light Salmon
      '#98D8C8', // Mint
      '#F7DC6F', // Yellow
      '#BB8FCE', // Purple
      '#85C1E2'  // Sky Blue
    ]

    for (let i = 0; i < count; i++) {
      // Random position within the map
      const halfMap = (mapSizeInTiles * tileSize) / 2
      const x = (Math.random() * mapSizeInTiles * tileSize) - halfMap
      const y = (Math.random() * mapSizeInTiles * tileSize) - halfMap

      const unit = this.createUnit(entityManager, {
        x,
        y,
        color: colors[i % colors.length],
        health: 100,
        speed: 80 + Math.random() * 40, // Random speed between 80-120
        attack: 5 + Math.floor(Math.random() * 5), // Random attack 5-9
        armor: Math.floor(Math.random() * 3) // Random armor 0-2
      })

      units.push(unit)
    }

    console.log(`Created ${count} random units`)
    return units
  }

  /**
   * Get a random color for units
   */
  private static getRandomUnitColor(): string {
    const hue = Math.random() * 360
    return `hsl(${hue}, 70%, 60%)`
  }
}
