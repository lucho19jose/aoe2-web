import * as THREE from 'three'
import { Entity } from './Entity'
import { RESOURCE_NODES } from '@/config/gameConfig'
import type { Position, ResourceType } from '@/types/game'

/**
 * Represents a resource node on the map (tree, mine, etc.)
 */
export class Resource extends Entity {
  public type: ResourceType
  public name: string
  public amount: number
  public maxAmount: number
  public harvestRate: number
  public regenerates: boolean
  public regenerationTime?: number
  public isBeingHarvested = false
  public depleted = false
  private size: number
  private height: number
  private color: number

  constructor(
    id: string,
    type: ResourceType,
    position: Position
  ) {
    super(id, position, 'neutral')

    this.type = type

    // Get config for this resource type
    const configKey = type.toUpperCase().replace('_', '_') as keyof typeof RESOURCE_NODES
    const config = RESOURCE_NODES[configKey]

    this.name = config.name
    this.maxAmount = config.amount
    this.amount = this.maxAmount
    this.harvestRate = config.harvestRate
    this.regenerates = config.regenerates
    this.regenerationTime = (config as any).regenerationTime
    this.size = config.size
    this.height = config.height
    this.color = config.color

    this.createMesh()
  }

  private createMesh() {
    const group = new THREE.Group()

    // Create different shapes based on resource type
    switch (this.type) {
      case 'tree':
        this.createTreeMesh(group)
        break
      case 'gold_mine':
        this.createMineMesh(group, this.color, 'gold')
        break
      case 'stone_mine':
        this.createMineMesh(group, this.color, 'stone')
        break
      case 'berry_bush':
        this.createBushMesh(group)
        break
      case 'deer':
        this.createDeerMesh(group)
        break
      default:
        this.createDefaultMesh(group)
    }

    group.position.copy(this.position)
    group.userData = { entityId: this.id, type: 'resource', resourceType: this.type }

    this.mesh = group
  }

