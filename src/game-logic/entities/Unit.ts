import { EntityManager } from '@/core/EntityManager'
import { EntityType } from '@/core/components'

/**
 * Unit entity factory
 */
export class UnitFactory {
  /**
   * Create a basic unit
   */
  static createUnit(
    entityManager: EntityManager,
    x: number,
    y: number,
    playerId: number = 1,
    color: string = '#4488ff'
  ): number {
    const entityId = entityManager.createEntity(EntityType.UNIT)

    // Add Position component
    entityManager.addComponent(entityId, 'position', { x, y })

    // Add Health component
    entityManager.addComponent(entityId, 'health', {
      current: 40,
      max: 40
    })

    // Add Movement component
    entityManager.addComponent(entityId, 'movement', {
      speed: 100, // pixels per second
      path: [],
      targetIndex: 0,
      velocity: { x: 0, y: 0 }
    })

    // Add Combat component
    entityManager.addComponent(entityId, 'combat', {
      attack: 4,
      armor: 0,
      range: 8, // pixels
      attackSpeed: 2.0,
      attackCooldown: 0,
      target: null
    })

    // Add Vision component
    entityManager.addComponent(entityId, 'vision', {
      range: 160 // pixels
    })

    // Add Renderable component
    entityManager.addComponent(entityId, 'renderable', {
      color,
      radius: 12
    })

    // Add Selectable component
    entityManager.addComponent(entityId, 'selectable', {
      selected: false,
      hovered: false
    })

    // Add Owner component
    entityManager.addComponent(entityId, 'owner', {
      playerId,
      team: playerId
    })

    return entityId
  }

  /**
   * Create multiple units in a random area
   */
  static createRandomUnits(
    entityManager: EntityManager,
    count: number,
    centerX: number,
    centerY: number,
    radius: number,
    playerId: number = 1,
    color: string = '#4488ff'
  ): number[] {
    const units: number[] = []

    for (let i = 0; i < count; i++) {
      // Random position within radius
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * radius
      const x = centerX + Math.cos(angle) * distance
      const y = centerY + Math.sin(angle) * distance

      const unitId = UnitFactory.createUnit(entityManager, x, y, playerId, color)
      units.push(unitId)
    }

    return units
  }
}
