import { Entity, EntityManager } from '../../core/EntityManager'
import {
  createPositionComponent,
  createHealthComponent,
  createMovementComponent,
  createCombatComponent,
  createRenderComponent,
  createSelectionComponent,
  createOwnerComponent,
  createUnitTypeComponent
} from '../../core/components'

/**
 * Unit configuration interface
 */
export interface UnitConfig {
  x: number
  y: number
  health: number
  speed: number
  attack: number
  armor: number
  attackSpeed: number
  range: number
  color: string
  radius: number
  playerId: number
  team: number
  type: 'villager' | 'militia' | 'archer' | 'knight'
  name: string
}

/**
 * Default unit configuration
 */
const DEFAULT_UNIT_CONFIG: Partial<UnitConfig> = {
  health: 40,
  speed: 100,
  attack: 4,
  armor: 0,
  attackSpeed: 0.5, // 1 attack every 2 seconds
  range: 32, // 1 tile
  color: '#4488ff',
  radius: 16,
  playerId: 1,
  team: 1,
  type: 'militia',
  name: 'Militia'
}

/**
 * Unit factory class
 * Creates units with all necessary components
 */
export class Unit {
  /**
   * Create a new unit entity
   */
  public static create(
    entityManager: EntityManager,
    config: Partial<UnitConfig> & { x: number; y: number }
  ): Entity {
    const fullConfig: UnitConfig = {
      ...DEFAULT_UNIT_CONFIG,
      ...config
    } as UnitConfig

    const entity = entityManager.createEntity()

    // Add all components
    entity.addComponent('position', createPositionComponent(fullConfig.x, fullConfig.y))
    entity.addComponent('health', createHealthComponent(fullConfig.health))
    entity.addComponent('movement', createMovementComponent(fullConfig.speed))
    entity.addComponent(
      'combat',
      createCombatComponent(
        fullConfig.attack,
        fullConfig.armor,
        fullConfig.attackSpeed,
        fullConfig.range
      )
    )
    entity.addComponent('render', createRenderComponent(fullConfig.color, fullConfig.radius))
    entity.addComponent('selection', createSelectionComponent())
    entity.addComponent('owner', createOwnerComponent(fullConfig.playerId, fullConfig.team))
    entity.addComponent('unitType', createUnitTypeComponent(fullConfig.type, fullConfig.name))

    return entity
  }

  /**
   * Create a militia unit
   */
  public static createMilitia(
    entityManager: EntityManager,
    x: number,
    y: number,
    playerId: number = 1,
    team: number = 1
  ): Entity {
    return Unit.create(entityManager, {
      x,
      y,
      health: 40,
      speed: 100,
      attack: 4,
      armor: 0,
      attackSpeed: 0.5,
      range: 32,
      color: '#4488ff',
      radius: 16,
      playerId,
      team,
      type: 'militia',
      name: 'Militia'
    })
  }

  /**
   * Create a villager unit
   */
  public static createVillager(
    entityManager: EntityManager,
    x: number,
    y: number,
    playerId: number = 1,
    team: number = 1
  ): Entity {
    return Unit.create(entityManager, {
      x,
      y,
      health: 25,
      speed: 80,
      attack: 2,
      armor: 0,
      attackSpeed: 0.33,
      range: 16,
      color: '#44ff44',
      radius: 14,
      playerId,
      team,
      type: 'villager',
      name: 'Villager'
    })
  }

  /**
   * Create an archer unit
   */
  public static createArcher(
    entityManager: EntityManager,
    x: number,
    y: number,
    playerId: number = 1,
    team: number = 1
  ): Entity {
    return Unit.create(entityManager, {
      x,
      y,
      health: 30,
      speed: 90,
      attack: 6,
      armor: 0,
      attackSpeed: 0.66,
      range: 128,
      color: '#ff8844',
      radius: 14,
      playerId,
      team,
      type: 'archer',
      name: 'Archer'
    })
  }

  /**
   * Create a knight unit
   */
  public static createKnight(
    entityManager: EntityManager,
    x: number,
    y: number,
    playerId: number = 1,
    team: number = 1
  ): Entity {
    return Unit.create(entityManager, {
      x,
      y,
      health: 100,
      speed: 140,
      attack: 10,
      armor: 2,
      attackSpeed: 0.5,
      range: 32,
      color: '#ff4444',
      radius: 18,
      playerId,
      team,
      type: 'knight',
      name: 'Knight'
    })
  }
}