  /**
   * Create tree mesh (trunk + foliage)
   */
  private createTreeMesh(group: THREE.Group) {
    // Trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, this.height * 0.4, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({
      color: 0x4a3728,
      roughness: 0.9,
    })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = this.height * 0.2
    trunk.castShadow = true
    trunk.receiveShadow = true
    group.add(trunk)

    // Foliage (sphere)
    const foliageGeometry = new THREE.SphereGeometry(this.size * 0.6, 8, 6)
    const foliageMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.8,
    })
    const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial)
    foliage.position.y = this.height * 0.6
    foliage.castShadow = true
    foliage.receiveShadow = true
    group.add(foliage)

    // Add some variation with smaller spheres
    for (let i = 0; i < 3; i++) {
      const smallFoliage = new THREE.Mesh(
        new THREE.SphereGeometry(this.size * 0.3, 6, 4),
        foliageMaterial
      )
      const angle = (i / 3) * Math.PI * 2
      smallFoliage.position.set(
        Math.cos(angle) * 0.4,
        this.height * 0.65,
        Math.sin(angle) * 0.4
      )
      smallFoliage.castShadow = true
      group.add(smallFoliage)
    }
  }

  /**
   * Create mine mesh (rocks)
   */
  private createMineMesh(group: THREE.Group, color: number, type: 'gold' | 'stone') {
    const material = new THREE.MeshStandardMaterial({
      color: color,
      roughness: type === 'gold' ? 0.3 : 0.9,
      metalness: type === 'gold' ? 0.8 : 0.1,
    })

    // Main rock
    const mainGeometry = new THREE.DodecahedronGeometry(this.size * 0.6, 0)
    const mainRock = new THREE.Mesh(mainGeometry, material)
    mainRock.position.y = this.height * 0.4
    mainRock.rotation.set(
      Math.random() * 0.5,
      Math.random() * Math.PI * 2,
      Math.random() * 0.5
    )
    mainRock.castShadow = true
    mainRock.receiveShadow = true
    group.add(mainRock)

    // Smaller surrounding rocks
    for (let i = 0; i < 4; i++) {
      const smallGeometry = new THREE.DodecahedronGeometry(this.size * 0.3, 0)
      const smallRock = new THREE.Mesh(smallGeometry, material)
      const angle = (i / 4) * Math.PI * 2
      const radius = this.size * 0.6
      smallRock.position.set(
        Math.cos(angle) * radius,
        this.height * 0.2,
        Math.sin(angle) * radius
      )
      smallRock.rotation.set(
        Math.random() * 0.5,
        Math.random() * Math.PI * 2,
        Math.random() * 0.5
      )
      smallRock.castShadow = true
      smallRock.receiveShadow = true
      group.add(smallRock)
    }
  }

  /**
   * Create berry bush mesh
   */
  private createBushMesh(group: THREE.Group) {
    const bushMaterial = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.9,
    })

    const berryMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.6,
    })

    // Bush body (irregular sphere)
    const bushGeometry = new THREE.SphereGeometry(this.size * 0.5, 6, 4)
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.position.y = this.height * 0.5
    bush.scale.set(1, 0.8, 1)
    bush.castShadow = true
    bush.receiveShadow = true
    group.add(bush)

    // Berries (small spheres)
    for (let i = 0; i < 6; i++) {
      const berry = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 4, 4),
        berryMaterial
      )
      const angle = (i / 6) * Math.PI * 2
      const radius = this.size * 0.4
      berry.position.set(
        Math.cos(angle) * radius,
        this.height * 0.5 + Math.random() * 0.3,
        Math.sin(angle) * radius
      )
      berry.castShadow = true
      group.add(berry)
    }
  }

  /**
   * Create deer mesh
   */
  private createDeerMesh(group: THREE.Group) {
    const deerMaterial = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.8,
    })

    // Body
    const bodyGeometry = new THREE.BoxGeometry(this.size * 0.6, 0.4, 0.8)
    const body = new THREE.Mesh(bodyGeometry, deerMaterial)
    body.position.y = 0.6
    body.castShadow = true
    body.receiveShadow = true
    group.add(body)

    // Head
    const headGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3)
    const head = new THREE.Mesh(headGeometry, deerMaterial)
    head.position.set(0, 0.8, -0.5)
    head.castShadow = true
    group.add(head)

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 4)
    const positions = [
      { x: -0.2, z: 0.3 },
      { x: 0.2, z: 0.3 },
      { x: -0.2, z: -0.3 },
      { x: 0.2, z: -0.3 },
    ]

    positions.forEach(pos => {
      const leg = new THREE.Mesh(legGeometry, deerMaterial)
      leg.position.set(pos.x, 0.25, pos.z)
      leg.castShadow = true
      group.add(leg)
    })
  }

  /**
   * Create default mesh (placeholder)
   */
  private createDefaultMesh(group: THREE.Group) {
    const geometry = new THREE.BoxGeometry(this.size, this.height, this.size)
    const material = new THREE.MeshStandardMaterial({
      color: this.color,
      roughness: 0.7,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = this.height / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  /**
   * Harvest resources from this node
   */
  public harvest(amount: number): number {
    if (this.depleted) return 0

    const harvested = Math.min(amount, this.amount)
    this.amount -= harvested

    if (this.amount <= 0) {
      this.amount = 0
      this.depleted = true
      this.onDeplete()
    }

    return harvested
  }

  /**
   * Handle resource depletion
   */
  private onDeplete() {
    if (this.mesh) {
      // Fade out or change appearance
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.transparent = true
          material.opacity = 0.3
        }
      })
    }

    // TODO: Schedule regeneration if applicable
    if (this.regenerates && this.regenerationTime) {
      setTimeout(() => this.regenerate(), this.regenerationTime * 1000)
    }
  }

  /**
   * Regenerate resource
   */
  private regenerate() {
    this.amount = this.maxAmount
    this.depleted = false
    this.isBeingHarvested = false

    if (this.mesh) {
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial
          material.opacity = 1.0
        }
      })
    }
  }

  /**
   * Get resource amount percentage
   */
  public getAmountPercent(): number {
    return this.amount / this.maxAmount
  }

  /**
   * Check if resource is available
   */
  public isAvailable(): boolean {
    return !this.depleted && this.amount > 0
  }

  public update(deltaTime: number) {
    // Resources are mostly static, but could add animations here
    // e.g., swaying trees, glowing mines
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
