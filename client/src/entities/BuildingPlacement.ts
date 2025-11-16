import * as THREE from 'three'
import { BUILDING_TYPES } from '@/config/gameConfig'
import type { BuildingType, Position } from '@/types/game'

/**
 * Building placement preview (ghost building)
 */
export class BuildingPlacement {
  private scene: THREE.Scene
  private buildingType: BuildingType
  private mesh: THREE.Group | null = null
  private isValid = false
  private size: { width: number; height: number }

  constructor(scene: THREE.Scene, buildingType: BuildingType) {
    this.scene = scene
    this.buildingType = buildingType

    const config = BUILDING_TYPES[buildingType.toUpperCase() as keyof typeof BUILDING_TYPES]
    this.size = config.size

    this.createPreviewMesh()
  }

  /**
   * Create ghost building mesh
   */
  private createPreviewMesh() {
    const group = new THREE.Group()

    // Building body (transparent)
    const geometry = new THREE.BoxGeometry(this.size.width, 3, this.size.height)
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      wireframe: false,
    })

    const building = new THREE.Mesh(geometry, material)
    building.position.y = 1.5
    building.castShadow = false
    building.receiveShadow = false
    group.add(building)

    // Outline
    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 2,
    })
    const outline = new THREE.LineSegments(edges, lineMaterial)
    outline.position.y = 1.5
    group.add(outline)

    // Grid indicator on ground
    const gridGeometry = new THREE.PlaneGeometry(this.size.width, this.size.height)
    const gridMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    })
    const gridIndicator = new THREE.Mesh(gridGeometry, gridMaterial)
    gridIndicator.rotation.x = -Math.PI / 2
    gridIndicator.position.y = 0.01
    group.add(gridIndicator)

    this.mesh = group
    this.scene.add(group)
  }

  /**
   * Update preview position
   */
  public updatePosition(position: Position, isValid: boolean) {
    if (!this.mesh) return

    this.mesh.position.set(position.x, 0, position.z || 0)
    this.isValid = isValid

    // Update colors based on validity
    this.mesh.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshBasicMaterial | THREE.MeshStandardMaterial
        if (material) {
          material.color.setHex(isValid ? 0x00ff00 : 0xff0000)
        }
      } else if (child instanceof THREE.LineSegments) {
        const material = child.material as THREE.LineBasicMaterial
        if (material) {
          material.color.setHex(isValid ? 0x00ff00 : 0xff0000)
        }
      }
    })
  }

  /**
   * Get placement validity
   */
  public getIsValid(): boolean {
    return this.isValid
  }

  /**
   * Get current position
   */
  public getPosition(): THREE.Vector3 | null {
    return this.mesh ? this.mesh.position.clone() : null
  }

  /**
   * Get building type
   */
  public getBuildingType(): BuildingType {
    return this.buildingType
  }

  /**
   * Get building size
   */
  public getSize(): { width: number; height: number } {
    return this.size
  }

  /**
   * Dispose preview
   */
  public dispose() {
    if (this.mesh) {
      this.scene.remove(this.mesh)
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.LineSegments) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
      this.mesh = null
    }
  }
}
