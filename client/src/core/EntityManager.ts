import type { EntityComponents, ComponentType } from './components'

/**
 * Entity ID type
 */
export type EntityId = number

/**
 * Entity class represents a game object with components
 */
export class Entity {
  public id: EntityId
  public components: EntityComponents

  constructor(id: EntityId) {
    this.id = id
    this.components = {}
  }

  /**
   * Add a component to this entity
   */
  public addComponent<T extends ComponentType>(
    type: T,
    component: NonNullable<EntityComponents[T]>
  ): void {
    this.components[type] = component as any
  }

  /**
   * Get a component from this entity
   */
  public getComponent<T extends ComponentType>(type: T): EntityComponents[T] | undefined {
    return this.components[type]
  }

  /**
   * Check if this entity has a component
   */
  public hasComponent(type: ComponentType): boolean {
    return this.components[type] !== undefined
  }

  /**
   * Remove a component from this entity
   */
  public removeComponent(type: ComponentType): void {
    delete this.components[type]
  }

  /**
   * Check if entity has all specified components
   */
  public hasComponents(...types: ComponentType[]): boolean {
    return types.every(type => this.hasComponent(type))
  }
}

/**
 * EntityManager manages all entities in the game
 * Provides fast lookup and queries for entities with specific components
 */
export class EntityManager {
  private entities: Map<EntityId, Entity> = new Map()
  private nextEntityId: EntityId = 1

  /**
   * Create a new entity and add it to the manager
   */
  public createEntity(): Entity {
    const entity = new Entity(this.nextEntityId++)
    this.entities.set(entity.id, entity)
    return entity
  }

  /**
   * Get an entity by ID
   */
  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id)
  }

  /**
   * Delete an entity
   */
  public deleteEntity(id: EntityId): void {
    this.entities.delete(id)
  }

  /**
   * Get all entities
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Get all entities that have the specified components
   * This is used by systems to find entities they should operate on
   */
  public getEntitiesWithComponents(...componentTypes: ComponentType[]): Entity[] {
    const result: Entity[] = []

    for (const entity of this.entities.values()) {
      if (entity.hasComponents(...componentTypes)) {
        result.push(entity)
      }
    }

    return result
  }

  /**
   * Get count of entities
   */
  public getEntityCount(): number {
    return this.entities.size
  }

  /**
   * Clear all entities
   */
  public clear(): void {
    this.entities.clear()
    this.nextEntityId = 1
  }

  /**
   * Get entities by a custom filter function
   */
  public queryEntities(filter: (entity: Entity) => boolean): Entity[] {
    const result: Entity[] = []

    for (const entity of this.entities.values()) {
      if (filter(entity)) {
        result.push(entity)
      }
    }

    return result
  }
}
