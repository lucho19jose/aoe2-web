import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InputHandler } from '@/utils/InputHandler'
import { Unit } from '@/entities/Unit'
import { Building } from '@/entities/Building'
import { Resource } from '@/entities/Resource'
import { Entity } from '@/entities/Entity'
import { GAME_CONFIG, RESOURCE_SPAWN, UNIT_TYPES } from '@/config/gameConfig'
import { HybridNavigationGrid } from '@/pathfinding/HybridNavigationGrid'
import { Formation, FormationType } from '@/utils/Formation'
import type { UnitType, BuildingType, ResourceType, Resources } from '@/types/game'
import init, { AIManager, AIDifficulty } from '@/wasm/game_engine'
import { WebSocketService } from './WebSocketService'
import type { WebSocketMessage } from './WebSocketService'
import { getSoundService, SoundType } from './SoundService'
import { TECHNOLOGIES } from '@/config/technologies'
import type { Technology } from '@/config/technologies'

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

  // AI Manager
  private aiManager: AIManager | null = null
  private wasmInitialized = false

  // Player ID
  private playerId: string = 'player1'

  // Raycaster for mouse picking
  private raycaster: THREE.Raycaster

  // Selection box visual
  private selectionBox: THREE.Line | null = null

  // Formation
  private currentFormation: FormationType = FormationType.Box

  // WebSocket for multiplayer
  private webSocket: WebSocketService | null = null
  private isMultiplayer: boolean = false
  private gameId: string | null = null

  // Sound service
  private soundService = getSoundService()

  // Research system
  private researchedTechnologies: Set<string> = new Set()

  constructor(canvas: HTMLCanvasElement, minimapCanvas: HTMLCanvasElement, gameId?: string) {
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

    // Initialize WASM and AI
    this.initWasmAndAI()

    // Initialize multiplayer if gameId provided
    if (gameId) {
      this.gameId = gameId
      this.isMultiplayer = true
      this.initMultiplayer()
    }

    // Handle window resize
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }

  /**
   * Initialize WASM module and AI Manager
   */
  private async initWasmAndAI() {
    try {
      await init()
      this.wasmInitialized = true

      // Create AI Manager
      this.aiManager = new AIManager()

      console.log('✅ WASM and AI Manager initialized')
    } catch (error) {
      console.error('❌ Failed to initialize WASM/AI:', error)
    }
  }

  /**
   * Add an AI player to the game
   */
  public addAIPlayer(playerId: string, difficulty: AIDifficulty) {
    if (!this.aiManager) {
      console.warn('AI Manager not initialized yet')
      return
    }

    this.aiManager.add_ai_player(playerId, difficulty)
    console.log(`🤖 Added AI player ${playerId} with difficulty ${difficulty}`)
  }

  /**
   * Initialize multiplayer WebSocket connection
   */
  private async initMultiplayer() {
    if (!this.gameId) return

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsHost = import.meta.env.VITE_WS_HOST || window.location.host
    const wsUrl = `${wsProtocol}//${wsHost}/ws/game/${this.gameId}/`

    this.webSocket = new WebSocketService(wsUrl)

    try {
      await this.webSocket.connect()
      console.log('✅ Multiplayer WebSocket connected')

      // Setup event handlers
      this.setupMultiplayerHandlers()
    } catch (error) {
      console.error('❌ Failed to connect to multiplayer server:', error)
      this.isMultiplayer = false
    }
  }

  /**
   * Setup WebSocket event handlers for multiplayer
   */
  private setupMultiplayerHandlers() {
    if (!this.webSocket) return

    // Handle unit movement from other players
    this.webSocket.on('unit_move', (message: WebSocketMessage) => {
      const { unitId, position, path } = message.data
      const unit = this.units.get(unitId)
      if (unit && unit.ownerId !== this.playerId) {
        unit.moveTo(position, path || [])
      }
    })

    // Handle unit training
    this.webSocket.on('unit_train', (message: WebSocketMessage) => {
      const { buildingId, unitType } = message.data
      const building = this.buildings.get(buildingId)
      if (building && building.ownerId !== this.playerId) {
        building.trainUnit(unitType as UnitType)
      }
    })

    // Handle unit attacks
    this.webSocket.on('unit_attack', (message: WebSocketMessage) => {
      const { unitId, targetId } = message.data
      const unit = this.units.get(unitId)
      const target = this.units.get(targetId) || this.buildings.get(targetId)
      if (unit && target && unit.ownerId !== this.playerId) {
        unit.attackTarget(target)
      }
    })

    // Handle building construction
    this.webSocket.on('building_build', (message: WebSocketMessage) => {
      const { buildingId, buildingType, position, ownerId, color } = message.data
      if (ownerId !== this.playerId) {
        this.createBuilding(buildingId, buildingType as BuildingType, position, ownerId, color)
      }
    })

    // Handle formation changes
    this.webSocket.on('formation_change', (message: WebSocketMessage) => {
      const { formation, playerId } = message.data
      if (playerId !== this.playerId) {
        console.log(`🌐 Player ${playerId} changed formation to ${formation}`)
      }
    })

    // Handle game state sync
    this.webSocket.on('game_state_sync', (message: WebSocketMessage) => {
      console.log('🌐 Received game state sync:', message.data)
      // TODO: Sync game state with server
    })

    console.log('✅ Multiplayer handlers setup complete')
  }

  /**
   * Send unit move command to multiplayer server
   */
  private sendMultiplayerUnitMove(unitId: string, position: any, path: any[]) {
    if (!this.isMultiplayer || !this.webSocket) return

    this.webSocket.send({
      type: 'unit_move',
      data: {
        unitId,
        position,
        path,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Send unit train command to multiplayer server
   */
  private sendMultiplayerUnitTrain(buildingId: string, unitType: UnitType) {
    if (!this.isMultiplayer || !this.webSocket) return

    this.webSocket.send({
      type: 'unit_train',
      data: {
        buildingId,
        unitType,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Send unit attack command to multiplayer server
   */
  private sendMultiplayerUnitAttack(unitId: string, targetId: string) {
    if (!this.isMultiplayer || !this.webSocket) return

    this.webSocket.send({
      type: 'unit_attack',
      data: {
        unitId,
        targetId,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Send formation change to multiplayer server
   */
  private sendMultiplayerFormationChange(formation: FormationType) {
    if (!this.isMultiplayer || !this.webSocket) return

    this.webSocket.send({
      type: 'formation_change',
      data: {
        formation,
        playerId: this.playerId,
        timestamp: Date.now()
      }
    })
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

        // Play selection sound
        this.soundService.play(SoundType.SELECT)
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

    // Check if clicked on an enemy unit or building (attack command)
    const allObjects = [
      ...Array.from(this.units.values()).map(u => u.mesh).filter(Boolean) as THREE.Object3D[],
      ...Array.from(this.buildings.values()).map(b => b.mesh).filter(Boolean) as THREE.Object3D[]
    ]

    const entityIntersects = this.raycaster.intersectObjects(allObjects, true)

    if (entityIntersects.length > 0) {
      const clicked = entityIntersects[0].object
      const entityId = clicked.userData.entityId
      const targetUnit = this.units.get(entityId)
      const targetBuilding = this.buildings.get(entityId)

      // Check if target is an enemy
      const isEnemy = (targetUnit && targetUnit.ownerId !== this.playerId) ||
                      (targetBuilding && targetBuilding.ownerId !== this.playerId)

      if (isEnemy) {
        // Attack command
        this.selectedEntities.forEach(entity => {
          if (entity instanceof Unit) {
            entity.stopHarvesting()
            const target = targetUnit || targetBuilding
            if (target) {
              entity.attackTarget(target)
            }
          }
        })
        return
      }
    }

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

    // Check if clicked on terrain - move command
    if (this.terrain) {
      const intersects = this.raycaster.intersectObject(this.terrain)
      if (intersects.length > 0) {
        const point = intersects[0].point

        // Get selected units
        const selectedUnits = Array.from(this.selectedEntities).filter(e => e instanceof Unit) as Unit[]

        if (selectedUnits.length === 0) return

        if (selectedUnits.length === 1) {
          // Single unit - direct movement
          const unit = selectedUnits[0]
          unit.stopHarvesting()

          const startPos = { x: unit.position.x, y: 0, z: unit.position.z }
          const goalPos = { x: point.x, y: 0, z: point.z }

          const path = this.navigationGrid.findPath(startPos, goalPos)

          if (path.length > 0) {
            unit.moveTo(goalPos, path)
          } else {
            unit.moveTo(goalPos)
          }
        } else {
          // Multiple units - use formation
          const spacing = Formation.getDefaultSpacing(this.currentFormation)
          const centerPos = { x: point.x, y: 0, z: point.z }

          // Calculate facing direction (average from units to target)
          const avgUnitPos = selectedUnits.reduce((acc, unit) => ({
            x: acc.x + unit.position.x,
            z: acc.z + unit.position.z
          }), { x: 0, z: 0 })

          avgUnitPos.x /= selectedUnits.length
          avgUnitPos.z /= selectedUnits.length

          const facing = Formation.calculateFacing(
            { x: avgUnitPos.x, y: 0, z: avgUnitPos.z },
            centerPos
          )

          // Get formation positions
          const formationPositions = Formation.calculatePositions(
            centerPos,
            this.currentFormation,
            selectedUnits.length,
            spacing,
            facing
          )

          // Assign each unit to a formation position
          selectedUnits.forEach((unit, index) => {
            unit.stopHarvesting()

            const targetPos = formationPositions[index]
            const startPos = { x: unit.position.x, y: 0, z: unit.position.z }

            const path = this.navigationGrid.findPath(startPos, targetPos)

            if (path.length > 0) {
              unit.moveTo(targetPos, path)
            } else {
              unit.moveTo(targetPos)
            }
          })

          console.log(`📐 Moving ${selectedUnits.length} units in ${this.currentFormation} formation`)
        }
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

  /**
   * Spawn a unit from a building's production
   */
  private spawnUnitFromBuilding(building: Building, unitType: UnitType) {
    // Generate unique unit ID
    const unitId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Calculate spawn position (near building)
    const spawnOffset = building.size.width + 1
    const angle = Math.random() * Math.PI * 2
    const spawnPosition = {
      x: building.position.x + Math.cos(angle) * spawnOffset,
      y: 0,
      z: building.position.z + Math.sin(angle) * spawnOffset
    }

    // Get building owner color
    const ownerColor = this.getPlayerColor(building.ownerId)

    // Create the unit
    const unit = this.createUnit(unitId, unitType, spawnPosition, building.ownerId, ownerColor)

    console.log(`🎖️ Spawned ${unitType} from ${building.name} at position (${spawnPosition.x.toFixed(1)}, ${spawnPosition.z.toFixed(1)})`)

    // Play unit trained sound
    this.soundService.play(SoundType.UNIT_TRAINED)

    return unit
  }

  /**
   * Train a unit in a building
   */
  public trainUnit(buildingId: string, unitType: UnitType): boolean {
    const building = this.buildings.get(buildingId)
    if (!building) {
      console.error(`Building ${buildingId} not found`)
      return false
    }

    // Check and deduct resources
    const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
    if (!unitConfig || !unitConfig.cost) {
      console.error(`Unit ${unitType} has no cost configuration`)
      return false
    }

    // Check if player has enough resources
    const cost = unitConfig.cost
    for (const [resource, amount] of Object.entries(cost)) {
      const resourceKey = resource as keyof Resources
      if (this.playerResources[resourceKey] < amount) {
        console.warn(`Not enough ${resource}: need ${amount}, have ${this.playerResources[resourceKey]}`)
        return false
      }
    }

    // Attempt to train
    const success = building.trainUnit(unitType)

    if (success) {
      // Deduct resources
      for (const [resource, amount] of Object.entries(cost)) {
        const resourceKey = resource as keyof Resources
        this.playerResources[resourceKey] -= amount
      }

      // Notify resource update
      if (this.onResourcesUpdate) {
        this.onResourcesUpdate(this.playerResources)
      }

      // Send to multiplayer server
      this.sendMultiplayerUnitTrain(buildingId, unitType)
    }

    return success
  }

  /**
   * Research a technology in a building
   */
  public researchTechnology(buildingId: string, techId: string): boolean {
    const building = this.buildings.get(buildingId)
    if (!building) {
      console.error(`Building ${buildingId} not found`)
      return false
    }

    // Check if already researched
    if (this.researchedTechnologies.has(techId)) {
      console.warn(`Technology ${techId} already researched`)
      return false
    }

    // Get technology config
    const tech = TECHNOLOGIES[techId.toUpperCase()]
    if (!tech) {
      console.error(`Technology ${techId} not found`)
      return false
    }

    // Check if player has enough resources
    const cost = tech.cost
    for (const [resource, amount] of Object.entries(cost)) {
      if (!amount) continue
      const resourceKey = resource as keyof Resources
      if (this.playerResources[resourceKey] < amount) {
        console.warn(`Not enough ${resource}: need ${amount}, have ${this.playerResources[resourceKey]}`)
        return false
      }
    }

    // Check prerequisites
    if (tech.requires) {
      for (const reqTechId of tech.requires) {
        if (!this.researchedTechnologies.has(reqTechId)) {
          console.warn(`Missing prerequisite technology: ${reqTechId}`)
          return false
        }
      }
    }

    // Attempt to research
    const success = building.researchTechnology(techId, tech.name, tech.researchTime)

    if (success) {
      // Deduct resources
      for (const [resource, amount] of Object.entries(cost)) {
        if (!amount) continue
        const resourceKey = resource as keyof Resources
        this.playerResources[resourceKey] -= amount
      }

      // Notify resource update
      if (this.onResourcesUpdate) {
        this.onResourcesUpdate(this.playerResources)
      }

      // Send to multiplayer server
      this.sendMultiplayerResearch(buildingId, techId)
    }

    return success
  }

  /**
   * Apply technology effects
   */
  private applyTechnologyEffects(techId: string) {
    const tech = TECHNOLOGIES[techId.toUpperCase()]
    if (!tech) return

    console.log(`🔬 Applying effects for ${tech.name}`)

    // Apply effects based on technology
    for (const effect of tech.effects) {
      switch (effect.type) {
        case 'unit_stat':
          // In a real implementation, you would update unit stats
          // For now, just log it
          console.log(`  • ${effect.target} ${effect.stat} +${effect.value}`)
          break
        case 'resource_rate':
          console.log(`  • ${effect.stat} rate ${effect.value}x`)
          break
        case 'unlock':
          console.log(`  • Unlocked: ${effect.value}`)
          break
      }
    }

    // Play research complete sound
    this.soundService.play(SoundType.RESEARCH_COMPLETE)
  }

  /**
   * Send research command to multiplayer server
   */
  private sendMultiplayerResearch(buildingId: string, techId: string) {
    if (!this.isMultiplayer || !this.webSocket) return

    this.webSocket.send({
      type: 'research_tech',
      data: {
        buildingId,
        techId,
        timestamp: Date.now()
      }
    })
  }

  /**
   * Get player color by player ID
   */
  private getPlayerColor(playerId: string): string {
    // Simple color mapping - can be improved
    if (playerId === this.playerId) {
      return '#0000FF' // Blue for player
    }
    return '#FF0000' // Red for AI/enemies
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

    // Update AI players
    if (this.wasmInitialized && this.aiManager) {
      this.updateAI(deltaTime)
    }

    // Update all entities
    const deadUnits: string[] = []
    const allUnits = Array.from(this.units.values())
    const allBuildings = Array.from(this.buildings.values())

    this.units.forEach(unit => {
      unit.update(deltaTime)

      // Check if unit should deposit resources
      if (unit.state === 'depositing' && unit.targetDepositBuilding) {
        const deposited = unit.depositResources()
        if (deposited) {
          this.addPlayerResources(deposited.type, deposited.amount)
        }
      }

      // Auto-attack nearby enemies (aggressive stance)
      unit.findAndAttackNearbyEnemy(allUnits, allBuildings)

      // Handle defensive stance (counter-attack)
      unit.handleDefensiveStance()

      // Mark dead units for removal
      if (unit.hp <= 0) {
        deadUnits.push(unit.id)
      }
    })

    // Remove dead units
    deadUnits.forEach(unitId => {
      const unit = this.units.get(unitId)
      if (unit) {
        // Play death sound
        this.soundService.play(SoundType.UNIT_DIE)

        unit.dispose()
        this.units.delete(unitId)
        console.log(`💀 Removed dead unit ${unitId}`)
      }
    })

    // Update buildings and check for completed units and research
    this.buildings.forEach(building => {
      building.update(deltaTime)

      // Check if a unit was completed
      const completedUnit = building.getCompletedUnit()
      if (completedUnit) {
        // Spawn the unit near the building
        this.spawnUnitFromBuilding(building, completedUnit)
      }

      // Check if research was completed
      const completedTech = building.getCompletedResearch()
      if (completedTech) {
        this.researchedTechnologies.add(completedTech)
        this.applyTechnologyEffects(completedTech)
        console.log(`✅ Technology ${completedTech} researched!`)
      }
    })

    this.resources.forEach(resource => resource.update(deltaTime))

    // Update controls
    this.controls.update()

    // Render scene
    this.renderer.render(this.scene, this.camera)

    // Update minimap
    this.updateMinimap()
  }

  /**
   * Build game state for AI
   */
  private buildGameState() {
    // Build units state
    const units: Record<string, any> = {}
    this.units.forEach((unit, id) => {
      units[id] = {
        id: unit.id,
        unit_type: unit.type,
        owner_id: unit.ownerId,
        position: { x: Math.floor(unit.position.x), z: Math.floor(unit.position.z) },
        state: unit.state,
        hp: unit.hp,
        carrying_resource: unit.currentResource || null
      }
    })

    // Build buildings state
    const buildings: Record<string, any> = {}
    this.buildings.forEach((building, id) => {
      buildings[id] = {
        id: building.id,
        building_type: building.type,
        owner_id: building.ownerId,
        position: { x: Math.floor(building.position.x), z: Math.floor(building.position.z) },
        hp: building.hp,
        is_complete: building.isComplete
      }
    })

    // Build resources state
    const resources: Record<string, any> = {}
    this.resources.forEach((resource, id) => {
      resources[id] = {
        id: resource.id,
        resource_type: resource.type,
        position: { x: Math.floor(resource.position.x), z: Math.floor(resource.position.z) },
        amount: resource.amount
      }
    })

    // Get AI player resources (for now we'll use the same as human player - in future track per player)
    const aiResources = {
      food: this.playerResources.food,
      wood: this.playerResources.wood,
      gold: this.playerResources.gold,
      stone: this.playerResources.stone
    }

    // Calculate population
    const unitCount = Array.from(this.units.values()).filter(u => u.ownerId === this.playerId).length
    const populationMax = 200 // TODO: calculate from houses

    return {
      units,
      buildings,
      resources,
      player_resources: aiResources,
      population: {
        current: unitCount,
        max: populationMax
      }
    }
  }

  /**
   * Update AI players
   */
  private updateAI(deltaTime: number) {
    if (!this.aiManager) return

    try {
      // Build game state
      const gameState = this.buildGameState()

      // Get AI actions
      const actionsJson = this.aiManager.update_all(deltaTime, gameState)
      const allActions = JSON.parse(actionsJson)

      // Process actions from all AI players
      allActions.forEach((actions: any[]) => {
        actions.forEach((action: any) => {
          this.processAIAction(action)
        })
      })
    } catch (error) {
      console.error('Error updating AI:', error)
    }
  }

  /**
   * Process a single AI action
   */
  private processAIAction(action: any) {
    // Implementation for each action type
    switch (true) {
      case 'MoveUnit' in action: {
        const { unit_id, target } = action.MoveUnit
        const unit = this.units.get(unit_id)
        if (unit) {
          unit.moveTo({ x: target.x, y: 0, z: target.z }, [])
          console.log(`🤖 AI: Moving unit ${unit_id} to (${target.x}, ${target.z})`)
        }
        break
      }

      case 'TrainUnit' in action: {
        const { building_id, unit_type } = action.TrainUnit
        const building = this.buildings.get(building_id)
        if (building) {
          // Create new unit near building
          const unitId = `ai_unit_${Date.now()}`
          const pos = {
            x: building.position.x + 5,
            y: 0,
            z: building.position.z + 5
          }
          this.createUnit(unitId, unit_type as UnitType, pos, building.ownerId, building.color)
          console.log(`🤖 AI: Training ${unit_type} at ${building_id}`)
        }
        break
      }

      case 'BuildStructure' in action: {
        const { builder_id, building_type, position } = action.BuildStructure
        const builder = this.units.get(builder_id)
        if (builder) {
          const buildingId = `ai_building_${Date.now()}`
          const pos = { x: position.x, y: 0, z: position.z }
          this.createBuilding(buildingId, building_type as BuildingType, pos, builder.ownerId, builder.color)
          console.log(`🤖 AI: Building ${building_type} at (${position.x}, ${position.z})`)
        }
        break
      }

      case 'GatherResource' in action: {
        const { unit_id, resource_id } = action.GatherResource
        const unit = this.units.get(unit_id)
        const resource = this.resources.get(resource_id)
        if (unit && resource) {
          unit.harvestResource(resource)
          console.log(`🤖 AI: Unit ${unit_id} gathering ${resource_id}`)
        }
        break
      }

      case 'Attack' in action: {
        const { unit_id, target_id } = action.Attack
        const unit = this.units.get(unit_id)
        const target = this.units.get(target_id) || this.buildings.get(target_id)
        if (unit && target) {
          unit.attackTarget(target)
          console.log(`🤖 AI: Unit ${unit_id} attacking ${target_id}`)
        }
        break
      }

      case 'Research' in action: {
        const { building_id, tech_id } = action.Research
        console.log(`🤖 AI: Researching ${tech_id} at ${building_id}`)
        // TODO: Implement research
        break
      }

      case 'Idle' in action:
        // Do nothing
        break

      default:
        console.warn('Unknown AI action type:', action)
    }
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

  /**
   * Set formation type for moving multiple units
   */
  public setFormation(formation: FormationType) {
    this.currentFormation = formation
    console.log(`📐 Formation changed to ${formation}`)

    // Send to multiplayer server
    this.sendMultiplayerFormationChange(formation)
  }

  /**
   * Get current formation type
   */
  public getFormation(): FormationType {
    return this.currentFormation
  }

  /**
   * Get researched technologies
   */
  public getResearchedTechnologies(): Set<string> {
    return new Set(this.researchedTechnologies)
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

    // Disconnect WebSocket
    if (this.webSocket) {
      this.webSocket.disconnect()
      this.webSocket = null
    }

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
