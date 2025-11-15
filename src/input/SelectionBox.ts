/**
 * Selection Box
 * Handles drag-to-select box rendering and entity selection
 */
export class SelectionBox {
  startX: number = 0
  startY: number = 0
  endX: number = 0
  endY: number = 0
  active: boolean = false

  /**
   * Start selection box
   */
  start(x: number, y: number): void {
    this.startX = x
    this.startY = y
    this.endX = x
    this.endY = y
    this.active = true
  }

  /**
   * Update selection box end position
   */
  update(x: number, y: number): void {
    this.endX = x
    this.endY = y
  }

  /**
   * End selection box
   */
  end(): void {
    this.active = false
  }

  /**
   * Get selection box bounds in world space
   */
  getBounds(): { left: number; top: number; right: number; bottom: number } {
    return {
      left: Math.min(this.startX, this.endX),
      top: Math.min(this.startY, this.endY),
      right: Math.max(this.startX, this.endX),
      bottom: Math.max(this.startY, this.endY)
    }
  }

  /**
   * Check if a point is inside the selection box
   */
  contains(x: number, y: number): boolean {
    const bounds = this.getBounds()
    return (
      x >= bounds.left &&
      x <= bounds.right &&
      y >= bounds.top &&
      y <= bounds.bottom
    )
  }

  /**
   * Get selection box size
   */
  getSize(): { width: number; height: number } {
    const bounds = this.getBounds()
    return {
      width: bounds.right - bounds.left,
      height: bounds.bottom - bounds.top
    }
  }
}
