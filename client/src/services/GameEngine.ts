import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { InputHandler } from '@/utils/InputHandler'
import { Unit } from '@/entities/Unit'
import { Building } from '@/entities/Building'
import { Entity } from '@/entities/Entity'
import { GAME_CONFIG } from '@/config/gameConfig'
import type { UnitType, BuildingType } from '@/types/game'

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
  private selectedEntities: Set<Entity> = new Set()

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

    // Check if clicked on terrain
    if (this.terrain) {
      const intersects = this.raycaster.intersectObject(this.terrain)
      if (intersects.length > 0) {
        const point = intersects[0].point

        // Move selected units
        this.selectedEntities.forEach(entity => {
          if (entity instanceof Unit) {
            entity.moveTo({ x: point.x, y: point.y, z: point.z })
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

    // Add some test units
    this.createUnit('unit1', 'villager' as UnitType, { x: 0, y: 0, z: 0 }, 'player1', '#FF0000')
    this.createUnit('unit2', 'militia' as UnitType, { x: 5, y: 0, z: 5 }, 'player1', '#FF0000')
    this.createUnit('unit3', 'archer' as UnitType, { x: -5, y: 0, z: -5 }, 'player1', '#FF0000')

    // Add a test building
    this.createBuilding('building1', 'house' as BuildingType, { x: 10, y: 0, z: 0 }, 'player1', '#FF0000')

    // Add grid helper
    const gridHelper = new THREE.GridHelper(100, 50, 0x444444, 0x222222)
    this.scene.add(gridHelper)
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
    this.units.forEach(unit => unit.update(deltaTime))
    this.buildings.forEach(building => building.update(deltaTime))

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
    this.units.clear()
    this.buildings.clear()
    this.selectedEntities.clear()

    // Dispose input handler
    this.inputHandler.dispose()

    // Clean up Three.js resources
    window.removeEventListener('resize', this.onWindowResize.bind(this))
    this.controls.dispose()
    this.renderer.dispose()
  }
}
