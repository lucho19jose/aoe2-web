import { Building } from '@/entities/Building'
import { Unit } from '@/entities/Unit'
import type { UnitType, Resources } from '@/types/game'
import { UNIT_TYPES, BUILDING_TYPES } from '@/config/gameConfig'
import { canAfford, subtractResources } from '@/utils/gameUtils'

/**
 * Production system - manages building production queues
 */

interface ProductionQueueItem {
  unitType: UnitType
  progress: number // 0 to 1
  timeRequired: number
}

interface BuildingProductionState {
  building: Building
  queue: ProductionQueueItem[]
  isProducing: boolean
}

export class ProductionSystem {
  private productionStates: Map<string, BuildingProductionState> = new Map()
  private resources: Resources = { food: 200, wood: 200, gold: 100, stone: 100 }
  private onUnitProduced?: (unit: Unit, building: Building) => void
  private onProductionStarted?: (building: Building, unitType: UnitType) => void
  private onProductionCanceled?: (building: Building, unitType: UnitType) => void

  private readonly MAX_QUEUE_SIZE = 10

  /**
   * Add a building to the production system
   */
  public addBuilding(building: Building) {
    if (!this.canProduce(building)) return

    if (!this.productionStates.has(building.id)) {
      this.productionStates.set(building.id, {
        building,
        queue: [],
        isProducing: false,
      })
    }
  }

  /**
   * Remove a building from production system
   */
  public removeBuilding(buildingId: string) {
    this.productionStates.delete(buildingId)
  }

  /**
   * Check if building can produce units
   */
  private canProduce(building: Building): boolean {
    const producesUnits = ['town_center', 'barracks', 'archery_range', 'stable']
    return producesUnits.includes(building.type)
  }

  /**
   * Queue a unit for production
   */
  public queueUnit(buildingId: string, unitType: UnitType): boolean {
    const state = this.productionStates.get(buildingId)
    if (!state) return false

    // Check queue size
    if (state.queue.length >= this.MAX_QUEUE_SIZE) {
      return false
    }

    // Check if building can produce this unit
    const buildingConfig = BUILDING_TYPES[state.building.type.toUpperCase() as keyof typeof BUILDING_TYPES]
    if (!buildingConfig.produces?.includes(unitType)) {
      return false
    }

    // Check resources
    const cost = this.getUnitCost(unitType)
    if (!canAfford(this.resources, cost)) {
      return false
    }

    // Deduct resources
    this.resources = subtractResources(this.resources, cost)

    // Add to queue
    const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
    const queueItem: ProductionQueueItem = {
      unitType,
      progress: 0,
      timeRequired: unitConfig.trainTime,
    }

    state.queue.push(queueItem)

    // Start production if not already producing
    if (!state.isProducing && state.queue.length === 1) {
      state.isProducing = true
      if (this.onProductionStarted) {
        this.onProductionStarted(state.building, unitType)
      }
    }

    return true
  }

  /**
   * Cancel production of a unit
   */
  public cancelProduction(buildingId: string, queueIndex: number): boolean {
    const state = this.productionStates.get(buildingId)
    if (!state || queueIndex < 0 || queueIndex >= state.queue.length) {
      return false
    }

    const item = state.queue[queueIndex]

    // Refund resources (partial refund if partially complete)
    const cost = this.getUnitCost(item.unitType)
    const refundPercent = queueIndex === 0 ? (1 - item.progress) : 1 // Full refund if not started
    const refund: Partial<Resources> = {}

    Object.entries(cost).forEach(([key, value]) => {
      if (value) {
        refund[key as keyof Resources] = Math.floor(value * refundPercent)
      }
    })

    this.resources.food += refund.food || 0
    this.resources.wood += refund.wood || 0
    this.resources.gold += refund.gold || 0
    this.resources.stone += refund.stone || 0

    // Remove from queue
    state.queue.splice(queueIndex, 1)

    if (this.onProductionCanceled) {
      this.onProductionCanceled(state.building, item.unitType)
    }

    // Update production state
    if (state.queue.length === 0) {
      state.isProducing = false
    }

    return true
  }

