import { Camera } from './Camera'
import { EntityManager } from '../core/EntityManager'

/**
 * Renderer class handles all canvas drawing operations
 * Draws the game world, including grid, entities, and UI elements
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private entityManager: EntityManager

  // Grid settings
  private readonly TILE_SIZE = 32
  private readonly GRID_WIDTH = 100
  private readonly GRID_HEIGHT = 100

  // FPS tracking
  private fps: number = 0
  private frameCount: number = 0
  private lastFpsUpdate: number = 0

  constructor(canvas: HTMLCanvasElement, entityManager: EntityManager) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D rendering context')
    }
    this.ctx = ctx
    this.camera = new Camera()
    this.entityManager = entityManager

    this.setupCanvas()
    this.setupResizeHandler()
  }

  private setupCanvas(): void {
    this.resizeCanvas()
  }

  private setupResizeHandler(): void {
    const resizeObserver = new ResizeObserver(() => {
      this.resizeCanvas()
    })
    resizeObserver.observe(this.canvas.parentElement!)
  }

  private resizeCanvas(): void {
    const parent = this.canvas.parentElement
    if (!parent) return

    // Get the actual display size
    const displayWidth = parent.clientWidth
    const displayHeight = parent.clientHeight

    // Set the canvas internal size to match display size
    if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
      this.canvas.width = displayWidth
      this.canvas.height = displayHeight
    }
  }

  /**
   * Update camera and other state
   */
  public update(deltaTime: number): void {
    this.camera.update(deltaTime)
    this.updateFPS(deltaTime)
  }

  /**
   * Render the entire game scene
   */
  public render(): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Apply camera transformation
    this.camera.applyTransform(this.ctx, this.canvas)

    // Draw the grid
    this.drawGrid()

    // Draw entities
    this.drawEntities()

    // Restore camera transformation
    this.camera.restoreTransform(this.ctx)

    // Draw UI elements (no camera transform)
    this.drawFPS()
    this.drawEntityCount()
  }

  /**
   * Draw a grid of tiles
   */
  private drawGrid(): void {
    const startX = Math.floor(-this.GRID_WIDTH / 2) * this.TILE_SIZE
    const startY = Math.floor(-this.GRID_HEIGHT / 2) * this.TILE_SIZE

    for (let row = 0; row < this.GRID_HEIGHT; row++) {
      for (let col = 0; col < this.GRID_WIDTH; col++) {
        const x = startX + col * this.TILE_SIZE
        const y = startY + row * this.TILE_SIZE

        // Alternating colors for checkerboard pattern
        const isEven = (row + col) % 2 === 0
        this.ctx.fillStyle = isEven ? '#2a2a2a' : '#333333'
        this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE)

        // Draw grid lines
        this.ctx.strokeStyle = '#404040'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(x, y, this.TILE_SIZE, this.TILE_SIZE)
      }
    }
  }

  /**
   * Draw all entities with render and position components
   */
  private drawEntities(): void {
    const entities = this.entityManager.getEntitiesWithComponents('position', 'render')

    for (const entity of entities) {
      const position = entity.getComponent('position')!
      const render = entity.getComponent('render')!
      const selection = entity.getComponent('selection')

      // Draw the unit based on its render type
      if (render.type === 'circle') {
        // Draw unit circle
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, render.radius, 0, Math.PI * 2)
        this.ctx.fillStyle = render.color
        this.ctx.fill()

        // Draw outline if selected
        if (selection?.isSelected) {
          this.ctx.strokeStyle = '#00ff00'
          this.ctx.lineWidth = 2
          this.ctx.stroke()
        } else {
          this.ctx.strokeStyle = '#000000'
          this.ctx.lineWidth = 1
          this.ctx.stroke()
        }
      }

      // Draw health bar if damaged
      const health = entity.getComponent('health')
      if (health && health.current < health.max) {
        const barWidth = render.radius * 2
        const barHeight = 4
        const barX = position.x - render.radius
        const barY = position.y - render.radius - 8

        // Background
        this.ctx.fillStyle = '#ff0000'
        this.ctx.fillRect(barX, barY, barWidth, barHeight)

        // Current health
        const healthPercent = health.current / health.max
        this.ctx.fillStyle = '#00ff00'
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)
      }
    }
  }

  /**
   * Update FPS counter
   */
  private updateFPS(deltaTime: number): void {
    this.frameCount++
    this.lastFpsUpdate += deltaTime

    if (this.lastFpsUpdate >= 1000) {
      this.fps = Math.round(this.frameCount * 1000 / this.lastFpsUpdate)
      this.frameCount = 0
      this.lastFpsUpdate = 0
    }
  }

  /**
   * Draw FPS counter in top-left corner
   */
  private drawFPS(): void {
    this.ctx.fillStyle = '#00ff00'
    this.ctx.font = '16px monospace'
    this.ctx.fillText(`FPS: ${this.fps}`, 10, 25)

    // Also display zoom level
    this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}x`, 10, 45)
    this.ctx.fillText(`Pos: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`, 10, 65)
  }

  /**
   * Draw entity count
   */
  private drawEntityCount(): void {
    this.ctx.fillStyle = '#00ff00'
    this.ctx.font = '16px monospace'
    this.ctx.fillText(`Entities: ${this.entityManager.getEntityCount()}`, 10, 85)
  }

  /**
   * Get the camera instance
   */
  public getCamera(): Camera {
    return this.camera
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.camera.destroy()
  }
}
