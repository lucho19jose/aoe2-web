import { Camera } from './Camera'
import { EntityManager } from '@/core/EntityManager'
import { InputManager } from '@/input/InputManager'

/**
 * Main renderer for the game
 * Handles all canvas drawing operations
 */
export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private camera: Camera
  private entityManager: EntityManager
  private inputManager: InputManager

  // Grid settings
  private tileSize: number = 32
  private gridWidth: number = 100
  private gridHeight: number = 100

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    entityManager: EntityManager,
    inputManager: InputManager
  ) {
    this.canvas = canvas
    this.camera = camera
    this.entityManager = entityManager
    this.inputManager = inputManager

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2D context')
    }
    this.ctx = ctx

    // Disable image smoothing for pixel-perfect rendering
    this.ctx.imageSmoothingEnabled = false
  }

  /**
   * Main render function
   */
  render(fps: number): void {
    // Clear canvas
    this.ctx.fillStyle = '#1a1a1a'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Apply camera transform
    this.camera.applyTransform(this.ctx)

    // Render game world
    this.renderGrid()
    this.renderEntities()
    this.renderSelectionBox()

    // Reset transform for UI elements
    this.ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Render UI (FPS counter)
    this.renderFPS(fps)
  }

  /**
   * Render the grid background
   */
  private renderGrid(): void {
    const bounds = this.camera.getViewBounds()

    // Calculate visible tile range
    const startX = Math.floor(bounds.left / this.tileSize)
    const endX = Math.ceil(bounds.right / this.tileSize)
    const startY = Math.floor(bounds.top / this.tileSize)
    const endY = Math.ceil(bounds.bottom / this.tileSize)

    // Clamp to grid bounds
    const minX = Math.max(0, startX)
    const maxX = Math.min(this.gridWidth, endX)
    const minY = Math.max(0, startY)
    const maxY = Math.min(this.gridHeight, endY)

    // Draw tiles
    for (let y = minY; y < maxY; y++) {
      for (let x = minX; x < maxX; x++) {
        const worldX = x * this.tileSize
        const worldY = y * this.tileSize

        // Alternating pattern
        const isLight = (x + y) % 2 === 0
        this.ctx.fillStyle = isLight ? '#2a4d2a' : '#234423'

        this.ctx.fillRect(worldX, worldY, this.tileSize, this.tileSize)

        // Grid lines (only visible when zoomed in)
        if (this.camera.zoom > 0.8) {
          this.ctx.strokeStyle = '#1a3a1a'
          this.ctx.lineWidth = 1 / this.camera.zoom
          this.ctx.strokeRect(worldX, worldY, this.tileSize, this.tileSize)
        }
      }
    }
  }

  /**
   * Render entities (units, buildings, etc.)
   */
  private renderEntities(): void {
    // Get all entities with position and renderable components
    const entityIds = this.entityManager.getEntitiesWithComponents(['position', 'renderable'])

    for (const id of entityIds) {
      const position = this.entityManager.getComponent(id, 'position')
      const renderable = this.entityManager.getComponent(id, 'renderable')
      const selectable = this.entityManager.getComponent(id, 'selectable')
      const health = this.entityManager.getComponent(id, 'health')

      if (!position || !renderable) continue

      // Draw unit circle
      this.ctx.fillStyle = renderable.color
      this.ctx.beginPath()
      this.ctx.arc(position.x, position.y, renderable.radius, 0, Math.PI * 2)
      this.ctx.fill()

      // Draw selection outline if selected
      if (selectable?.selected) {
        this.ctx.strokeStyle = '#00ff00'
        this.ctx.lineWidth = 2 / this.camera.zoom
        this.ctx.beginPath()
        this.ctx.arc(position.x, position.y, renderable.radius + 3, 0, Math.PI * 2)
        this.ctx.stroke()
      }

      // Draw health bar if damaged
      if (health && health.current < health.max) {
        const barWidth = renderable.radius * 2
        const barHeight = 4
        const barX = position.x - barWidth / 2
        const barY = position.y - renderable.radius - 10

        // Background
        this.ctx.fillStyle = '#ff0000'
        this.ctx.fillRect(barX, barY, barWidth, barHeight)

        // Health
        const healthPercent = health.current / health.max
        this.ctx.fillStyle = '#00ff00'
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight)
      }
    }
  }

  /**
   * Render selection box
   */
  private renderSelectionBox(): void {
    const selectionBox = this.inputManager.getMouseHandler().getSelectionBox()

    if (selectionBox.active) {
      const bounds = selectionBox.getBounds()
      const width = bounds.right - bounds.left
      const height = bounds.bottom - bounds.top

      // Draw selection box background
      this.ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'
      this.ctx.fillRect(bounds.left, bounds.top, width, height)

      // Draw selection box border
      this.ctx.strokeStyle = '#00ff00'
      this.ctx.lineWidth = 2 / this.camera.zoom
      this.ctx.strokeRect(bounds.left, bounds.top, width, height)
    }
  }

  /**
   * Render FPS counter
   */
  private renderFPS(fps: number): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(10, 10, 100, 40)

    this.ctx.fillStyle = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffff00' : '#ff0000'
    this.ctx.font = 'bold 24px monospace'
    this.ctx.fillText(`${fps} FPS`, 20, 38)
  }

  /**
   * Get rendering context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx
  }

  /**
   * Get camera
   */
  getCamera(): Camera {
    return this.camera
  }
}
