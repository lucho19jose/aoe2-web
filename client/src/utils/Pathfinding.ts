import type { Position } from '@/types/game'
import { positionToGridCoords, gridCoordsToPosition, getManhattanDistance } from './gameUtils'

/**
 * A* Pathfinding implementation
 */

interface GridNode {
  x: number
  y: number
  walkable: boolean
  g: number // Cost from start
  h: number // Heuristic cost to end
  f: number // Total cost (g + h)
  parent: GridNode | null
}

export class Pathfinder {
  private gridSize: number
  private mapSize: number
  private grid: GridNode[][]

  constructor(mapSize: number = 100, gridSize: number = 2) {
    this.mapSize = mapSize
    this.gridSize = gridSize
    this.grid = this.initializeGrid()
  }

  private initializeGrid(): GridNode[][] {
    const gridWidth = Math.ceil(this.mapSize / this.gridSize)
    const gridHeight = Math.ceil(this.mapSize / this.gridSize)
    const grid: GridNode[][] = []

    for (let y = 0; y < gridHeight; y++) {
      grid[y] = []
      for (let x = 0; x < gridWidth; x++) {
        grid[y][x] = {
          x,
          y,
          walkable: true,
          g: 0,
          h: 0,
          f: 0,
          parent: null,
        }
      }
    }

    return grid
  }

  public setWalkable(position: Position, walkable: boolean, radius: number = 1) {
    const gridCoords = positionToGridCoords(position, this.gridSize)
    const gridRadius = Math.ceil(radius / this.gridSize)

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const x = gridCoords.x + dx
        const y = gridCoords.y + dy

        if (this.isValidGridCoord(x, y)) {
          this.grid[y][x].walkable = walkable
        }
      }
    }
  }

  private isValidGridCoord(x: number, y: number): boolean {
    return x >= 0 && x < this.grid[0].length && y >= 0 && y < this.grid.length
  }

  public findPath(start: Position, end: Position): Position[] {
    const startGrid = positionToGridCoords(start, this.gridSize)
    const endGrid = positionToGridCoords(end, this.gridSize)

    // Validate coordinates
    if (!this.isValidGridCoord(startGrid.x, startGrid.y) ||
        !this.isValidGridCoord(endGrid.x, endGrid.y)) {
      return []
    }

    const startNode = this.grid[startGrid.y][startGrid.x]
    const endNode = this.grid[endGrid.y][endGrid.x]

    // If end is not walkable, find nearest walkable node
    if (!endNode.walkable) {
      const nearestWalkable = this.findNearestWalkable(endGrid.x, endGrid.y)
      if (!nearestWalkable) return []
      return this.astar(startNode, nearestWalkable)
    }

    return this.astar(startNode, endNode)
  }

  private findNearestWalkable(x: number, y: number): GridNode | null {
    const maxRadius = 10
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const nx = x + dx
            const ny = y + dy
            if (this.isValidGridCoord(nx, ny) && this.grid[ny][nx].walkable) {
              return this.grid[ny][nx]
            }
          }
        }
      }
    }
    return null
  }

  private astar(startNode: GridNode, endNode: GridNode): Position[] {
    // Reset all nodes
    this.grid.forEach((row) => {
      row.forEach((node) => {
        node.g = 0
        node.h = 0
        node.f = 0
        node.parent = null
      })
    })

    const openList: GridNode[] = [startNode]
    const closedList: Set<GridNode> = new Set()

    startNode.g = 0
    startNode.h = getManhattanDistance(
      { x: startNode.x, y: startNode.y },
      { x: endNode.x, y: endNode.y }
    )
    startNode.f = startNode.g + startNode.h

    while (openList.length > 0) {
      // Find node with lowest f score
      let currentNode = openList[0]
      let currentIndex = 0

      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < currentNode.f) {
          currentNode = openList[i]
          currentIndex = i
        }
      }

      // Remove current from open list
      openList.splice(currentIndex, 1)
      closedList.add(currentNode)

      // Found the goal
      if (currentNode === endNode) {
        return this.reconstructPath(currentNode)
      }

      // Check neighbors
      const neighbors = this.getNeighbors(currentNode)

      for (const neighbor of neighbors) {
        if (closedList.has(neighbor) || !neighbor.walkable) {
          continue
        }

        const tentativeG = currentNode.g + 1

        if (!openList.includes(neighbor)) {
          openList.push(neighbor)
        } else if (tentativeG >= neighbor.g) {
          continue
        }

        neighbor.parent = currentNode
        neighbor.g = tentativeG
        neighbor.h = getManhattanDistance(
          { x: neighbor.x, y: neighbor.y },
          { x: endNode.x, y: endNode.y }
        )
        neighbor.f = neighbor.g + neighbor.h
      }
    }

    // No path found
    return []
  }

  private getNeighbors(node: GridNode): GridNode[] {
    const neighbors: GridNode[] = []
    const directions = [
      { x: 0, y: -1 }, // North
      { x: 1, y: 0 },  // East
      { x: 0, y: 1 },  // South
      { x: -1, y: 0 }, // West
      // Diagonals (optional, can be disabled for grid-based movement)
      { x: 1, y: -1 }, // NE
      { x: 1, y: 1 },  // SE
      { x: -1, y: 1 }, // SW
      { x: -1, y: -1 }, // NW
    ]

    for (const dir of directions) {
      const x = node.x + dir.x
      const y = node.y + dir.y

      if (this.isValidGridCoord(x, y)) {
        neighbors.push(this.grid[y][x])
      }
    }

    return neighbors
  }

  private reconstructPath(endNode: GridNode): Position[] {
    const path: Position[] = []
    let current: GridNode | null = endNode

    while (current) {
      path.unshift(gridCoordsToPosition(current.x, current.y, this.gridSize))
      current = current.parent
    }

    // Simplify path by removing unnecessary waypoints
    return this.simplifyPath(path)
  }

  private simplifyPath(path: Position[]): Position[] {
    if (path.length <= 2) return path

    const simplified: Position[] = [path[0]]

    for (let i = 1; i < path.length - 1; i++) {
      const prev = simplified[simplified.length - 1]
      const current = path[i]
      const next = path[i + 1]

      // Check if current point is necessary
      const dx1 = current.x - prev.x
      const dz1 = (current.z || 0) - (prev.z || 0)
      const dx2 = next.x - current.x
      const dz2 = (next.z || 0) - (current.z || 0)

      // If direction changes, keep the point
      if (Math.abs(dx1 - dx2) > 0.01 || Math.abs(dz1 - dz2) > 0.01) {
        simplified.push(current)
      }
    }

    simplified.push(path[path.length - 1])
    return simplified
  }

  public clear() {
    this.grid.forEach((row) => {
      row.forEach((node) => {
        node.walkable = true
      })
    })
  }

  public reset() {
    this.grid = this.initializeGrid()
  }
}

// Singleton instance
let pathfinderInstance: Pathfinder | null = null

export function getPathfinder(mapSize?: number, gridSize?: number): Pathfinder {
  if (!pathfinderInstance) {
    pathfinderInstance = new Pathfinder(mapSize, gridSize)
  }
  return pathfinderInstance
}

export function resetPathfinder() {
  if (pathfinderInstance) {
    pathfinderInstance.reset()
  }
}
