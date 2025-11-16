import * as THREE from 'three'
import { Entity } from './Entity'
import { ProductionQueue } from './ProductionQueue'
import { BUILDING_TYPES, COLORS, UNIT_TYPES } from '@/config/gameConfig'
import type { Position, BuildingType, UnitType, Resources } from '@/types/game'

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
  private selectionBox: THREE.LineSegments | null = null
  private healthBar: THREE.Mesh | null = null

  // Production queue
  public productionQueue: ProductionQueue
  public rallyPoint: Position | null = null
  private rallyPointMarker: THREE.Mesh | null = null

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

    // Initialize production queue
    this.productionQueue = new ProductionQueue(5)

    // Set default rally point (in front of building)
    this.rallyPoint = {
      x: position.x,
      y: 0,
      z: position.z + this.size.width + 2
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

  /**
   * Train a unit
   */
  public trainUnit(unitType: UnitType, cost: Partial<Resources>): boolean {
    if (!this.isComplete) return false

    const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
    if (!unitConfig) return false

    // Check if building can produce this unit type
    if (!this.canProduceUnit(unitType)) return false

    // Add to queue
    const trainingTime = unitConfig.trainTime || 10 // Default 10 seconds
    return this.productionQueue.addUnit(unitType, trainingTime, cost)
  }

  /**
   * Check if building can produce a unit type
   */
  public canProduceUnit(unitType: UnitType): boolean {
    switch (this.type) {
      case 'town_center':
        return unitType === 'villager'
      case 'barracks':
        return ['militia', 'spearman', 'swordsman'].includes(unitType)
      case 'archery_range':
        return ['archer', 'crossbowman', 'skirmisher'].includes(unitType)
      case 'stable':
        return ['scout', 'knight', 'cavalry_archer'].includes(unitType)
      default:
        return false
    }
  }

  /**
   * Set rally point
   */
  public setRallyPoint(position: Position) {
    this.rallyPoint = position

    // Update rally point marker
    if (this.rallyPointMarker) {
      this.rallyPointMarker.position.set(position.x, position.y, position.z)
    } else {
      this.createRallyPointMarker()
    }
  }

  /**
   * Create rally point visual marker
   */
  private createRallyPointMarker() {
    if (!this.rallyPoint || !this.mesh) return

    // Create flag pole
    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.set(this.rallyPoint.x, 1, this.rallyPoint.z)

    // Create flag
    const flagGeometry = new THREE.PlaneGeometry(1, 0.6)
    const flagMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      side: THREE.DoubleSide
    })
    const flag = new THREE.Mesh(flagGeometry, flagMaterial)
    flag.position.set(0.5, 0.7, 0)
    pole.add(flag)

    this.rallyPointMarker = pole
    this.mesh.parent?.add(pole)
  }

  /**
   * Hide rally point marker
   */
  public hideRallyPoint() {
    if (this.rallyPointMarker) {
      this.rallyPointMarker.parent?.remove(this.rallyPointMarker)
      this.rallyPointMarker.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
      this.rallyPointMarker = null
    }
  }

  public update(deltaTime: number) {
    // Update production queue
    if (this.isComplete) {
      this.productionQueue.update(deltaTime)
      // Note: Unit spawning will be handled by GameEngine
    }

    // Make health bar always face camera (billboard effect)
    if (this.healthBar && this.mesh) {
      this.healthBar.lookAt(this.healthBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
    }
  }

  public render(scene: THREE.Scene) {
    if (this.mesh && !this.mesh.parent) {
      scene.add(this.mesh)
    }
  }

  public dispose() {
    // Clean up rally point marker
    this.hideRallyPoint()

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
