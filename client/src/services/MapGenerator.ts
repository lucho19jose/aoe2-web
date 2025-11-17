import * as THREE from 'three'
import { Resource } from '@/entities/Resource'
import { RESOURCE_SPAWN } from '@/config/gameConfig'
import type { ResourceType } from '@/types/game'
import { HybridNavigationGrid } from '@/pathfinding/HybridNavigationGrid'

export type MapType = 'arabia' | 'black_forest' | 'oasis' | 'nomad'

export interface MapSize {
  width: number
  height: number
  name: string
}

export const MAP_SIZES: Record<string, MapSize> = {
  small: { width: 100, height: 100, name: 'Small' },
  medium: { width: 150, height: 150, name: 'Medium' },
  large: { width: 200, height: 200, name: 'Large' }
}

export interface GeneratedMap {
  terrain: THREE.Mesh
  resources: Map<string, Resource>
  playerStartPositions: Array<{ x: number, z: number }>
  navigationGrid: HybridNavigationGrid
  hasInitialTownCenter: boolean
}

export class MapGenerator {
  private mapType: MapType
  private mapSize: MapSize
  private scene: THREE.Scene

  constructor(mapType: MapType, mapSize: MapSize, scene: THREE.Scene) {
    this.mapType = mapType
    this.mapSize = mapSize
    this.scene = scene
  }

  /**
   * Generate complete map based on type
   */
  public generate(): GeneratedMap {
    switch (this.mapType) {
      case 'arabia':
        return this.generateArabia()
      case 'black_forest':
        return this.generateBlackForest()
      case 'oasis':
        return this.generateOasis()
      case 'nomad':
        return this.generateNomad()
      default:
        return this.generateArabia()
    }
  }