  /**
   * Update production system
   */
  public update(deltaTime: number) {
    this.productionStates.forEach((state) => {
      this.updateProductionState(state, deltaTime)
    })
  }

  private updateProductionState(state: BuildingProductionState, deltaTime: number) {
    if (!state.isProducing || state.queue.length === 0) {
      return
    }

    const currentItem = state.queue[0]

    // Update progress
    currentItem.progress += deltaTime / currentItem.timeRequired

    // Check if completed
    if (currentItem.progress >= 1) {
      this.completeProduction(state, currentItem)
    }
  }

  private completeProduction(state: BuildingProductionState, item: ProductionQueueItem) {
    // Create unit
    const rallyPoint = this.getRallyPoint(state.building)
    const unit = new Unit(
      `unit_${Date.now()}_${Math.random()}`,
      item.unitType,
      rallyPoint,
      state.building.ownerId
    )

    // Notify unit produced
    if (this.onUnitProduced) {
      this.onUnitProduced(unit, state.building)
    }

    // Remove from queue
    state.queue.shift()

    // Start next production if queue not empty
    if (state.queue.length > 0) {
      if (this.onProductionStarted) {
        this.onProductionStarted(state.building, state.queue[0].unitType)
      }
    } else {
      state.isProducing = false
    }
  }

  private getRallyPoint(building: Building) {
    // Default rally point is in front of the building
    return {
      x: building.position.x + 5,
      y: building.position.y,
      z: building.position.z || 0,
    }
  }

  private getUnitCost(unitType: UnitType): Partial<Resources> {
    const config = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
    return config?.cost || {}
  }

  /**
   * Get production queue for a building
   */
  public getQueue(buildingId: string): ProductionQueueItem[] {
    const state = this.productionStates.get(buildingId)
    return state ? [...state.queue] : []
  }

  /**
   * Get current production item
   */
  public getCurrentProduction(buildingId: string): ProductionQueueItem | null {
    const state = this.productionStates.get(buildingId)
    return state && state.queue.length > 0 ? state.queue[0] : null
  }

  /**
   * Get production progress (0-1)
   */
  public getProgress(buildingId: string): number {
    const current = this.getCurrentProduction(buildingId)
    return current ? current.progress : 0
  }

  /**
   * Check if building is producing
   */
  public isProducing(buildingId: string): boolean {
    const state = this.productionStates.get(buildingId)
    return state ? state.isProducing : false
  }

  /**
   * Get available units for a building
   */
  public getAvailableUnits(buildingId: string): UnitType[] {
    const state = this.productionStates.get(buildingId)
    if (!state) return []

    const buildingConfig = BUILDING_TYPES[state.building.type.toUpperCase() as keyof typeof BUILDING_TYPES]
    return (buildingConfig.produces || []) as UnitType[]
  }

  /**
   * Set player resources
   */
  public setResources(resources: Resources) {
    this.resources = { ...resources }
  }

  /**
   * Get player resources
   */
  public getResources(): Resources {
    return { ...this.resources }
  }

  /**
   * Set callback for when unit is produced
   */
  public setOnUnitProduced(callback: (unit: Unit, building: Building) => void) {
    this.onUnitProduced = callback
  }

  /**
   * Set callback for when production starts
   */
  public setOnProductionStarted(callback: (building: Building, unitType: UnitType) => void) {
    this.onProductionStarted = callback
  }

  /**
   * Set callback for when production is canceled
   */
  public setOnProductionCanceled(callback: (building: Building, unitType: UnitType) => void) {
    this.onProductionCanceled = callback
  }

  /**
   * Get production statistics
   */
  public getProductionStats(): {
    totalBuildings: number
    producing: number
    totalQueued: number
  } {
    let producing = 0
    let totalQueued = 0

    this.productionStates.forEach((state) => {
      if (state.isProducing) producing++
      totalQueued += state.queue.length
    })

    return {
      totalBuildings: this.productionStates.size,
      producing,
      totalQueued,
    }
  }

  /**
   * Clear all production states
   */
  public clear() {
    this.productionStates.clear()
  }
}
