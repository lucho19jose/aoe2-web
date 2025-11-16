import * as THREE from 'three'
import { Entity } from './Entity'
import { BUILDING_TYPES, COLORS, UNIT_TYPES } from '@/config/gameConfig'
import type { Position, BuildingType, UnitType } from '@/types/game'

/**
 * Production queue item
 */
export interface ProductionQueueItem {
  unitType: UnitType
  progress: number      // 0 to 1
  totalTime: number     // seconds to complete
  remainingTime: number // seconds remaining
}

/**
 * Research queue item
 */
export interface ResearchQueueItem {
  techId: string
  techName: string
  progress: number      // 0 to 1
  totalTime: number     // seconds to complete
  remainingTime: number // seconds remaining
}

/**
 * Represents a game building
 */
export class Building extends Entity {
  public type: BuildingType
  public name: string
  public hp: number
  public maxHp: number
  public isComplete = false
  public buildProgress = 0
  public size: { width: number; height: number }

  // Production system
  public productionQueue: ProductionQueueItem[] = []
  public canProduce: UnitType[] = []
  public maxQueueSize = 10

  // Research system
  public researchQueue: ResearchQueueItem[] = []
  public canResearch: string[] = []
  public maxResearchQueueSize = 1 // Usually buildings can only research one tech at a time

  private selectionBox: THREE.LineSegments | null = null
  private healthBar: THREE.Mesh | null = null
  private productionBar: THREE.Mesh | null = null
  private researchBar: THREE.Mesh | null = null

  constructor(
    id: string,
    type: BuildingType,
    position: Position,
    ownerId: string,
    playerColor: string = '#FF0000'
  ) {
    super(id, position, ownerId)

    this.type = type
    const buildingConfig = BUILDING_TYPES[type.toUpperCase() as keyof typeof BUILDING_TYPES]

    this.name = buildingConfig.name
    this.maxHp = buildingConfig.hp
    this.hp = this.maxHp
    this.size = buildingConfig.size

    // Initialize production capabilities
    if ('produces' in buildingConfig && Array.isArray(buildingConfig.produces)) {
      this.canProduce = buildingConfig.produces as UnitType[]
    }

    this.createMesh(playerColor)
  }

  private createMesh(playerColor: string) {
    const { width, height } = this.size

    // Create building body
    const geometry = new THREE.BoxGeometry(width, height, width)
    const material = new THREE.MeshStandardMaterial({
      color: playerColor,
      roughness: 0.8,
      metalness: 0.2,
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    this.mesh.position.y = height / 2
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData = { entityId: this.id, type: 'building' }

    // Add roof
    const roofGeometry = new THREE.ConeGeometry(width * 0.7, height * 0.3, 4)
    const roofMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.9,
    })
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    roof.rotation.y = Math.PI / 4
    roof.position.y = height * 0.65
    roof.castShadow = true
    this.mesh.add(roof)

    // Create selection box
    const boxGeometry = new THREE.BoxGeometry(width + 0.2, height + 0.2, width + 0.2)
    const edges = new THREE.EdgesGeometry(boxGeometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: COLORS.UI.SELECTION_BOX,
      linewidth: 2,
    })
    this.selectionBox = new THREE.LineSegments(edges, lineMaterial)
    this.selectionBox.visible = false
    this.mesh.add(this.selectionBox)

    // Create health bar background
    const healthBarBg = new THREE.PlaneGeometry(width, 0.2)
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const healthBarBgMesh = new THREE.Mesh(healthBarBg, healthBarBgMaterial)
    healthBarBgMesh.position.set(0, height + 0.5, 0)
    this.mesh.add(healthBarBgMesh)

