/**
 * Camera class for handling viewport transformation
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

  // Track which keys are currently pressed
  private keys: Set<string> = new Set()

  constructor() {
    this.setupInputListeners()
  }

  private setupInputListeners(): void {
    // Keyboard input for panning
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      this.keys.add(e.key.toLowerCase())
    })

    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.delete(e.key.toLowerCase())
    })

    // Mouse wheel for zooming
    window.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault()

      const zoomDelta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed
      const newZoom = this.zoom + zoomDelta

      // Clamp zoom within bounds
      this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
    }, { passive: false })
  }

  /**
   * Update camera position based on key inputs
   * Should be called every frame
   */
  public update(deltaTime: number): void {
    const speed = this.panSpeed * (1 / this.zoom) // Move slower when zoomed in

    // WASD and Arrow keys for panning
    if (this.keys.has('w') || this.keys.has('arrowup')) {
      this.y -= speed
    }
    if (this.keys.has('s') || this.keys.has('arrowdown')) {
      this.y += speed
    }
    if (this.keys.has('a') || this.keys.has('arrowleft')) {
      this.x -= speed
    }
    if (this.keys.has('d') || this.keys.has('arrowright')) {
      this.x += speed
    }
  }

  /**
   * Apply camera transformation to canvas context
   */
  public applyTransform(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    ctx.save()

    // Center the view
    ctx.translate(canvas.width / 2, canvas.height / 2)

    // Apply zoom
    ctx.scale(this.zoom, this.zoom)

    // Apply camera position
    ctx.translate(-this.x, -this.y)
  }

  /**
   * Restore the canvas context to its original state
   */
  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore()
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

  /**
   * Clean up event listeners
   */
  public destroy(): void {
    this.keys.clear()
  }
}
