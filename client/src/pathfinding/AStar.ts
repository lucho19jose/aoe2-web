import type { Position } from '@/types/game'

/**
 * A* Pathfinding Node
 */
export class PathNode {
  x: number
  y: number
  g: number = 0 // Cost from start to this node
  h: number = 0 // Heuristic cost to goal
  f: number = 0 // Total cost (g + h)
  parent: PathNode | null = null
  walkable: boolean = true

  constructor(x: number, y: number, walkable: boolean = true) {
    this.x = x
    this.y = y
    this.walkable = walkable
  }

  /**
   * Calculate heuristic (Manhattan distance)
   */
  calculateH(goal: PathNode): void {
    this.h = Math.abs(this.x - goal.x) + Math.abs(this.y - goal.y)
  }

  /**
   * Calculate total cost
   */
  calculateF(): void {
    this.f = this.g + this.h
  }

  /**
   * Check if this node equals another
   */
  equals(other: PathNode): boolean {
    return this.x === other.x && this.y === other.y
  }
}

/**
 * A* Pathfinding Algorithm
 */
export class AStar {
  private grid: PathNode[][]
  private gridWidth: number
  private gridHeight: number

  constructor(width: number, height: number) {
    this.gridWidth = width
    this.gridHeight = height
    this.grid = []
    this.initializeGrid()
  }

  /**
   * Initialize empty grid
   */
  private initializeGrid(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      const row: PathNode[] = []
      for (let x = 0; x < this.gridWidth; x++) {
        row.push(new PathNode(x, y, true))
      }
      this.grid.push(row)
    }
  }

  /**
   * Set a node as walkable or not
   */
  setWalkable(x: number, y: number, walkable: boolean): void {
    if (this.isInBounds(x, y)) {
      this.grid[y][x].walkable = walkable
    }
  }

  /**
   * Get node at position
   */
  getNode(x: number, y: number): PathNode | null {
    if (this.isInBounds(x, y)) {
      return this.grid[y][x]
    }
    return null
  }

  /**
   * Check if coordinates are within grid bounds
   */
  private isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight
  }

  /**
   * Get neighbors of a node (4-directional)
   */
  private getNeighbors(node: PathNode): PathNode[] {
    const neighbors: PathNode[] = []
    const directions = [
      { x: 0, y: -1 },  // North
      { x: 1, y: 0 },   // East
      { x: 0, y: 1 },   // South
      { x: -1, y: 0 },  // West
      { x: -1, y: -1 }, // Northwest
      { x: 1, y: -1 },  // Northeast
      { x: 1, y: 1 },   // Southeast
      { x: -1, y: 1 }   // Southwest
    ]

    for (const dir of directions) {
      const x = node.x + dir.x
      const y = node.y + dir.y

      if (this.isInBounds(x, y)) {
        const neighbor = this.grid[y][x]
        if (neighbor.walkable) {
          neighbors.push(neighbor)
        }
      }
    }

    return neighbors
  }

  /**
   * Calculate movement cost between two adjacent nodes
   */
  private getMovementCost(from: PathNode, to: PathNode): number {
    // Diagonal movement costs more (sqrt(2) ≈ 1.414)
    const dx = Math.abs(to.x - from.x)
    const dy = Math.abs(to.y - from.y)
    return dx + dy === 2 ? 1.414 : 1
  }

  /**
   * Find path using A* algorithm
   */
  findPath(start: Position, goal: Position): Position[] {
    // Convert world positions to grid coordinates
    const startNode = this.getNode(Math.floor(start.x), Math.floor(start.z || 0))
    const goalNode = this.getNode(Math.floor(goal.x), Math.floor(goal.z || 0))

    if (!startNode || !goalNode || !startNode.walkable || !goalNode.walkable) {
      return []
    }

    // Reset all nodes
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].g = 0
        this.grid[y][x].h = 0
        this.grid[y][x].f = 0
        this.grid[y][x].parent = null
      }
    }

    const openList: PathNode[] = []
    const closedList: Set<string> = new Set()

    // Add start node to open list
    startNode.g = 0
    startNode.calculateH(goalNode)
    startNode.calculateF()
    openList.push(startNode)

    while (openList.length > 0) {
      // Find node with lowest f cost
      let currentIndex = 0
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i
        }
      }
      const current = openList[currentIndex]

      // Goal reached
      if (current.equals(goalNode)) {
        return this.reconstructPath(current)
      }

      // Move current from open to closed
      openList.splice(currentIndex, 1)
      closedList.add(`${current.x},${current.y}`)

      // Check all neighbors
      const neighbors = this.getNeighbors(current)
      for (const neighbor of neighbors) {
        // Skip if already evaluated
        if (closedList.has(`${neighbor.x},${neighbor.y}`)) {
          continue
        }

        // Calculate tentative g cost
        const tentativeG = current.g + this.getMovementCost(current, neighbor)

        // Check if this path is better
        const inOpenList = openList.includes(neighbor)
        if (!inOpenList || tentativeG < neighbor.g) {
          neighbor.parent = current
          neighbor.g = tentativeG
          neighbor.calculateH(goalNode)
          neighbor.calculateF()

          if (!inOpenList) {
            openList.push(neighbor)
          }
        }
      }
    }

    // No path found
    return []
  }

  /**
   * Reconstruct path from goal to start
   */
  private reconstructPath(goalNode: PathNode): Position[] {
    const path: Position[] = []
    let current: PathNode | null = goalNode

    while (current !== null) {
      // Convert grid coordinates back to world positions
      path.unshift({
        x: current.x + 0.5, // Center of cell
        y: 0,
        z: current.y + 0.5
      })
      current = current.parent
    }

    // Remove start position (unit is already there)
    if (path.length > 1) {
      path.shift()
    }

    return path
  }

  /**
   * Clear all obstacles
   */
  clearObstacles(): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.grid[y][x].walkable = true
      }
    }
  }

  /**
   * Set rectangular area as obstacle
   */
  setObstacleRect(x: number, y: number, width: number, height: number): void {
    for (let dy = 0; dy < height; dy++) {
      for (let dx = 0; dx < width; dx++) {
        this.setWalkable(x + dx, y + dy, false)
      }
    }
  }
}
