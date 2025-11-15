import { Unit } from '@/entities/Unit'
import { ResourceNode, ResourceType } from '@/entities/ResourceNode'
import { Building } from '@/entities/Building'
import type { Position, Resources } from '@/types/game'
import { calculateDistance, findNearestBuilding } from '@/utils/gameUtils'

/**
 * Resource gathering system - manages villagers gathering resources
 */

interface GatheringState {
  villager: Unit
  targetResource: ResourceNode | null
  dropoffBuilding: Building | null
  carriedAmount: number
  carriedType: ResourceType | null
  state: 'idle' | 'moving_to_resource' | 'gathering' | 'moving_to_dropoff' | 'dropping_off'
}

export class ResourceGatheringSystem {
  private gatheringStates: Map<string, GatheringState> = new Map()
  private resources: Map<string, ResourceNode> = new Map()
  private dropoffBuildings: Building[] = []
  private playerResources: Resources = { food: 200, wood: 200, gold: 100, stone: 100 }

  // Gathering parameters
  private readonly CARRY_CAPACITY = 10
  private readonly GATHERING_RANGE = 2
  private readonly DROPOFF_RANGE = 3
  private readonly GATHER_TIME = 1 // Time to gather full capacity

  /**
   * Add a villager to the gathering system
   */
  public addVillager(villager: Unit) {
    if (villager.type !== 'villager') return

    if (!this.gatheringStates.has(villager.id)) {
      this.gatheringStates.set(villager.id, {
        villager,
        targetResource: null,
        dropoffBuilding: null,
        carriedAmount: 0,
        carriedType: null,
        state: 'idle',
      })
    }
  }

  /**
   * Remove a villager from the gathering system
   */
  public removeVillager(villagerId: string) {
    this.gatheringStates.delete(villagerId)
  }

  /**
   * Add a resource node to the system
   */
  public addResourceNode(resource: ResourceNode) {
    this.resources.set(resource.id, resource)
  }

  /**
   * Remove a resource node
   */
  public removeResourceNode(resourceId: string) {
    this.resources.delete(resourceId)
  }

  /**
   * Set buildings where resources can be dropped off
   */
  public setDropoffBuildings(buildings: Building[]) {
    this.dropoffBuildings = buildings.filter(
      (b) => b.type === 'town_center' || b.type === 'market'
    )
  }

  /**
   * Command a villager to gather from a specific resource
   */
  public commandGather(villagerId: string, resourceId: string) {
    const state = this.gatheringStates.get(villagerId)
    const resource = this.resources.get(resourceId)

    if (!state || !resource || resource.isDepleted) return

    state.targetResource = resource
    state.state = 'moving_to_resource'
    state.villager.moveTo(resource.position)
  }

  /**
   * Command a villager to gather a specific resource type (finds nearest)
   */
  public commandGatherType(villagerId: string, resourceType: ResourceType) {
    const state = this.gatheringStates.get(villagerId)
    if (!state) return

    const nearestResource = this.findNearestResourceOfType(
      state.villager.position,
      resourceType
    )

    if (nearestResource) {
      this.commandGather(villagerId, nearestResource.id)
    }
  }

  /**
   * Find nearest resource of a specific type
   */
  private findNearestResourceOfType(
    position: Position,
    resourceType: ResourceType
  ): ResourceNode | null {
    let nearest: ResourceNode | null = null
    let minDistance = Infinity

    this.resources.forEach((resource) => {
      if (resource.resourceType === resourceType && !resource.isDepleted) {
        const distance = calculateDistance(position, resource.position)
        if (distance < minDistance) {
          minDistance = distance
          nearest = resource
        }
      }
    })

    return nearest
  }

  /**
   * Update the gathering system
   */
  public update(deltaTime: number) {
    this.gatheringStates.forEach((state) => {
      this.updateVillagerState(state, deltaTime)
    })
  }

