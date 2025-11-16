import type { UnitType, Resources } from '@/types/game'

/**
 * Represents a unit being trained
 */
export interface QueuedUnit {
  type: UnitType
  progress: number // 0 to 1
  totalTime: number // seconds
  cost: Partial<Resources>
}

/**
 * Manages unit production queue for buildings
 */
export class ProductionQueue {
  private queue: QueuedUnit[] = []
  private maxQueueSize: number

  constructor(maxQueueSize: number = 5) {
    this.maxQueueSize = maxQueueSize
  }

  /**
   * Add unit to production queue
   */
  public addUnit(type: UnitType, trainingTime: number, cost: Partial<Resources>): boolean {
    if (this.queue.length >= this.maxQueueSize) {
      return false
    }

    this.queue.push({
      type,
      progress: 0,
      totalTime: trainingTime,
      cost
    })

    return true
  }

  /**
   * Update production progress
   */
  public update(deltaTime: number): QueuedUnit | null {
    if (this.queue.length === 0) return null

    const current = this.queue[0]
    current.progress += deltaTime / current.totalTime

    // Check if unit is complete
    if (current.progress >= 1) {
      return this.queue.shift() || null
    }

    return null
  }

  /**
   * Cancel unit at index
   */
  public cancelUnit(index: number): Partial<Resources> | null {
    if (index < 0 || index >= this.queue.length) return null

    const cancelled = this.queue.splice(index, 1)[0]

    // Return partial refund (50% of cost)
    const refund: Partial<Resources> = {}
    if (cancelled.cost.food) refund.food = Math.floor(cancelled.cost.food * 0.5)
    if (cancelled.cost.wood) refund.wood = Math.floor(cancelled.cost.wood * 0.5)
    if (cancelled.cost.gold) refund.gold = Math.floor(cancelled.cost.gold * 0.5)
    if (cancelled.cost.stone) refund.stone = Math.floor(cancelled.cost.stone * 0.5)

    return refund
  }

  /**
   * Get current queue
   */
  public getQueue(): QueuedUnit[] {
    return [...this.queue]
  }

  /**
   * Get current training unit (first in queue)
   */
  public getCurrentUnit(): QueuedUnit | null {
    return this.queue.length > 0 ? this.queue[0] : null
  }

  /**
   * Get queue size
   */
  public getSize(): number {
    return this.queue.length
  }

  /**
   * Check if queue is full
   */
  public isFull(): boolean {
    return this.queue.length >= this.maxQueueSize
  }

  /**
   * Check if queue is empty
   */
  public isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Clear queue
   */
  public clear() {
    this.queue = []
  }

  /**
   * Get total progress as percentage
   */
  public getCurrentProgress(): number {
    const current = this.getCurrentUnit()
    return current ? current.progress : 0
  }
}
