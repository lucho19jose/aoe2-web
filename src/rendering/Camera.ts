/**
 * Camera class for panning and zooming
 */
export class Camera {
  // Position (center of camera in world space)
  x: number = 0
  y: number = 0

  // Zoom level (1.0 = normal, 2.0 = 2x zoom in)
  zoom: number = 1.0

  // Viewport size
  viewportWidth: number = 0
  viewportHeight: number = 0

  // Camera movement speed
  private panSpeed: number = 500 // pixels per second
  private zoomSpeed: number = 0.1

  // Zoom limits
  private minZoom: number = 0.25
  private maxZoom: number = 3.0

  // Key bindings
  private keys: { [key: string]: boolean } = {}

  constructor(canvas: HTMLCanvasElement) {
    this.viewportWidth = canvas.width
    this.viewportHeight = canvas.height

    // Setup mouse wheel zoom
    canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false })
  }

  /**
   * Set key bindings reference
   */
  setKeyBindings(keys: { [key: string]: boolean }): void {
    this.keys = keys
  }

  /**
   * Update viewport size
   */
  updateViewport(width: number, height: number): void {
    this.viewportWidth = width
    this.viewportHeight = height
  }

  /**
   * Update camera position based on keyboard input
   */
  update(deltaTime: number): void {
    const moveSpeed = this.panSpeed * deltaTime

    // WASD or Arrow keys for panning
    if (this.keys['w'] || this.keys['arrowup']) {
      this.y -= moveSpeed
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.y += moveSpeed
    }
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.x -= moveSpeed
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.x += moveSpeed
    }
  }

  /**
   * Handle mouse wheel for zooming
   */
  private handleWheel(event: WheelEvent): void {
    event.preventDefault()

    const zoomDelta = event.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed
    const newZoom = this.zoom + zoomDelta

    // Clamp zoom
    this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const worldX = (screenX - this.viewportWidth / 2) / this.zoom + this.x
    const worldY = (screenY - this.viewportHeight / 2) / this.zoom + this.y

    return { x: worldX, y: worldY }
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const screenX = (worldX - this.x) * this.zoom + this.viewportWidth / 2
    const screenY = (worldY - this.y) * this.zoom + this.viewportHeight / 2

    return { x: screenX, y: screenY }
  }

  /**
   * Get the camera's view bounds in world space
   */
  getViewBounds(): { left: number; top: number; right: number; bottom: number } {
    const halfWidth = (this.viewportWidth / 2) / this.zoom
    const halfHeight = (this.viewportHeight / 2) / this.zoom

    return {
      left: this.x - halfWidth,
      top: this.y - halfHeight,
      right: this.x + halfWidth,
      bottom: this.y + halfHeight
    }
  }

  /**
   * Apply camera transformation to canvas context
   */
  applyTransform(ctx: CanvasRenderingContext2D): void {
    // Reset transform
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Translate to center
    ctx.translate(this.viewportWidth / 2, this.viewportHeight / 2)

    // Apply zoom
    ctx.scale(this.zoom, this.zoom)

    // Translate by camera position
    ctx.translate(-this.x, -this.y)
  }
}
