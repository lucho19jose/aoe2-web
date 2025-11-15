import * as THREE from 'three'
import { Entity } from './Entity'
import { RESOURCE_TYPES } from '@/config/gameConfig'
import type { Position } from '@/types/game'

/**
 * Resource types that can be gathered
 */
export type ResourceType = 'food' | 'wood' | 'gold' | 'stone'

/**
 * Represents a resource node that can be gathered from
 */
export class ResourceNode extends Entity {
  public resourceType: ResourceType
  public resourceAmount: number
  public maxResourceAmount: number
  public gatherRate: number
  public isDepleted = false
  private resourceBar: THREE.Mesh | null = null

  constructor(
    id: string,
    resourceType: ResourceType,
    position: Position,
    amount: number = 1000
  ) {
    super(id, position, 'nature') // Nature owns resources

    this.resourceType = resourceType
    this.maxResourceAmount = amount
    this.resourceAmount = amount
    this.gatherRate = RESOURCE_TYPES[resourceType.toUpperCase() as keyof typeof RESOURCE_TYPES].gatherRate

    this.createMesh()
  }

  private createMesh() {
    const config = RESOURCE_TYPES[this.resourceType.toUpperCase() as keyof typeof RESOURCE_TYPES]
    const color = config.color

    // Create resource model based on type
    let geometry: THREE.BufferGeometry
    let material: THREE.MeshStandardMaterial

    switch (this.resourceType) {
      case 'food':
        // Berry bush or deer
        geometry = new THREE.SphereGeometry(1, 8, 8)
        material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.9,
          metalness: 0.1,
        })
        break

      case 'wood':
        // Tree
        geometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8)
        material = new THREE.MeshStandardMaterial({
          color: 0x8b7355,
          roughness: 0.9,
          metalness: 0.1,
        })
        break

      case 'gold':
        // Gold mine
        geometry = new THREE.DodecahedronGeometry(1.2)
        material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.3,
          metalness: 0.7,
        })
        break

      case 'stone':
        // Stone mine
        geometry = new THREE.BoxGeometry(2, 1.5, 2)
        material = new THREE.MeshStandardMaterial({
          color: color,
          roughness: 0.8,
          metalness: 0.2,
        })
        break

      default:
        geometry = new THREE.BoxGeometry(1, 1, 1)
        material = new THREE.MeshStandardMaterial({ color: 0xffffff })
    }

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)

    // Adjust Y position based on resource type
    if (this.resourceType === 'wood') {
      this.mesh.position.y = 1.5
    } else {
      this.mesh.position.y = 0.5
    }

    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData = { entityId: this.id, type: 'resource' }

    // Add foliage for trees
    if (this.resourceType === 'wood') {
      const foliageGeometry = new THREE.SphereGeometry(1.5, 8, 8)
      const foliageMaterial = new THREE.MeshStandardMaterial({
        color: 0x228b22,
        roughness: 0.9,
      })
      const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
      foliage.position.y = 2
      foliage.castShadow = true
      this.mesh.add(foliage)
    }

    // Create resource amount bar
    this.createResourceBar()
  }

  private createResourceBar() {
    if (!this.mesh) return

    const barWidth = 2
    const barHeight = 0.1

    // Background
    const bgGeometry = new THREE.PlaneGeometry(barWidth, barHeight)
    const bgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial)
    bgMesh.position.set(0, this.resourceType === 'wood' ? 3.5 : 1.5, 0)
    this.mesh.add(bgMesh)

    // Foreground (resource amount)
    const fgGeometry = new THREE.PlaneGeometry(barWidth, barHeight * 0.8)
    const config = RESOURCE_TYPES[this.resourceType.toUpperCase() as keyof typeof RESOURCE_TYPES]
    const fgMaterial = new THREE.MeshBasicMaterial({ color: config.color })
    this.resourceBar = new THREE.Mesh(fgGeometry, fgMaterial)
    this.resourceBar.position.set(0, this.resourceType === 'wood' ? 3.5 : 1.5, 0.01)
    this.mesh.add(this.resourceBar)
  }

  /**
   * Gather resources from this node
   * @param deltaTime Time since last update
   * @returns Amount of resources gathered
   */
  public gather(deltaTime: number): number {
    if (this.isDepleted || this.resourceAmount <= 0) {
      return 0
    }

    const gathered = Math.min(this.gatherRate * deltaTime, this.resourceAmount)
    this.resourceAmount -= gathered

    if (this.resourceAmount <= 0) {
      this.resourceAmount = 0
      this.isDepleted = true
      this.markDepleted()
    }

    this.updateResourceBar()
    return gathered
  }

  private updateResourceBar() {
    if (!this.resourceBar) return

    const percent = this.resourceAmount / this.maxResourceAmount
    this.resourceBar.scale.x = percent

    // Fade mesh as resource depletes
    if (this.mesh) {
      const material = (this.mesh as THREE.Mesh).material as THREE.MeshStandardMaterial
      material.opacity = 0.3 + (percent * 0.7)
      material.transparent = true
    }
  }

  private markDepleted() {
    if (!this.mesh) return

    // Make mesh semi-transparent
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material.transparent = true
        child.material.opacity = 0.3
      }
    })
  }

  public getResourceType(): ResourceType {
    return this.resourceType
  }

  public getRemainingAmount(): number {
    return this.resourceAmount
  }

  public update(deltaTime: number): void {
    // Resource nodes don't need active updates
    // Gathering is handled externally
  }

  public render(scene: THREE.Scene): void {
    if (this.mesh && !this.mesh.parent) {
      scene.add(this.mesh)
    }
  }

  public dispose(): void {
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
