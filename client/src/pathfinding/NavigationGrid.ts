import { AStar } from './AStar'
import type { Position } from '@/types/game'
import * as THREE from 'three'

/**
 * Navigation Grid Manager
 * Manages the navigation grid for pathfinding
 */
export class NavigationGrid {
  private aStar: AStar
  private gridSize: number
  private cellSize: number
  private obstacles: Set<string> = new Set()

  constructor(gridSize: number = 100, cellSize: number = 1) {
    this.gridSize = gridSize
    this.cellSize = cellSize
    this.aStar = new AStar(gridSize, gridSize)
  }

  /**
   * Find path between two world positions
   */
  findPath(start: Position, goal: Position): Position[] {
    return this.aStar.findPath(start, goal)
  }

  /**
   * Add obstacle at world position
   */
  addObstacle(position: Position, size: number = 1): void {
    const gridX = Math.floor(position.x / this.cellSize)
    const gridY = Math.floor((position.z || 0) / this.cellSize)
    const gridSize = Math.ceil(size / this.cellSize)

    for (let dy = 0; dy < gridSize; dy++) {
      for (let dx = 0; dx < gridSize; dx++) {
        const x = gridX + dx
        const y = gridY + dy
        this.aStar.setWalkable(x, y, false)
        this.obstacles.add(`${x},${y}`)
      }
    }
  }

  /**
   * Remove obstacle at world position
   */
  removeObstacle(position: Position, size: number = 1): void {
    const gridX = Math.floor(position.x / this.cellSize)
    const gridY = Math.floor((position.z || 0) / this.cellSize)
    const gridSize = Math.ceil(size / this.cellSize)

    for (let dy = 0; dy < gridSize; dy++) {
      for (let dx = 0; dx < gridSize; dx++) {
        const x = gridX + dx
        const y = gridY + dy
        this.aStar.setWalkable(x, y, true)
        this.obstacles.delete(`${x},${y}`)
      }
    }
  }

  /**
   * Add circular obstacle
   */
  addCircularObstacle(position: Position, radius: number): void {
    const centerX = Math.floor(position.x / this.cellSize)
    const centerY = Math.floor((position.z || 0) / this.cellSize)
    const gridRadius = Math.ceil(radius / this.cellSize)

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const distance = Math.sqrt(dx * dx + dy * dy)
        if (distance <= gridRadius) {
          const x = centerX + dx
          const y = centerY + dy
          this.aStar.setWalkable(x, y, false)
          this.obstacles.add(`${x},${y}`)
        }
      }
    }
  }

  /**
   * Add rectangular obstacle
   */
  addRectObstacle(position: Position, width: number, height: number): void {
    const gridX = Math.floor(position.x / this.cellSize)
    const gridY = Math.floor((position.z || 0) / this.cellSize)
    const gridWidth = Math.ceil(width / this.cellSize)
    const gridHeight = Math.ceil(height / this.cellSize)

    this.aStar.setObstacleRect(gridX, gridY, gridWidth, gridHeight)

    for (let dy = 0; dy < gridHeight; dy++) {
      for (let dx = 0; dx < gridWidth; dx++) {
        this.obstacles.add(`${gridX + dx},${gridY + dy}`)
      }
    }
  }

  /**
   * Check if position is walkable
   */
  isWalkable(position: Position): boolean {
    const gridX = Math.floor(position.x / this.cellSize)
    const gridY = Math.floor((position.z || 0) / this.cellSize)
    const node = this.aStar.getNode(gridX, gridY)
    return node ? node.walkable : false
  }

  /**
   * Clear all obstacles
   */
  clearObstacles(): void {
    this.aStar.clearObstacles()
    this.obstacles.clear()
  }

  /**
   * Get grid size
   */
  getGridSize(): number {
    return this.gridSize
  }

  /**
   * Get cell size
   */
  getCellSize(): number {
    return this.cellSize
  }

  /**
   * Visualize grid (for debugging)
   */
  createDebugVisualization(scene: THREE.Scene): THREE.Group {
    const debugGroup = new THREE.Group()
    debugGroup.name = 'NavigationGridDebug'

    // Create grid helper
    const gridHelper = new THREE.GridHelper(
      this.gridSize,
      this.gridSize,
      0x888888,
      0x444444
    )
    gridHelper.position.y = 0.01
    debugGroup.add(gridHelper)

    // Visualize obstacles
    const obstacleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.3
    })

    for (const obstacleKey of this.obstacles) {
      const [x, y] = obstacleKey.split(',').map(Number)
      const geometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize)
      const mesh = new THREE.Mesh(geometry, obstacleMaterial)
      mesh.rotation.x = -Math.PI / 2
      mesh.position.set(x * this.cellSize + 0.5, 0.02, y * this.cellSize + 0.5)
      debugGroup.add(mesh)
    }

    scene.add(debugGroup)
    return debugGroup
  }

  /**
   * Visualize path (for debugging)
   */
  visualizePath(scene: THREE.Scene, path: Position[]): THREE.Line {
    const points: THREE.Vector3[] = []

    for (const pos of path) {
      points.push(new THREE.Vector3(pos.x, 0.1, pos.z || 0))
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 3
    })

    const line = new THREE.Line(geometry, material)
    line.name = 'PathVisualization'
    scene.add(line)

    return line
  }
}