    // Create health bar
    const healthBarGeometry = new THREE.PlaneGeometry(width, 0.15)
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.UI.HEALTH_BAR_GREEN,
    })
    this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial)
    this.healthBar.position.set(0, height + 0.5, 0.01)
    this.mesh.add(this.healthBar)

    // Create production progress bar (initially hidden)
    const productionBarGeometry = new THREE.PlaneGeometry(width, 0.15)
    const productionBarMaterial = new THREE.MeshBasicMaterial({
      color: 0x4a90e2, // Blue for production
    })
    this.productionBar = new THREE.Mesh(productionBarGeometry, productionBarMaterial)
    this.productionBar.position.set(0, height + 0.8, 0.01)
    this.productionBar.visible = false
    this.mesh.add(this.productionBar)

    // If not complete, make it transparent
    if (!this.isComplete) {
      material.transparent = true
      material.opacity = 0.5
    }
  }

  public completeBuild() {
    this.isComplete = true
    this.buildProgress = 1

    if (this.mesh) {
      const material = (this.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      material.transparent = false
      material.opacity = 1
    }
  }

  public updateBuildProgress(progress: number) {
    this.buildProgress = Math.min(1, Math.max(0, progress))

    if (this.mesh) {
      const material = (this.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      material.opacity = 0.5 + (this.buildProgress * 0.5)
    }

    if (this.buildProgress >= 1) {
      this.completeBuild()
    }
  }

  /**
   * Add a unit to the production queue
   */
  public trainUnit(unitType: UnitType): boolean {
    // Check if building is complete
    if (!this.isComplete) {
      console.warn('Cannot train units in incomplete building')
      return false
    }

    // Check if building can produce this unit
    if (!this.canProduce.includes(unitType)) {
      console.warn(`${this.name} cannot produce ${unitType}`)
      return false
    }

    // Check queue size
    if (this.productionQueue.length >= this.maxQueueSize) {
      console.warn('Production queue is full')
      return false
    }

    // Get unit configuration
    const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
    if (!unitConfig) {
      console.error(`Unit type ${unitType} not found in config`)
      return false
    }

    // Add to queue
    const queueItem: ProductionQueueItem = {
      unitType,
      progress: 0,
      totalTime: unitConfig.trainTime,
      remainingTime: unitConfig.trainTime
    }

    this.productionQueue.push(queueItem)
    console.log(`🏭 ${this.name} started training ${unitType} (${this.productionQueue.length} in queue)`)

    return true
  }

  /**
   * Cancel production of a unit in the queue
   */
  public cancelProduction(index: number = 0): ProductionQueueItem | null {
    if (index < 0 || index >= this.productionQueue.length) {
      return null
    }

    const cancelled = this.productionQueue.splice(index, 1)[0]
    console.log(`❌ Cancelled production of ${cancelled.unitType}`)

    return cancelled
  }

  /**
   * Get the current production progress (0-1)
   */
  public getCurrentProductionProgress(): number {
    if (this.productionQueue.length === 0) return 0
    return this.productionQueue[0].progress
  }

  /**
   * Check if currently producing
   */
  public isProducing(): boolean {
    return this.productionQueue.length > 0
  }

  /**
   * Get completed units (to be spawned by GameEngine)
   */
  public getCompletedUnit(): UnitType | null {
    if (this.productionQueue.length === 0) return null

    const currentProduction = this.productionQueue[0]
    if (currentProduction.remainingTime <= 0) {
      const completed = this.productionQueue.shift()!
      return completed.unitType
    }

    return null
  }

  /**
   * Add a technology to the research queue
   */
  public researchTechnology(techId: string, techName: string, researchTime: number): boolean {
    // Check if building is complete
    if (!this.isComplete) {
      console.warn('Cannot research in incomplete building')
      return false
    }

    // Check queue size
    if (this.researchQueue.length >= this.maxResearchQueueSize) {
      console.warn('Research queue is full')
      return false
    }

    // Add to queue
    const queueItem: ResearchQueueItem = {
      techId,
      techName,
      progress: 0,
      totalTime: researchTime,
      remainingTime: researchTime
    }

    this.researchQueue.push(queueItem)
    console.log(`🔬 ${this.name} started researching ${techName}`)

    return true
  }

  /**
   * Cancel research
   */
  public cancelResearch(index: number = 0): ResearchQueueItem | null {
    if (index < 0 || index >= this.researchQueue.length) {
      return null
    }

    const cancelled = this.researchQueue.splice(index, 1)[0]
    console.log(`❌ Cancelled research of ${cancelled.techName}`)

    return cancelled
  }

  /**
   * Get completed research
   */
  public getCompletedResearch(): string | null {
    if (this.researchQueue.length === 0) return null

    const currentResearch = this.researchQueue[0]
    if (currentResearch.remainingTime <= 0) {
      const completed = this.researchQueue.shift()!
      return completed.techId
    }

    return null
  }

  /**
   * Update research queue
   */
  private updateResearch(deltaTime: number) {
    if (this.researchQueue.length === 0) {
      // Hide research bar
      if (this.researchBar) {
        this.researchBar.visible = false
      }
      return
    }

    // Process first item in queue
    const currentResearch = this.researchQueue[0]
    currentResearch.remainingTime -= deltaTime
    currentResearch.progress = 1 - (currentResearch.remainingTime / currentResearch.totalTime)

    // Update research bar (if we have one)
    if (this.researchBar) {
      this.researchBar.visible = true
      this.researchBar.scale.x = currentResearch.progress
    }

    // Check if completed
    if (currentResearch.remainingTime <= 0) {
      console.log(`✅ ${this.name} completed research ${currentResearch.techName}`)
    }
  }

  /**
   * Update production queue
   */
  private updateProduction(deltaTime: number) {
    if (this.productionQueue.length === 0) {
      // Hide production bar
      if (this.productionBar) {
        this.productionBar.visible = false
      }
      return
    }

    // Process first item in queue
    const currentProduction = this.productionQueue[0]
    currentProduction.remainingTime -= deltaTime
    currentProduction.progress = 1 - (currentProduction.remainingTime / currentProduction.totalTime)

    // Update production bar
    if (this.productionBar) {
      this.productionBar.visible = true
      this.productionBar.scale.x = currentProduction.progress
    }

    // Check if completed
    if (currentProduction.remainingTime <= 0) {
      // Production complete - will be handled by GameEngine via getCompletedUnit()
      console.log(`✅ ${this.name} completed training ${currentProduction.unitType}`)
    }
  }

  public takeDamage(damage: number) {
    this.hp = Math.max(0, this.hp - damage)
    this.updateHealthBar()
    return this.hp <= 0
  }

  private updateHealthBar() {
    if (!this.healthBar) return

    const healthPercent = this.hp / this.maxHp
    this.healthBar.scale.x = healthPercent

    // Update color based on health
    const material = this.healthBar.material as THREE.MeshBasicMaterial
    if (healthPercent > 0.6) {
      material.color.setHex(COLORS.UI.HEALTH_BAR_GREEN)
    } else if (healthPercent > 0.3) {
      material.color.setHex(COLORS.UI.HEALTH_BAR_YELLOW)
    } else {
      material.color.setHex(COLORS.UI.HEALTH_BAR_RED)
    }
  }

  public setSelected(selected: boolean) {
    super.setSelected(selected)
    if (this.selectionBox) {
      this.selectionBox.visible = selected
    }
  }

  public update(deltaTime: number) {
    // Update production queue
    this.updateProduction(deltaTime)

    // Update research queue
    this.updateResearch(deltaTime)

    // Make health bar and production bar always face camera (billboard effect)
    if (this.healthBar && this.mesh) {
      this.healthBar.lookAt(this.healthBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
    }

    if (this.productionBar && this.mesh && this.productionBar.visible) {
      this.productionBar.lookAt(this.productionBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
    }

    if (this.researchBar && this.mesh && this.researchBar.visible) {
      this.researchBar.lookAt(this.researchBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
    }
  }

  public render(scene: THREE.Scene) {
    if (this.mesh && !this.mesh.parent) {
      scene.add(this.mesh)
    }
  }

  public dispose() {
    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh)
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }
}
