import { Camera } from './Camera'
import { EntityManager } from '../core/EntityManager'
import { ComponentType } from '../core/components'

/**
 * Renderer class handles all canvas drawing operations
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private entityManager: EntityManager

  // Grid settings
  private readonly gridSize = 100 // 100x100 tiles
  private readonly tileSize = 32 // 32px per tile

  // Colors
  private readonly gridColor1 = '#2a4a3a'
  private readonly gridColor2 = '#1f3a2a'
  private readonly gridLineColor = '#1a2a1a'

  constructor(canvas: HTMLCanvasElement, camera: Camera, entityManager: EntityManager) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas')
    }
    this.ctx = ctx
    this.camera = camera
    this.entityManager = entityManager

    this.setupCanvas()
  }

  /**
   * Set canvas size and handle window resize
   */
  private setupCanvas(): void {
    this.resizeCanvas()
    window.addEventListener('resize', () => this.resizeCanvas())
  }

  /**
   * Resize canvas to fill the viewport
   */
  private resizeCanvas(): void {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight - 50 // Account for header
  }

  /**
   * Clear the canvas
   */
  private clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
    this.ctx.fillStyle = '#0a0a0a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Draw the tile grid with alternating colors
   */
  private drawGrid(): void {
    // Calculate visible tile range for optimization
    const startX = Math.floor(-this.gridSize / 2)
    const startY = Math.floor(-this.gridSize / 2)
    const endX = startX + this.gridSize
    const endY = startY + this.gridSize

    // Draw tiles
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        // Alternating pattern
        const isEven = (x + y) % 2 === 0
        this.ctx.fillStyle = isEven ? this.gridColor1 : this.gridColor2

        const worldX = x * this.tileSize
        const worldY = y * this.tileSize

        this.ctx.fillRect(worldX, worldY, this.tileSize, this.tileSize)
      }
    }

    // Draw grid lines
    this.ctx.strokeStyle = this.gridLineColor
    this.ctx.lineWidth = 1 / this.camera.zoom

    // Vertical lines
    for (let x = startX; x <= endX; x++) {
      const worldX = x * this.tileSize
      this.ctx.beginPath()
      this.ctx.moveTo(worldX, startY * this.tileSize)
      this.ctx.lineTo(worldX, endY * this.tileSize)
      this.ctx.stroke()
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y++) {
      const worldY = y * this.tileSize
      this.ctx.beginPath()
      this.ctx.moveTo(startX * this.tileSize, worldY)
      this.ctx.lineTo(endX * this.tileSize, worldY)
      this.ctx.stroke()
    }

    // Draw border around entire grid
    this.ctx.strokeStyle = '#4a6a5a'
    this.ctx.lineWidth = 3 / this.camera.zoom
    this.ctx.strokeRect(
      startX * this.tileSize,
      startY * this.tileSize,
      this.gridSize * this.tileSize,
      this.gridSize * this.tileSize
    )
  }

  /**
   * Draw FPS counter
   */
  private drawFPS(fps: number): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform for UI

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(10, 10, 100, 40)

    this.ctx.fillStyle = fps >= 55 ? '#42b883' : fps >= 30 ? '#f2c037' : '#c10015'
    this.ctx.font = 'bold 20px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText(`FPS: ${fps}`, 20, 20)
  }

  /**
   * Draw camera info (for debugging)
   */
  private drawCameraInfo(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform

    const info = [
      `Pos: (${Math.round(this.camera.x)}, ${Math.round(this.camera.y)})`,
      `Zoom: ${this.camera.zoom.toFixed(2)}x`,
      `Entities: ${this.entityManager.getEntityCount()}`
    ]

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(10, 60, 200, 80)

    this.ctx.fillStyle = '#42b883'
    this.ctx.font = '14px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'

    info.forEach((line, index) => {
      this.ctx.fillText(line, 20, 70 + index * 20)
    })
  }

  /**
   * Draw all entities with render and position components
   */
  private drawEntities(): void {
    // Get all entities that have both position and render components
    const entities = this.entityManager.getEntitiesWithComponents(
      ComponentType.POSITION,
      ComponentType.RENDER
    )

    for (const entity of entities) {
      const position = this.entityManager.getComponent(entity, ComponentType.POSITION)
      const render = this.entityManager.getComponent(entity, ComponentType.RENDER)

      if (!position || !render) continue

      if (render.type === 'circle') {
        // Draw circle
        this.ctx.fillStyle = render.color
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, render.radius ?? 16, 0, Math.PI * 2)
        this.ctx.fill()

        // Draw outline
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
        this.ctx.lineWidth = 2 / this.camera.zoom
        this.ctx.stroke()

        // Draw health bar if entity has health component
        const health = this.entityManager.getComponent(entity, ComponentType.HEALTH)
        if (health && health.current < health.max) {
          this.drawHealthBar(position.x, position.y, render.radius ?? 16, health.current, health.max)
        }
      }
    }
  }

  /**
   * Draw health bar above an entity
   */
  private drawHealthBar(x: number, y: number, radius: number, current: number, max: number): void {
    const barWidth = radius * 2
    const barHeight = 4 / this.camera.zoom
    const barY = y - radius - 10 / this.camera.zoom

    // Background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight)

    // Health
    const healthPercent = current / max
    const healthColor = healthPercent > 0.6 ? '#42b883' : healthPercent > 0.3 ? '#f2c037' : '#c10015'
    this.ctx.fillStyle = healthColor
    this.ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight)

    // Border
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1 / this.camera.zoom
    this.ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight)
  }

  /**
   * Main render function - called every frame
   */
  public render(fps: number): void {
    this.clear()

    // Apply camera transform
    this.camera.applyTransform(this.ctx, this.canvas)

    // Draw world objects
    this.drawGrid()
    this.drawEntities()

    // Draw UI (no transform)
    this.drawFPS(fps)
    this.drawCameraInfo()
  }
}
