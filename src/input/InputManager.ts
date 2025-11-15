import { Camera } from '@/rendering/Camera'
import { EntityManager } from '@/core/EntityManager'
import { MovementSystem } from '@/game-logic/systems/MovementSystem'
import { MouseHandler } from './MouseHandler'

/**
 * Input Manager
 * Coordinates all input handling for the game
 */
export class InputManager {
  private mouseHandler: MouseHandler

  constructor(
    canvas: HTMLCanvasElement,
    camera: Camera,
    entityManager: EntityManager,
    movementSystem: MovementSystem
  ) {
    this.mouseHandler = new MouseHandler(canvas, camera, entityManager, movementSystem)
  }

  /**
   * Handle mouse down events
   */
  handleMouseDown(event: MouseEvent): void {
    this.mouseHandler.handleMouseDown(event)
  }

  /**
   * Handle mouse move events
   */
  handleMouseMove(event: MouseEvent): void {
    this.mouseHandler.handleMouseMove(event)
  }

  /**
   * Handle mouse up events
   */
  handleMouseUp(event: MouseEvent): void {
    this.mouseHandler.handleMouseUp(event)
  }

  /**
   * Update input state
   */
  update(deltaTime: number): void {
    this.mouseHandler.update(deltaTime)
  }

  /**
   * Get mouse handler
   */
  getMouseHandler(): MouseHandler {
    return this.mouseHandler
  }
}