  private updateVillagerState(state: GatheringState, deltaTime: number) {
    switch (state.state) {
      case 'idle':
        // Villager is idle, do nothing
        break

      case 'moving_to_resource':
        if (!state.targetResource || state.targetResource.isDepleted) {
          // Resource gone or depleted, go back to idle
          state.state = 'idle'
          state.targetResource = null
          state.villager.stop()
          break
        }

        // Check if arrived at resource
        const distToResource = calculateDistance(
          state.villager.position,
          state.targetResource.position
        )

        if (distToResource <= this.GATHERING_RANGE) {
          state.state = 'gathering'
          state.villager.stop()
          state.carriedType = state.targetResource.resourceType
        }
        break

      case 'gathering':
        if (!state.targetResource || state.targetResource.isDepleted) {
          // Resource depleted, find another or return to dropoff
          if (state.carriedAmount > 0) {
            this.startDropoff(state)
          } else {
            // Try to find another resource of same type
            const newResource = this.findNearestResourceOfType(
              state.villager.position,
              state.carriedType!
            )
            if (newResource) {
              state.targetResource = newResource
              state.state = 'moving_to_resource'
              state.villager.moveTo(newResource.position)
            } else {
              state.state = 'idle'
              state.carriedType = null
            }
          }
          break
        }

        // Gather resources
        const gathered = state.targetResource.gather(deltaTime)
        state.carriedAmount += gathered

        // Check if inventory full or resource depleted
        if (state.carriedAmount >= this.CARRY_CAPACITY || state.targetResource.isDepleted) {
          this.startDropoff(state)
        }
        break

      case 'moving_to_dropoff':
        if (!state.dropoffBuilding) {
          // No dropoff building, go idle
          state.state = 'idle'
          state.villager.stop()
          break
        }

        // Check if arrived at dropoff
        const distToDropoff = calculateDistance(
          state.villager.position,
          state.dropoffBuilding.position
        )

        if (distToDropoff <= this.DROPOFF_RANGE) {
          state.state = 'dropping_off'
          state.villager.stop()
        }
        break

      case 'dropping_off':
        // Add resources to player
        if (state.carriedType && state.carriedAmount > 0) {
          this.addResources(state.carriedType, state.carriedAmount)
          state.carriedAmount = 0
        }

        // Return to gathering
        if (state.targetResource && !state.targetResource.isDepleted) {
          state.state = 'moving_to_resource'
          state.villager.moveTo(state.targetResource.position)
        } else {
          // Find new resource of same type
          if (state.carriedType) {
            const newResource = this.findNearestResourceOfType(
              state.villager.position,
              state.carriedType
            )
            if (newResource) {
              state.targetResource = newResource
              state.state = 'moving_to_resource'
              state.villager.moveTo(newResource.position)
            } else {
              state.state = 'idle'
              state.carriedType = null
            }
          } else {
            state.state = 'idle'
          }
        }
        break
    }
  }

  private startDropoff(state: GatheringState) {
    const dropoff = findNearestBuilding(state.villager.position, this.dropoffBuildings)

    if (dropoff) {
      state.dropoffBuilding = dropoff
      state.state = 'moving_to_dropoff'
      state.villager.moveTo(dropoff.position)
    } else {
      // No dropoff available, stay at resource
      state.state = 'idle'
    }
  }

  private addResources(type: ResourceType, amount: number) {
    this.playerResources[type] += amount
  }

  /**
   * Get current player resources
   */
  public getResources(): Resources {
    return { ...this.playerResources }
  }

  /**
   * Set player resources (for syncing with server)
   */
  public setResources(resources: Resources) {
    this.playerResources = { ...resources }
  }

  /**
   * Get villager gathering state
   */
  public getVillagerState(villagerId: string): GatheringState | undefined {
    return this.gatheringStates.get(villagerId)
  }

  /**
   * Get all active gatherers
   */
  public getActiveGatherers(): GatheringState[] {
    return Array.from(this.gatheringStates.values()).filter(
      (state) => state.state !== 'idle'
    )
  }

  /**
   * Get resource statistics
   */
  public getResourceStats(): {
    total: number
    byType: Record<ResourceType, number>
    depleted: number
  } {
    const stats = {
      total: this.resources.size,
      byType: {
        food: 0,
        wood: 0,
        gold: 0,
        stone: 0,
      } as Record<ResourceType, number>,
      depleted: 0,
    }

    this.resources.forEach((resource) => {
      stats.byType[resource.resourceType]++
      if (resource.isDepleted) {
        stats.depleted++
      }
    })

    return stats
  }

  /**
   * Clear all gathering states
   */
  public clear() {
    this.gatheringStates.clear()
    this.resources.clear()
    this.dropoffBuildings = []
  }
}
