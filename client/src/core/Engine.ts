import { Renderer } from '../rendering/Renderer'

/**
 * Main game engine
 * Manages the game loop, updates, and rendering
 */
export class Engine {
  private renderer: Renderer
  private running: boolean = false
  private lastFrameTime: number = 0
  private animationFrameId: number | null = null

  // Target 60 FPS
  private readonly TARGET_FPS = 60
  private readonly FRAME_DURATION = 1000 / this.TARGET_FPS

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas)
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) return

    console.log('🎮 Game engine started')
    this.running = true
    this.lastFrameTime = performance.now()
    this.gameLoop(this.lastFrameTime)
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    if (!this.running) return

    console.log('🛑 Game engine stopped')
    this.running = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Main game loop using requestAnimationFrame
   */
  private gameLoop(currentTime: number): void {
    if (!this.running) return

    // Calculate delta time in milliseconds
    const deltaTime = currentTime - this.lastFrameTime
    this.lastFrameTime = currentTime

    // Update game state
    this.update(deltaTime)

    // Render the frame
    this.render()

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time))
  }

  /**
   * Update game state
   */
  private update(deltaTime: number): void {
    // Update renderer/camera
    this.renderer.update(deltaTime)

    // TODO: Update game systems (movement, combat, etc.)
  }

  /**
   * Render the current frame
   */
  private render(): void {
    this.renderer.render()
  }

  /**
   * Get the renderer instance
   */
  public getRenderer(): Renderer {
    return this.renderer
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.stop()
    this.renderer.destroy()
  }
}
