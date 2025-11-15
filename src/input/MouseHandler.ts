import { Camera } from '@/rendering/Camera'
import { EntityManager } from '@/core/EntityManager'
import { MovementSystem } from '@/game-logic/systems/MovementSystem'
import { SelectionBox } from './SelectionBox'

/**
 * Mouse Handler
 * Handles all mouse input for the game
 */
export class MouseHandler {
  private canvas: HTMLCanvasElement
  private camera: Camera
  private entityManager: EntityManager
  private movementSystem: MovementSystem
  private selectionBox: SelectionBox

  // Mouse state
  private mouseDown: boolean = false
  private mouseButton: number = -1
  private dragStartX: number = 0
  private dragStartY: number = 0
  private isDragging: boolean = false
  private dragThreshold: number = 5 // pixels

  // Current mouse position in world space
  private worldX: number = 0
  private worldY: number = 0

  // Move target marker
  private moveTarget: { x: number; y: number; timestamp: number } | null = null

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    entityManager: EntityManager,
    movementSystem: MovementSystem
  ) {
    this.canvas = canvas
    this.camera = camera
    this.entityManager = entityManager
    this.movementSystem = movementSystem
    this.selectionBox = new SelectionBox()
  }

  /**
   * Handle mouse down event
   */
  handleMouseDown(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const worldPos = this.camera.screenToWorld(screenX, screenY)

    this.mouseDown = true
    this.mouseButton = event.button
    this.dragStartX = worldPos.x
    this.dragStartY = worldPos.y
    this.worldX = worldPos.x
    this.worldY = worldPos.y

    // Left click (button 0)
    if (event.button === 0) {
      // Check if clicking on a unit
      const clickedUnit = this.getUnitAtPosition(worldPos.x, worldPos.y)

      if (clickedUnit !== null) {
        // Clicked on a unit - select it
        this.selectSingleUnit(clickedUnit)
      } else {
        // Clicked on empty space - start selection box
        this.selectionBox.start(worldPos.x, worldPos.y)
      }
    }
  }

  /**
   * Handle mouse move event
   */
  handleMouseMove(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const worldPos = this.camera.screenToWorld(screenX, screenY)

    this.worldX = worldPos.x
    this.worldY = worldPos.y

    if (this.mouseDown && this.mouseButton === 0) {
      // Check if we've moved enough to start dragging
      const dx = worldPos.x - this.dragStartX
      const dy = worldPos.y - this.dragStartY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > this.dragThreshold) {
        this.isDragging = true
      }

      // Update selection box if dragging
      if (this.isDragging || this.selectionBox.active) {
        this.selectionBox.update(worldPos.x, worldPos.y)
      }
    }
  }

  /**
   * Handle mouse up event
   */
  handleMouseUp(event: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect()
    const screenX = event.clientX - rect.left
    const screenY = event.clientY - rect.top
    const worldPos = this.camera.screenToWorld(screenX, screenY)

    // Left click release
    if (event.button === 0) {
      if (this.isDragging && this.selectionBox.active) {
        // Finish box selection
        this.performBoxSelection()
        this.selectionBox.end()
      } else if (!this.isDragging) {
        // Single click - already handled in mouseDown
        this.selectionBox.end()
      }
    }

    // Right click - Issue move commands
    if (event.button === 2) {
      this.handleRightClick(worldPos.x, worldPos.y)
    }

    this.mouseDown = false
    this.isDragging = false
    this.mouseButton = -1
  }

  /**
   * Handle right-click commands (move, attack, gather)
   */
  private handleRightClick(worldX: number, worldY: number): void {
    // Get selected units
    const selectedUnits = this.getSelectedUnits()

    if (selectedUnits.length === 0) return

    // Show move target marker
    this.moveTarget = {
      x: worldX,
      y: worldY,
      timestamp: Date.now()
    }

    // Issue move command to all selected units
    this.movementSystem.setMoveTargetForGroup(selectedUnits, worldX, worldY)
  }

  /**
   * Update mouse handler state
   */
  update(deltaTime: number): void {
    // Update any ongoing mouse-related animations or states
  }

  /**
   * Get unit at specific position
   */
  private getUnitAtPosition(worldX: number, worldY: number): number | null {
    const entityIds = this.entityManager.getEntitiesWithComponents([
      'position',
      'renderable',
      'selectable'
    ])

    for (const id of entityIds) {
      const position = this.entityManager.getComponent(id, 'position')
      const renderable = this.entityManager.getComponent(id, 'renderable')

      if (!position || !renderable) continue

      const dx = worldX - position.x
      const dy = worldY - position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= renderable.radius) {
        return id
      }
    }

    return null
  }

  /**
   * Select a single unit
   */
  private selectSingleUnit(entityId: number): void {
    // Deselect all units
    this.deselectAll()

    // Select the clicked unit
    const selectable = this.entityManager.getComponent(entityId, 'selectable')
    if (selectable) {
      selectable.selected = true
    }
  }

  /**
   * Perform box selection
   */
  private performBoxSelection(): void {
    const bounds = this.selectionBox.getBounds()

    // Deselect all units first
    this.deselectAll()

    // Select all units inside the box
    const entityIds = this.entityManager.getEntitiesWithComponents([
      'position',
      'selectable'
    ])

    for (const id of entityIds) {
      const position = this.entityManager.getComponent(id, 'position')
      if (!position) continue

      // Check if unit is inside selection box
      if (this.selectionBox.contains(position.x, position.y)) {
        const selectable = this.entityManager.getComponent(id, 'selectable')
        if (selectable) {
          selectable.selected = true
        }
      }
    }
  }

  /**
   * Deselect all units
   */
  private deselectAll(): void {
    const entityIds = this.entityManager.getEntitiesWithComponents(['selectable'])

    for (const id of entityIds) {
      const selectable = this.entityManager.getComponent(id, 'selectable')
      if (selectable) {
        selectable.selected = false
      }
    }
  }

  /**
   * Get selection box for rendering
   */
  getSelectionBox(): SelectionBox {
    return this.selectionBox
  }

  /**
   * Get selected units
   */
  private getSelectedUnits(): number[] {
    const entityIds = this.entityManager.getEntitiesWithComponents(['selectable'])
    const selected: number[] = []

    for (const id of entityIds) {
      const selectable = this.entityManager.getComponent(id, 'selectable')
      if (selectable?.selected) {
        selected.push(id)
      }
    }

    return selected
  }

  /**
   * Get current world position of mouse
   */
  getWorldPosition(): { x: number; y: number } {
    return { x: this.worldX, y: this.worldY }
  }

  /**
   * Get move target for rendering
   */
  getMoveTarget(): { x: number; y: number; timestamp: number } | null {
    // Clear move target after 1 second
    if (this.moveTarget && Date.now() - this.moveTarget.timestamp > 1000) {
      this.moveTarget = null
    }
    return this.moveTarget
  }
}
