import { Camera } from '../rendering/Camera'
import { Renderer } from '../rendering/Renderer'

/**
 * Main game engine - manages the game loop and coordinates all systems
 */
export class Engine {
  private canvas: HTMLCanvasElement
  private camera: Camera
  private renderer: Renderer

  private lastFrameTime: number = 0
  private fps: number = 60
  private frameCount: number = 0
  private fpsUpdateTime: number = 0

  private isRunning: boolean = false
  private animationFrameId: number | null = null

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.camera = new Camera()
    this.renderer = new Renderer(canvas, this.camera)
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastFrameTime = performance.now()
    this.fpsUpdateTime = this.lastFrameTime
    this.gameLoop(this.lastFrameTime)

    console.log('Game engine started')
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.isRunning) return

    this.isRunning = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    console.log('Game engine stopped')
  }

  /**
   * Main game loop - runs at 60 FPS
   */
  private gameLoop(currentTime: number): void {
    if (!this.isRunning) return

    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))

    // Calculate delta time
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // Update FPS counter
    this.updateFPS(currentTime)

    // Update game state
    this.update(deltaTime)

    // Render
    this.render()
  }

  /**
   * Calculate FPS (updated every second)
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
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update camera
    this.camera.update()

    // TODO: Update other game systems here
    // - Entity system
    // - Movement system
    // - Combat system
    // - etc.
  }

  /**
   * Render the game
   */
  private render(): void {
    this.renderer.render(this.fps)
  }

  /**
   * Get the camera instance (for external access)
   */
  public getCamera(): Camera {
    return this.camera
  }

  /**
   * Get the renderer instance (for external access)
   */
  public getRenderer(): Renderer {
    return this.renderer
  }
}
