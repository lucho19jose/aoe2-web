import { EntityManager } from '@/core/EntityManager'

/**
 * Movement System
 * Handles unit movement and pathfinding
 */
export class MovementSystem {
  private entityManager: EntityManager

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager
  }

  /**
   * Update all moving entities
   */
  update(deltaTime: number): void {
    const entityIds = this.entityManager.getEntitiesWithComponents([
      'position',
      'movement'
    ])

    for (const id of entityIds) {
      const position = this.entityManager.getComponent(id, 'position')
      const movement = this.entityManager.getComponent(id, 'movement')

      if (!position || !movement) continue

      // Check if unit has a target
      if (movement.path.length === 0) {
        movement.velocity.x = 0
        movement.velocity.y = 0
        continue
      }

      const target = movement.path[movement.targetIndex]
      if (!target) continue

      // Calculate direction to target
      const dx = target.x - position.x
      const dy = target.y - position.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      // Check if reached target
      if (distance < 5) {
        // Move to next waypoint
        movement.targetIndex++

        // Check if reached end of path
        if (movement.targetIndex >= movement.path.length) {
          movement.path = []
          movement.targetIndex = 0
          movement.velocity.x = 0
          movement.velocity.y = 0
        }

        continue
      }

      // Calculate velocity
      const moveSpeed = movement.speed * deltaTime
      const normalizedDx = dx / distance
      const normalizedDy = dy / distance

      movement.velocity.x = normalizedDx * movement.speed
      movement.velocity.y = normalizedDy * movement.speed

      // Move unit
      position.x += normalizedDx * moveSpeed
      position.y += normalizedDy * moveSpeed
    }
  }

  /**
   * Set move target for an entity
   */
  setMoveTarget(entityId: number, targetX: number, targetY: number): void {
    const movement = this.entityManager.getComponent(entityId, 'movement')
    if (!movement) return

    // For now, just set direct path (no pathfinding yet)
    movement.path = [{ x: targetX, y: targetY }]
    movement.targetIndex = 0
  }

  /**
   * Set move target for multiple entities
   */
  setMoveTargetForGroup(entityIds: number[], targetX: number, targetY: number): void {
    for (const id of entityIds) {
      this.setMoveTarget(id, targetX, targetY)
    }
  }

  /**
   * Stop an entity from moving
   */
  stopMovement(entityId: number): void {
    const movement = this.entityManager.getComponent(entityId, 'movement')
    if (!movement) return

    movement.path = []
    movement.targetIndex = 0
    movement.velocity.x = 0
    movement.velocity.y = 0
  }
}
