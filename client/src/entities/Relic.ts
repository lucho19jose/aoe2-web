import * as THREE from 'three'
import { Entity } from './Entity'
import type { Position } from '@/types/game'

/**
 * Represents a game relic that can be collected and garrisoned
 */
export class Relic extends Entity {
  public name: string
  public isCollected: boolean = false
  public carriedByUnitId: string | null = null
  public garrisonedInBuildingId: string | null = null

  private glowMesh: THREE.Mesh | null = null
  private rotationSpeed: number = 0.5

  constructor(
    id: string,
    position: Position,
    name: string = 'Holy Relic'
  ) {
    super(id, position, 'neutral')

    this.name = name
    this.createMesh()
  }

  private createMesh() {
    // Create relic base (golden pedestal)
    const pedestalGeometry = new THREE.CylinderGeometry(0.5, 0.6, 0.3, 8)
    const pedestalMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      metalness: 0.8,
      roughness: 0.2,
    })
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
    pedestal.position.y = 0.15
    pedestal.castShadow = true

    // Create relic artifact (small cross/chalice)
    const relicGeometry = new THREE.BoxGeometry(0.3, 0.8, 0.1)
    const relicMaterial = new THREE.MeshStandardMaterial({
      color: 0xffea00,
      metalness: 0.9,
      roughness: 0.1,
      emissive: 0xffea00,
      emissiveIntensity: 0.3,
    })
    const relic = new THREE.Mesh(relicGeometry, relicMaterial)
    relic.position.y = 0.8
    relic.castShadow = true

    // Create horizontal bar for cross shape
    const barGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.1)
    const bar = new THREE.Mesh(barGeometry, relicMaterial)
    bar.position.y = 0.9
    relic.add(bar)

    // Create glow effect
    const glowGeometry = new THREE.SphereGeometry(0.8, 16, 16)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.2,
    })
    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    this.glowMesh.position.y = 0.8

    // Create group
    this.mesh = new THREE.Group()
    this.mesh.add(pedestal)
    this.mesh.add(relic)
    this.mesh.add(this.glowMesh)
    this.mesh.position.copy(this.position)
    this.mesh.userData = { entityId: this.id, type: 'relic' }

    // Add selection ring
    const ringGeometry = new THREE.RingGeometry(0.6, 0.7, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.05
    this.mesh.add(ring)
  }

  public collect(unitId: string) {
    this.isCollected = true
    this.carriedByUnitId = unitId
    if (this.mesh) {
      this.mesh.visible = false
    }
  }

  public garrison(buildingId: string) {
    this.garrisonedInBuildingId = buildingId
    this.carriedByUnitId = null
    if (this.mesh) {
      this.mesh.visible = false
    }
  }

  public isAvailable(): boolean {
    return !this.isCollected && !this.garrisonedInBuildingId
  }

  public update(deltaTime: number) {
    if (!this.mesh || !this.isAvailable()) return

    // Rotate relic slowly for visual effect
    this.mesh.rotation.y += this.rotationSpeed * deltaTime

    // Pulse glow effect
    if (this.glowMesh) {
      const pulseFactor = Math.sin(Date.now() * 0.002) * 0.1 + 0.2
      const material = this.glowMesh.material as THREE.MeshBasicMaterial
      material.opacity = pulseFactor
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