  /**
   * ARABIA - Open map with balanced resources
   * Características:
   * - Terreno abierto mayormente plano
   * - Recursos distribuidos uniformemente
   * - Algunos bosques pequeños dispersos
   * - Ideal para rush strategies
   */
  private generateArabia(): GeneratedMap {
    const { width, height } = this.mapSize
    const resources = new Map<string, Resource>()
    const navigationGrid = new HybridNavigationGrid(width, 1)

    // Create terrain - sandy/desert color
    const terrain = this.createTerrain(0xd2b48c) // tan/sandy color

    // Player start positions (2-8 players in circle)
    const playerStartPositions = this.generateCircularStartPositions(2)

    let resourceId = 0

    // Generate resources around each player start
    playerStartPositions.forEach((startPos, playerIndex) => {
      // Close resources (starting resources)
      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'tree',
        8,
        3,
        7,
        resourceId
      )
      resourceId += 8

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'berry_bush',
        6,
        8,
        12,
        resourceId
      )
      resourceId += 6

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'deer',
        4,
        10,
        15,
        resourceId
      )
      resourceId += 4

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'gold_mine',
        3,
        10,
        15,
        resourceId
      )
      resourceId += 3

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'stone_mine',
        2,
        12,
        18,
        resourceId
      )
      resourceId += 2
    })

    // Central resources (contested)
    const centerPos = { x: 0, z: 0 }
    this.spawnResourceNearPosition(
      resources,
      navigationGrid,
      centerPos,
      'gold_mine',
      5,
      5,
      20,
      resourceId
    )
    resourceId += 5

    this.spawnResourceNearPosition(
      resources,
      navigationGrid,
      centerPos,
      'stone_mine',
      4,
      5,
      20,
      resourceId
    )
    resourceId += 4

    // Scattered wood across map
    this.spawnScatteredResource(
      resources,
      navigationGrid,
      'tree',
      20,
      30,
      resourceId
    )

    return {
      terrain,
      resources,
      playerStartPositions,
      navigationGrid,
      hasInitialTownCenter: true
    }
  }

  /**
   * BLACK FOREST (Selva Negra) - Dense forest map
   * Características:
   * - Bosques muy densos rodeando a cada jugador
   * - Forma "paredes" naturales de árboles
   * - Recursos abundantes en madera
   * - Difícil acceso entre jugadores al inicio
   */
  private generateBlackForest(): GeneratedMap {
    const { width, height } = this.mapSize
    const resources = new Map<string, Resource>()
    const navigationGrid = new HybridNavigationGrid(width, 1)

    // Create terrain - dark green forest
    const terrain = this.createTerrain(0x1a5f1a)

    // Player start positions
    const playerStartPositions = this.generateCircularStartPositions(2)

    let resourceId = 0

    // For each player, create a clearing surrounded by dense forest
    playerStartPositions.forEach((startPos, playerIndex) => {
      // Small clearing around player (radius ~20)
      const clearingRadius = 20

      // Dense forest wall around clearing
      const wallThickness = 15
      const wallInnerRadius = clearingRadius
      const wallOuterRadius = clearingRadius + wallThickness

      // Create dense tree wall
      const treesInWall = 80
      for (let i = 0; i < treesInWall; i++) {
        const angle = (i / treesInWall) * Math.PI * 2
        const radius = wallInnerRadius + Math.random() * wallThickness
        const x = startPos.x + Math.cos(angle) * radius
        const z = startPos.z + Math.sin(angle) * radius

        if (this.isWithinBounds(x, z)) {
          const resource = new Resource(
            `resource_tree_${resourceId++}`,
            'tree',
            { x, y: 0, z }
          )
          resources.set(resource.id, resource)
          resource.render(this.scene)
          navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
        }
      }

      // Starting resources inside clearing
      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'berry_bush',
        6,
        8,
        12,
        resourceId
      )
      resourceId += 6

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'deer',
        4,
        10,
        15,
        resourceId
      )
      resourceId += 4

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'gold_mine',
        4,
        12,
        16,
        resourceId
      )
      resourceId += 4

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'stone_mine',
        3,
        12,
        16,
        resourceId
      )
      resourceId += 3

      // Additional trees scattered in clearing (sparse)
      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'tree',
        10,
        5,
        clearingRadius - 5,
        resourceId
      )
      resourceId += 10
    })

    // Fill rest of map with dense forest
    const additionalTrees = 100
    for (let i = 0; i < additionalTrees; i++) {
      const x = (Math.random() - 0.5) * width
      const z = (Math.random() - 0.5) * height

      // Check not too close to player starts
      let tooClose = false
      for (const startPos of playerStartPositions) {
        const dist = Math.sqrt(
          Math.pow(x - startPos.x, 2) + Math.pow(z - startPos.z, 2)
        )
        if (dist < 25) {
          // Don't place in clearings
          tooClose = true
          break
        }
      }

      if (!tooClose && this.isWithinBounds(x, z)) {
        const resource = new Resource(
          `resource_tree_${resourceId++}`,
          'tree',
          { x, y: 0, z }
        )
        resources.set(resource.id, resource)
        resource.render(this.scene)
        navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
      }
    }

    return {
      terrain,
      resources,
      playerStartPositions,
      navigationGrid,
      hasInitialTownCenter: true
    }
  }

  /**
   * OASIS - Water in center with resources around
   * Características:
   * - Lago/oasis grande en el centro
   * - Recursos distribuidos alrededor del agua
   * - Jugadores en los bordes
   * - Control del centro es clave
   */
  private generateOasis(): GeneratedMap {
    const { width, height } = this.mapSize
    const resources = new Map<string, Resource>()
    const navigationGrid = new HybridNavigationGrid(width, 1)

    // Create terrain - desert sand
    const terrain = this.createTerrain(0xedc9af)

    // Player start positions (away from center)
    const playerStartPositions = this.generateCircularStartPositions(2, 0.7)

    let resourceId = 0

    // Create water obstacle in center
    const waterRadius = width * 0.2
    this.addCircularWaterObstacle(navigationGrid, { x: 0, z: 0 }, waterRadius)

    // Resources around water (contested area)
    const resourcesAroundWater = 30
    const waterRingRadius = waterRadius + 8
    for (let i = 0; i < resourcesAroundWater; i++) {
      const angle = (i / resourcesAroundWater) * Math.PI * 2
      const radiusVariation = Math.random() * 5
      const radius = waterRingRadius + radiusVariation

      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius

      // Alternate between resources
      const resourceTypes: ResourceType[] = ['tree', 'gold_mine', 'berry_bush']
      const resourceType = resourceTypes[i % 3]

      const resource = new Resource(
        `resource_${resourceType}_${resourceId++}`,
        resourceType,
        { x, y: 0, z }
      )
      resources.set(resource.id, resource)
      resource.render(this.scene)
      navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
    }

    // Player starting resources
    playerStartPositions.forEach((startPos) => {
      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'tree',
        8,
        3,
        10,
        resourceId
      )
      resourceId += 8

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'berry_bush',
        6,
        8,
        12,
        resourceId
      )
      resourceId += 6

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'gold_mine',
        3,
        10,
        15,
        resourceId
      )
      resourceId += 3

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'stone_mine',
        2,
        12,
        18,
        resourceId
      )
      resourceId += 2

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        startPos,
        'deer',
        4,
        10,
        15,
        resourceId
      )
      resourceId += 4
    })

    // Scattered trees
    this.spawnScatteredResource(
      resources,
      navigationGrid,
      'tree',
      15,
      25,
      resourceId
    )

    return {
      terrain,
      resources,
      playerStartPositions,
      navigationGrid,
      hasInitialTownCenter: true
    }
  }

  /**
   * NOMAD - No town center, start with villagers only
   * Características:
   * - Sin Town Center inicial
   * - Jugadores empiezan con 3 villagers
   * - Deben encontrar su lugar para asentarse
   * - Recursos muy distribuidos
   */
  private generateNomad(): GeneratedMap {
    const { width, height } = this.mapSize
    const resources = new Map<string, Resource>()
    const navigationGrid = new HybridNavigationGrid(width, 1)

    // Create terrain - grassland
    const terrain = this.createTerrain(0x3a7d3a)

    // Player start positions (random, not too close)
    const playerStartPositions = this.generateScatteredStartPositions(2)

    let resourceId = 0

    // Highly distributed resources across entire map
    const numClusters = 15

    for (let c = 0; c < numClusters; c++) {
      const clusterX = (Math.random() - 0.5) * width * 0.8
      const clusterZ = (Math.random() - 0.5) * height * 0.8

      // Mix of all resource types in each cluster
      const clusterPos = { x: clusterX, z: clusterZ }

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        clusterPos,
        'tree',
        6,
        2,
        8,
        resourceId
      )
      resourceId += 6

      this.spawnResourceNearPosition(
        resources,
        navigationGrid,
        clusterPos,
        'berry_bush',
        4,
        3,
        10,
        resourceId
      )
      resourceId += 4

      if (Math.random() > 0.5) {
        this.spawnResourceNearPosition(
          resources,
          navigationGrid,
          clusterPos,
          'gold_mine',
          2,
          2,
          8,
          resourceId
        )
        resourceId += 2
      }

      if (Math.random() > 0.5) {
        this.spawnResourceNearPosition(
          resources,
          navigationGrid,
          clusterPos,
          'stone_mine',
          2,
          2,
          8,
          resourceId
        )
        resourceId += 2
      }

      if (Math.random() > 0.3) {
        this.spawnResourceNearPosition(
          resources,
          navigationGrid,
          clusterPos,
          'deer',
          3,
          5,
          12,
          resourceId
        )
        resourceId += 3
      }
    }

    return {
      terrain,
      resources,
      playerStartPositions,
      navigationGrid,
      hasInitialTownCenter: false // KEY: No initial town center!
    }
  }

  /**
   * Create terrain mesh
   */
  private createTerrain(color: number): THREE.Mesh {
    const { width, height } = this.mapSize
    const terrainGeometry = new THREE.PlaneGeometry(width, height, 50, 50)
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.2
    })
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
    terrain.rotation.x = -Math.PI / 2
    terrain.receiveShadow = true
    return terrain
  }

  /**
   * Generate player start positions in a circle
   */
  private generateCircularStartPositions(
    numPlayers: number,
    radiusMultiplier: number = 0.6
  ): Array<{ x: number; z: number }> {
    const positions: Array<{ x: number; z: number }> = []
    const radius = Math.min(this.mapSize.width, this.mapSize.height) * radiusMultiplier * 0.4

    for (let i = 0; i < numPlayers; i++) {
      const angle = (i / numPlayers) * Math.PI * 2
      positions.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius
      })
    }

    return positions
  }

  /**
   * Generate scattered player start positions
   */
  private generateScatteredStartPositions(
    numPlayers: number
  ): Array<{ x: number; z: number }> {
    const positions: Array<{ x: number; z: number }> = []
    const minDistance = Math.min(this.mapSize.width, this.mapSize.height) * 0.3

    for (let i = 0; i < numPlayers; i++) {
      let attempts = 0
      let validPosition = false
      let x = 0
      let z = 0

      while (!validPosition && attempts < 50) {
        x = (Math.random() - 0.5) * this.mapSize.width * 0.7
        z = (Math.random() - 0.5) * this.mapSize.height * 0.7

        // Check distance from other positions
        validPosition = true
        for (const pos of positions) {
          const dist = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(z - pos.z, 2))
          if (dist < minDistance) {
            validPosition = false
            break
          }
        }

        attempts++
      }

      positions.push({ x, z })
    }

    return positions
  }

  /**
   * Spawn resources near a position
   */
  private spawnResourceNearPosition(
    resources: Map<string, Resource>,
    navigationGrid: HybridNavigationGrid,
    centerPos: { x: number; z: number },
    resourceType: ResourceType,
    count: number,
    minRadius: number,
    maxRadius: number,
    startId: number
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = minRadius + Math.random() * (maxRadius - minRadius)
      const x = centerPos.x + Math.cos(angle) * radius
      const z = centerPos.z + Math.sin(angle) * radius

      if (this.isWithinBounds(x, z)) {
        const resource = new Resource(
          `resource_${resourceType}_${startId + i}`,
          resourceType,
          { x, y: 0, z }
        )
        resources.set(resource.id, resource)
        resource.render(this.scene)
        navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
      }
    }
  }

  /**
   * Spawn scattered resources across map
   */
  private spawnScatteredResource(
    resources: Map<string, Resource>,
    navigationGrid: HybridNavigationGrid,
    resourceType: ResourceType,
    minCount: number,
    maxCount: number,
    startId: number
  ) {
    const count = minCount + Math.floor(Math.random() * (maxCount - minCount + 1))

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * this.mapSize.width * 0.9
      const z = (Math.random() - 0.5) * this.mapSize.height * 0.9

      if (this.isWithinBounds(x, z)) {
        const resource = new Resource(
          `resource_${resourceType}_${startId + i}`,
          resourceType,
          { x, y: 0, z }
        )
        resources.set(resource.id, resource)
        resource.render(this.scene)
        navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
      }
    }
  }

  /**
   * Add circular water obstacle to navigation grid
   */
  private addCircularWaterObstacle(
    navigationGrid: HybridNavigationGrid,
    center: { x: number; z: number },
    radius: number
  ) {
    // Add multiple small circular obstacles to form large water area
    const segments = Math.ceil(radius * 2)
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const x = center.x - radius + (i / segments) * radius * 2
        const z = center.z - radius + (j / segments) * radius * 2

        const dist = Math.sqrt(Math.pow(x - center.x, 2) + Math.pow(z - center.z, 2))
        if (dist <= radius) {
          navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
        }
      }
    }
  }

  /**
   * Check if position is within map bounds
   */
  private isWithinBounds(x: number, z: number): boolean {
    const halfWidth = this.mapSize.width / 2
    const halfHeight = this.mapSize.height / 2
    return (
      x >= -halfWidth &&
      x <= halfWidth &&
      z >= -halfHeight &&
      z <= halfHeight
    )
  }
}
