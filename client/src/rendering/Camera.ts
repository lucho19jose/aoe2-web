/**
 * Camera class for handling viewport transformations
 * Supports panning (WASD/Arrow keys) and zooming (mouse wheel)
 */
export class Camera {
  public x: number = 0
  public y: number = 0
  public zoom: number = 1

  private panSpeed: number = 5
  private zoomSpeed: number = 0.1
  private minZoom: number = 0.25
  private maxZoom: number = 3

  private keys: Set<string> = new Set()

  constructor() {
    this.setupInputHandlers()
  }

  /**
   * Set up keyboard and mouse event listeners
   */
  private setupInputHandlers(): void {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase())
    })

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase())
    })

    // Mouse wheel for zoom
    window.addEventListener('wheel', (e) => {
      e.preventDefault()

      const zoomDelta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom + zoomDelta))
    }, { passive: false })
  }

  /**
   * Update camera position based on input
   * Should be called every frame
   */
  public update(): void {
    const adjustedPanSpeed = this.panSpeed / this.zoom

    // WASD and Arrow keys for panning
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.y -= adjustedPanSpeed
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.y += adjustedPanSpeed
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.x -= adjustedPanSpeed
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.x += adjustedPanSpeed
    }
  }

  /**
   * Apply camera transformation to canvas context
   */
  public applyTransform(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset transform
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.scale(this.zoom, this.zoom)
    ctx.translate(-this.x, -this.y)
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  public screenToWorld(screenX: number, screenY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    return {
      x: (screenX - centerX) / this.zoom + this.x,
      y: (screenY - centerY) / this.zoom + this.y
    }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  public worldToScreen(worldX: number, worldY: number, canvas: HTMLCanvasElement): { x: number; y: number } {
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    return {
      x: (worldX - this.x) * this.zoom + centerX,
      y: (worldY - this.y) * this.zoom + centerY
    }
  }
}
