import { Renderer } from '@/rendering/Renderer'
import { Camera } from '@/rendering/Camera'
import { EntityManager } from './EntityManager'
import { UnitFactory } from '@/game-logic/entities/Unit'

/**
 * Main game engine
 * Manages the game loop and coordinates all systems
 */
export class Engine {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private camera: Camera
  private entityManager: EntityManager
  private running: boolean = false
  private lastTime: number = 0
  private animationFrameId: number = 0

  // FPS tracking
  private fps: number = 0
  private frameCount: number = 0
  private fpsUpdateTime: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.camera = new Camera(canvas)
    this.entityManager = new EntityManager()
    this.renderer = new Renderer(canvas, this.camera, this.entityManager)

    // Set canvas size
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())

    // Setup keyboard controls for camera
    this.setupKeyboardControls()

    // Create test units
    this.createTestUnits()
  }

  /**
   * Resize canvas to fill the container
   */
  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height
    this.camera.updateViewport(rect.width, rect.height)
  }

  /**
   * Setup keyboard controls for camera movement
   */
  private setupKeyboardControls(): void {
    const keys: { [key: string]: boolean } = {}

    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true
    })

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false
    })

    // Camera movement in update loop
    this.camera.setKeyBindings(keys)
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.fpsUpdateTime = this.lastTime
    this.gameLoop(this.lastTime)
  }

  /**
   * Stop the game loop
   */
  stop(): void {
    this.running = false
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }
  }

  /**
   * Main game loop - runs at 60 FPS
   */
  private gameLoop(currentTime: number): void {
    if (!this.running) return

    // Calculate delta time in seconds
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime

    // Update FPS counter
    this.updateFPS(currentTime)

    // Update game systems
    this.update(deltaTime)

    // Render
    this.render()

    // Request next frame
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  /**
   * Update FPS counter
   */
  private updateFPS(currentTime: number): void {
    this.frameCount++
    const elapsed = currentTime - this.fpsUpdateTime

    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed)
      this.frameCount = 0
      this.fpsUpdateTime = currentTime
    }
  }

  /**
   * Update all game systems
   */
  private update(deltaTime: number): void {
    // Update camera
    this.camera.update(deltaTime)

    // TODO: Update other systems (entities, pathfinding, etc.)
  }

  /**
   * Render the game
   */
  private render(): void {
    this.renderer.render(this.fps)
  }

  /**
   * Create test units for demonstration
   */
  private createTestUnits(): void {
    // Create 50 units randomly placed on the map
    const mapCenterX = 50 * 32 // center of 100x100 tile grid
    const mapCenterY = 50 * 32

    UnitFactory.createRandomUnits(
      this.entityManager,
      50,
      mapCenterX,
      mapCenterY,
      500, // radius
      1,
      '#4488ff'
    )

    console.log(`Created ${this.entityManager.getEntityCount()} test units`)
  }

  /**
   * Get entity manager
   */
  getEntityManager(): EntityManager {
    return this.entityManager
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert screen coords to world coords
    const worldPos = this.camera.screenToWorld(x, y)

    // TODO: Handle unit selection, etc.
    console.log('Mouse down at world position:', worldPos)
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // TODO: Handle selection box, etc.
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // TODO: Handle command issuing, etc.
  }
}
