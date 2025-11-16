import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InputHandler } from '@/utils/InputHandler'
import { Unit } from '@/entities/Unit'
import { Building } from '@/entities/Building'
import { Resource } from '@/entities/Resource'
import { Entity } from '@/entities/Entity'
import { GAME_CONFIG, RESOURCE_SPAWN } from '@/config/gameConfig'
import { HybridNavigationGrid } from '@/pathfinding/HybridNavigationGrid'
import type { UnitType, BuildingType, ResourceType, Resources } from '@/types/game'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private minimapCanvas: HTMLCanvasElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private inputHandler: InputHandler
  private animationFrameId: number | null = null
  private isRunning = false
  private lastFrameTime = 0

  // Game entities
  private terrain: THREE.Mesh | null = null
  private units: Map<string, Unit> = new Map()
  private buildings: Map<string, Building> = new Map()
  private resources: Map<string, Resource> = new Map()
  private selectedEntities: Set<Entity> = new Set()

  // Player resources
  private playerResources: Resources = {
    food: 200,
    wood: 200,
    gold: 100,
    stone: 100
  }
  private onResourcesUpdate?: (resources: Resources) => void

  // Pathfinding
  private navigationGrid: HybridNavigationGrid

  // Raycaster for mouse picking
  private raycaster: THREE.Raycaster

  // Selection box visual
  private selectionBox: THREE.Line | null = null

  constructor(canvas: HTMLCanvasElement, minimapCanvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.minimapCanvas = minimapCanvas

    // Initialize Three.js scene
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      GAME_CONFIG.RENDER.CAMERA_FOV,
      window.innerWidth / window.innerHeight,
      GAME_CONFIG.RENDER.CAMERA_NEAR,
      GAME_CONFIG.RENDER.CAMERA_FAR
    )
    this.camera.position.set(20, 30, 20)
    this.camera.lookAt(0, 0, 0)

    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true
    })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // Setup controls
    this.controls = new OrbitControls(this.camera, this.canvas)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2.5
    this.controls.minDistance = 10
    this.controls.maxDistance = 100

    // Setup raycaster
    this.raycaster = new THREE.Raycaster()

    // Setup navigation grid (100x100 map) - uses WASM when available
    this.navigationGrid = new HybridNavigationGrid(100, 1)

    // Setup input handler
    this.inputHandler = new InputHandler(this.canvas)
    this.setupInputHandlers()

    // Initialize scene
    this.initScene()

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  private setupInputHandlers() {
    // Left click - select units/buildings
    this.inputHandler.on('leftclick', (event) => {
      this.handleLeftClick(event.position)
    })

    // Right click - move command
    this.inputHandler.on('rightclick', (event) => {
      this.handleRightClick(event.position)
    })

    // Drag - box selection
    this.inputHandler.on('dragend', (event) => {
      this.handleDragSelect(event.start, event.end)
    })

    // Drag visual feedback
    this.inputHandler.on('drag', (event) => {
      this.updateSelectionBox(event.start, event.current)
    })
  }

  private handleLeftClick(mousePos: THREE.Vector2) {
    this.raycaster.setFromCamera(mousePos, this.camera)
    const allObjects = [
      ...Array.from(this.units.values()).map(u => u.mesh).filter(Boolean) as THREE.Object3D[],
      ...Array.from(this.buildings.values()).map(b => b.mesh).filter(Boolean) as THREE.Object3D[]
    ]

    const intersects = this.raycaster.intersectObjects(allObjects, true)

    if (intersects.length > 0) {
      const clicked = intersects[0].object
      const entityId = clicked.userData.entityId

      // Clear previous selection if not holding shift
      if (!this.inputHandler.isKeyPressed('shift')) {
        this.clearSelection()
      }

      // Select the entity
      const entity = this.units.get(entityId) || this.buildings.get(entityId)
      if (entity) {
        entity.setSelected(true)
        this.selectedEntities.add(entity)
      }
    } else {
      // Clicked on empty space - deselect all
      if (!this.inputHandler.isKeyPressed('shift')) {
        this.clearSelection()
      }
    }
  }

  private handleRightClick(mousePos: THREE.Vector2) {
    if (this.selectedEntities.size === 0) return

    this.raycaster.setFromCamera(mousePos, this.camera)

    // Check if clicked on a resource
    const resourceObjects = Array.from(this.resources.values())
      .map(r => r.mesh)
      .filter(Boolean) as THREE.Object3D[]

    const resourceIntersects = this.raycaster.intersectObjects(resourceObjects, true)

    if (resourceIntersects.length > 0) {
      // Clicked on a resource - start harvesting
      const clicked = resourceIntersects[0].object
      const resourceId = clicked.userData.entityId
      const resource = this.resources.get(resourceId)

      if (resource && resource.isAvailable()) {
        // Find nearest deposit building (town center for now)
        const depositBuilding = Array.from(this.buildings.values()).find(
          b => b.type === 'town_center'
        )

        if (depositBuilding) {
          this.selectedEntities.forEach(entity => {
            if (entity instanceof Unit && entity.type === 'villager') {
              entity.harvestResource(resource, depositBuilding)
            }
          })
        }
      }
      return
    }

    // Check if clicked on terrain
    if (this.terrain) {
      const intersects = this.raycaster.intersectObject(this.terrain)
      if (intersects.length > 0) {
        const point = intersects[0].point

        // Move selected units using pathfinding
        this.selectedEntities.forEach(entity => {
          if (entity instanceof Unit) {
            // Stop harvesting if currently harvesting
            entity.stopHarvesting()

            // Find path from unit's current position to target
            const startPos = { x: entity.position.x, y: 0, z: entity.position.z }
            const goalPos = { x: point.x, y: 0, z: point.z }

            const path = this.navigationGrid.findPath(startPos, goalPos)

            if (path.length > 0) {
              // Use pathfinding
              entity.moveTo(goalPos, path)
            } else {
              // No path found, try direct movement
              entity.moveTo(goalPos)
            }
          }
        })
      }
    }
  }

  private handleDragSelect(start: THREE.Vector2, end: THREE.Vector2) {
    // Clear selection box visual
    this.clearSelectionBox()

    // Calculate selection frustum
    const minX = Math.min(start.x, end.x)
    const maxX = Math.max(start.x, end.x)
    const minY = Math.min(start.y, end.y)
    const maxY = Math.max(start.y, end.y)

    // Clear previous selection
    this.clearSelection()

    // Check each unit
    this.units.forEach(unit => {
      if (!unit.mesh) return

      // Project unit position to screen space
      const pos = unit.mesh.position.clone()
      pos.project(this.camera)

      if (pos.x >= minX && pos.x <= maxX && pos.y >= minY && pos.y <= maxY) {
        unit.setSelected(true)
        this.selectedEntities.add(unit)
      }
    })
  }

  private updateSelectionBox(start: THREE.Vector2, current: THREE.Vector2) {
    // Remove old selection box
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox)
    }

    // Create new selection box (in 2D screen space would be better, but this works)
    const points = [
      new THREE.Vector3(start.x, start.y, 0),
      new THREE.Vector3(current.x, start.y, 0),
      new THREE.Vector3(current.x, current.y, 0),
      new THREE.Vector3(start.x, current.y, 0),
      new THREE.Vector3(start.x, start.y, 0)
    ]

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 0x00ff00 })
    this.selectionBox = new THREE.Line(geometry, material)
    // Note: This creates a box in 3D space at origin, proper implementation would use 2D overlay
  }

  private clearSelectionBox() {
    if (this.selectionBox) {
      this.scene.remove(this.selectionBox)
      this.selectionBox = null
    }
  }

  private clearSelection() {
    this.selectedEntities.forEach(entity => entity.setSelected(false))
    this.selectedEntities.clear()
  }

  private initScene() {
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(50, 50, 50)
    directionalLight.castShadow = true
    directionalLight.shadow.camera.left = -50
    directionalLight.shadow.camera.right = 50
    directionalLight.shadow.camera.top = 50
    directionalLight.shadow.camera.bottom = -50
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)

    // Create terrain
    const terrainGeometry = new THREE.PlaneGeometry(100, 100, 50, 50)
    const terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x3a7d3a,
      roughness: 0.8,
      metalness: 0.2
    })
    this.terrain = new THREE.Mesh(terrainGeometry, terrainMaterial)
    this.terrain.rotation.x = -Math.PI / 2
    this.terrain.receiveShadow = true
    this.scene.add(this.terrain)

    // Add some test units (villagers for harvesting)
    this.createUnit('unit1', 'villager' as UnitType, { x: 0, y: 0, z: 0 }, 'player1', '#FF0000')
    this.createUnit('unit2', 'villager' as UnitType, { x: 2, y: 0, z: 0 }, 'player1', '#FF0000')
    this.createUnit('unit3', 'villager' as UnitType, { x: -2, y: 0, z: 0 }, 'player1', '#FF0000')

    // Add Town Center for resource deposit
    this.createBuilding('town_center_1', 'town_center' as BuildingType, { x: 0, y: 0, z: -5 }, 'player1', '#FF0000')

    // Spawn resources procedurally
    this.spawnResources()

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222)
    this.scene.add(gridHelper)
  }

  private addTestObstacles() {
    // Create visual obstacles and add them to navigation grid
    const obstacleData = [
      { x: 5, z: 0, width: 2, height: 8 },   // Vertical wall
      { x: -5, z: -5, width: 6, height: 2 }, // Horizontal wall
      { x: 15, z: 5, width: 3, height: 3 },  // Square obstacle
    ]

    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1
    })

    obstacleData.forEach((obs, index) => {
      // Create visual obstacle
      const geometry = new THREE.BoxGeometry(obs.width, 2, obs.height)
      const mesh = new THREE.Mesh(geometry, obstacleMaterial)
      mesh.position.set(obs.x + obs.width / 2, 1, obs.z + obs.height / 2)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.name = `obstacle_${index}`
      this.scene.add(mesh)

      // Add to navigation grid
      this.navigationGrid.addRectObstacle(
        { x: obs.x, y: 0, z: obs.z },
        obs.width,
        obs.height
      )
    })
  }

  /**
   * Spawn resources procedurally across the map
   */
  private spawnResources() {
    const mapSize = 100 // 100x100 map
    const mapMin = -mapSize / 2
    const mapMax = mapSize / 2
    let resourceId = 0

    // Helper function to spawn resource clusters
    const spawnCluster = (
      resourceType: ResourceType,
      clusterConfig: typeof RESOURCE_SPAWN.TREE
    ) => {
      const numClusters = Math.floor(
        Math.random() * (clusterConfig.maxClusters - clusterConfig.minClusters + 1) +
        clusterConfig.minClusters
      )

      for (let c = 0; c < numClusters; c++) {
        // Random cluster center (avoid center of map for player spawn)
        const clusterX = Math.random() * (mapMax - mapMin) + mapMin
        const clusterZ = Math.random() * (mapMax - mapMin) + mapMin

        // Skip if too close to center (player spawn area)
        if (Math.abs(clusterX) < 15 && Math.abs(clusterZ) < 15) {
          continue
        }

        const numResources = Math.floor(
          Math.random() * (clusterConfig.maxPerCluster - clusterConfig.minPerCluster + 1) +
          clusterConfig.minPerCluster
        )

        for (let r = 0; r < numResources; r++) {
          // Random position within cluster radius
          const angle = Math.random() * Math.PI * 2
          const distance = Math.random() * clusterConfig.clusterRadius
          const x = clusterX + Math.cos(angle) * distance
          const z = clusterZ + Math.sin(angle) * distance

          // Check bounds
          if (x < mapMin || x > mapMax || z < mapMin || z > mapMax) {
            continue
          }

          // Create resource
          const resource = new Resource(
            `resource_${resourceType}_${resourceId++}`,
            resourceType,
            { x, y: 0, z }
          )

          this.resources.set(resource.id, resource)
          resource.render(this.scene)

          // Add as obstacle to pathfinding
          this.navigationGrid.addCircularObstacle({ x, y: 0, z }, 1)
        }
      }
    }

    // Spawn all resource types
    spawnCluster('tree' as ResourceType, RESOURCE_SPAWN.TREE)
    spawnCluster('gold_mine' as ResourceType, RESOURCE_SPAWN.GOLD_MINE)
    spawnCluster('stone_mine' as ResourceType, RESOURCE_SPAWN.STONE_MINE)
    spawnCluster('berry_bush' as ResourceType, RESOURCE_SPAWN.BERRY_BUSH)
    spawnCluster('deer' as ResourceType, RESOURCE_SPAWN.DEER)

    console.log(`✅ Spawned ${this.resources.size} resources on the map`)
  }

  public createUnit(id: string, type: UnitType, position: {x: number, y: number, z: number}, ownerId: string, color: string) {
    const unit = new Unit(id, type, position, ownerId, color)
    this.units.set(id, unit)
    unit.render(this.scene)
    return unit
  }

  public createBuilding(id: string, type: BuildingType, position: {x: number, y: number, z: number}, ownerId: string, color: string) {
    const building = new Building(id, type, position, ownerId, color)
    this.buildings.set(id, building)
    building.render(this.scene)
    building.completeBuild() // Auto-complete for now
    return building
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private animate(timestamp: number = 0) {
    if (!this.isRunning) return

    this.animationFrameId = requestAnimationFrame(this.animate.bind(this))

    // Calculate delta time
    const deltaTime = this.lastFrameTime > 0 ? (timestamp - this.lastFrameTime) / 1000 : 0
    this.lastFrameTime = timestamp

    // Update all entities
    this.units.forEach(unit => {
      unit.update(deltaTime)

      // Check if unit should deposit resources
      if (unit.state === 'depositing' && unit.targetDepositBuilding) {
        const deposited = unit.depositResources()
        if (deposited) {
          this.addPlayerResources(deposited.type, deposited.amount)
        }
      }
    })
    this.buildings.forEach(building => building.update(deltaTime))
    this.resources.forEach(resource => resource.update(deltaTime))

    // Update controls
    this.controls.update()

    // Render scene
    this.renderer.render(this.scene, this.camera)

    // Update minimap
    this.updateMinimap()
  }

  private updateMinimap() {
    const ctx = this.minimapCanvas.getContext('2d')
    if (!ctx) return

    // Clear minimap
    ctx.fillStyle = '#2a2a2a'
    ctx.fillRect(0, 0, 200, 200)

    // Draw terrain bounds
    ctx.strokeStyle = '#4a4a4a'
    ctx.strokeRect(10, 10, 180, 180)

    // Draw resources
    this.resources.forEach(resource => {
      const x = ((resource.position.x + 50) / 100) * 180 + 10
      const z = ((resource.position.z + 50) / 100) * 180 + 10

      // Color based on resource type
      switch (resource.type) {
        case 'tree':
          ctx.fillStyle = '#228b22'
          break
        case 'gold_mine':
          ctx.fillStyle = '#ffd700'
          break
        case 'stone_mine':
          ctx.fillStyle = '#808080'
          break
        case 'berry_bush':
          ctx.fillStyle = '#9370db'
          break
        case 'deer':
          ctx.fillStyle = '#d2691e'
          break
        default:
          ctx.fillStyle = '#ffffff'
      }

      ctx.fillRect(x - 1, z - 1, 2, 2)
    })

    // Draw buildings
    ctx.fillStyle = '#8b4513'
    this.buildings.forEach(building => {
      const x = ((building.position.x + 50) / 100) * 180 + 10
      const z = ((building.position.z + 50) / 100) * 180 + 10
      ctx.fillRect(x - 2, z - 2, 4, 4)
    })

    // Draw units as dots
    ctx.fillStyle = '#ff0000'
    this.units.forEach(unit => {
      const x = ((unit.position.x + 50) / 100) * 180 + 10
      const z = ((unit.position.z + 50) / 100) * 180 + 10
      ctx.beginPath()
      ctx.arc(x, z, 2, 0, Math.PI * 2)
      ctx.fill()
    })

    // Draw camera position
    const camX = ((this.camera.position.x + 50) / 100) * 180 + 10
    const camZ = ((this.camera.position.z + 50) / 100) * 180 + 10
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(camX, camZ, 8, 0, Math.PI * 2)
    ctx.stroke()
  }

  /**
   * Add resources to player
   */
  private addPlayerResources(resourceType: ResourceType, amount: number) {
    switch (resourceType) {
      case 'tree':
        this.playerResources.wood += amount
        break
      case 'gold_mine':
        this.playerResources.gold += amount
        break
      case 'stone_mine':
        this.playerResources.stone += amount
        break
      case 'berry_bush':
      case 'deer':
      case 'fish':
        this.playerResources.food += amount
        break
    }

    // Trigger callback if set
    if (this.onResourcesUpdate) {
      this.onResourcesUpdate(this.playerResources)
    }

    console.log(`📦 +${amount} ${resourceType} | Resources:`, {
      food: Math.floor(this.playerResources.food),
      wood: Math.floor(this.playerResources.wood),
      gold: Math.floor(this.playerResources.gold),
      stone: Math.floor(this.playerResources.stone)
    })
  }

  /**
   * Get player resources
   */
  public getPlayerResources(): Resources {
    return { ...this.playerResources }
  }

  /**
   * Set callback for resource updates
   */
  public setOnResourcesUpdate(callback: (resources: Resources) => void) {
    this.onResourcesUpdate = callback
  }

  public getSelectedEntities(): Entity[] {
    return Array.from(this.selectedEntities)
  }

  public start() {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  public stop() {
    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  public dispose() {
    this.stop()

    // Dispose all entities
    this.units.forEach(unit => unit.dispose())
    this.buildings.forEach(building => building.dispose())
    this.resources.forEach(resource => resource.dispose())
    this.units.clear()
    this.buildings.clear()
    this.resources.clear()
    this.selectedEntities.clear()

    // Dispose input handler
    this.inputHandler.dispose()

    // Clean up Three.js resources
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
  }
}
