import type { ComponentMap, ComponentType } from './components'

/**
 * Entity is just an ID (number)
 * Components are stored separately in the EntityManager
 */
export type Entity = number

/**
 * EntityManager - manages all entities and their components
 * Uses data-oriented design for performance
 */
export class EntityManager {
  private nextEntityId: number = 1
  private entities: Set<Entity> = new Set()

  // Component storage - Maps for fast lookup
  private components: Map<ComponentType, Map<Entity, any>> = new Map()

  constructor() {
    // Initialize component storage for each component type
    this.initializeComponentStorage()
  }

  /**
   * Initialize storage maps for each component type
   */
  private initializeComponentStorage(): void {
    const componentTypes = Object.values(ComponentType) as ComponentType[]
    componentTypes.forEach(type => {
      this.components.set(type, new Map())
    })
  }

  /**
   * Create a new entity
   * @returns The entity ID
   */
  public createEntity(): Entity {
    const entity = this.nextEntityId++
    this.entities.add(entity)
    return entity
  }

  /**
   * Destroy an entity and remove all its components
   */
  public destroyEntity(entity: Entity): void {
    if (!this.entities.has(entity)) {
      console.warn(`Attempted to destroy non-existent entity: ${entity}`)
      return
    }

    // Remove all components
    this.components.forEach(componentMap => {
      componentMap.delete(entity)
    })

    this.entities.delete(entity)
  }

  /**
   * Add a component to an entity
   */
  public addComponent<T extends ComponentType>(
    entity: Entity,
    componentType: T,
    componentData: ComponentMap[T]
  ): void {
    const componentMap = this.components.get(componentType)
    if (!componentMap) {
      throw new Error(`Unknown component type: ${componentType}`)
    }

    componentMap.set(entity, componentData)
  }

  /**
   * Remove a component from an entity
   */
  public removeComponent(entity: Entity, componentType: ComponentType): void {
    const componentMap = this.components.get(componentType)
    if (componentMap) {
      componentMap.delete(entity)
    }
  }

  /**
   * Get a component from an entity
   */
  public getComponent<T extends ComponentType>(
    entity: Entity,
    componentType: T
  ): ComponentMap[T] | undefined {
    const componentMap = this.components.get(componentType)
    return componentMap?.get(entity)
  }

  /**
   * Check if entity has a component
   */
  public hasComponent(entity: Entity, componentType: ComponentType): boolean {
    const componentMap = this.components.get(componentType)
    return componentMap?.has(entity) ?? false
  }

  /**
   * Check if entity has all specified components
   */
  public hasComponents(entity: Entity, componentTypes: ComponentType[]): boolean {
    return componentTypes.every(type => this.hasComponent(entity, type))
  }

  /**
   * Get all entities that have the specified components
   * This is used by systems to query entities
   */
  public getEntitiesWithComponents(...componentTypes: ComponentType[]): Entity[] {
    const result: Entity[] = []

    for (const entity of this.entities) {
      if (this.hasComponents(entity, componentTypes)) {
        result.push(entity)
      }
    }

    return result
  }

  /**
   * Get a specific entity by ID
   */
  public getEntity(entityId: Entity): Entity | undefined {
    return this.entities.has(entityId) ? entityId : undefined
  }

  /**
   * Get all entities
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.entities)
  }

  /**
   * Get total entity count
   */
  public getEntityCount(): number {
    return this.entities.size
  }

  /**
   * Clear all entities and components
   */
  public clear(): void {
    this.entities.clear()
    this.components.forEach(componentMap => componentMap.clear())
    this.nextEntityId = 1
  }
}
