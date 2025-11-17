/**
 * Integration tests for pathfinding system
 */
import { describe, it, expect } from 'vitest'
import { NavigationGrid } from '@/pathfinding/NavigationGrid'

describe('Pathfinding Integration', () => {
  it('should find a path between two points', () => {
    const grid = new NavigationGrid(10, 10, 32)

    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path = grid.findPath(start, end)

    expect(path).toBeDefined()
    expect(path.length).toBeGreaterThan(0)
    expect(path[0]).toEqual(start)
    expect(path[path.length - 1]).toEqual(end)
  })

  it('should avoid obstacles', () => {
    const grid = new NavigationGrid(10, 10, 32)

    // Place obstacle
    grid.setWalkable(2, 2, false)

    const start = { x: 0, y: 0 }
    const end = { x: 5, y: 5 }

    const path = grid.findPath(start, end)

    expect(path).toBeDefined()
    // Path should not go through obstacle at (2, 2)
    const pathIncludesObstacle = path.some(p => p.x === 2 && p.y === 2)
    expect(pathIncludesObstacle).toBe(false)
  })

  it('should return empty path when no path exists', () => {
    const grid = new NavigationGrid(10, 10, 32)

    // Create wall blocking the path
    for (let i = 0; i < 10; i++) {
      grid.setWalkable(5, i, false)
    }

    const start = { x: 0, y: 5 }
    const end = { x: 9, y: 5 }

    const path = grid.findPath(start, end)

    expect(path).toBeDefined()
    expect(path.length).toBe(0)
  })
})
