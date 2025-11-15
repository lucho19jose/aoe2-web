import {
  Position,
  Health,
  Movement,
  Combat,
  Vision,
  Renderable,
  Selectable,
  Owner,
  EntityType
} from './components'

/**
 * Entity structure
 */
export interface Entity {
  id: number
  type: EntityType
  active: boolean
}

/**
 * Component maps
 */
export interface ComponentMaps {
  position: Map<number, Position>
  health: Map<number, Health>
  movement: Map<number, Movement>
  combat: Map<number, Combat>
  vision: Map<number, Vision>
  renderable: Map<number, Renderable>
  selectable: Map<number, Selectable>
  owner: Map<number, Owner>
}

/**
 * Entity Manager using ECS pattern
 * Manages all entities and their components
 */
export class EntityManager {
  private entities: Map<number, Entity> = new Map()
  private nextEntityId: number = 1

  // Component storage
  components: ComponentMaps = {
    position: new Map(),
    health: new Map(),
    movement: new Map(),
    combat: new Map(),
    vision: new Map(),
    renderable: new Map(),
    selectable: new Map(),
    owner: new Map()
  }

  /**
   * Generate unique entity ID
   */
  private generateId(): number {
    return this.nextEntityId++
  }

  /**
   * Create a new entity
   */
  createEntity(type: EntityType): number {
    const id = this.generateId()
    this.entities.set(id, {
      id,
      type,
      active: true
    })
    return id
  }

  /**
   * Delete an entity and all its components
   */
  deleteEntity(id: number): void {
    this.entities.delete(id)

    // Remove from all component maps
    for (const componentMap of Object.values(this.components)) {
      componentMap.delete(id)
    }
  }

  /**
   * Get entity by ID
   */
  getEntity(id: number): Entity | undefined {
    return this.entities.get(id)
  }

  /**
   * Get all entities
   */
  getAllEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  /**
   * Get entities with specific components
   */
  getEntitiesWithComponents(componentNames: (keyof ComponentMaps)[]): number[] {
    const entityIds: number[] = []

    for (const [id, entity] of this.entities) {
      if (!entity.active) continue

      // Check if entity has all required components
      const hasAllComponents = componentNames.every(
        (name) => this.components[name].has(id)
      )

      if (hasAllComponents) {
        entityIds.push(id)
      }
    }

    return entityIds
  }

  /**
   * Add component to entity
   */
  addComponent<K extends keyof ComponentMaps>(
    entityId: number,
    componentName: K,
    componentData: ComponentMaps[K] extends Map<number, infer V> ? V : never
  ): void {
    this.components[componentName].set(entityId, componentData as any)
  }

  /**
   * Get component from entity
   */
  getComponent<K extends keyof ComponentMaps>(
    entityId: number,
    componentName: K
  ): (ComponentMaps[K] extends Map<number, infer V> ? V : never) | undefined {
    return this.components[componentName].get(entityId) as any
  }

  /**
   * Remove component from entity
   */
  removeComponent<K extends keyof ComponentMaps>(
    entityId: number,
    componentName: K
  ): void {
    this.components[componentName].delete(entityId)
  }

  /**
   * Check if entity has component
   */
  hasComponent<K extends keyof ComponentMaps>(
    entityId: number,
    componentName: K
  ): boolean {
    return this.components[componentName].has(entityId)
  }

  /**
   * Clear all entities
   */
  clear(): void {
    this.entities.clear()
    for (const componentMap of Object.values(this.components)) {
      componentMap.clear()
    }
    this.nextEntityId = 1
  }

  /**
   * Get entity count
   */
  getEntityCount(): number {
    return this.entities.size
  }
}
