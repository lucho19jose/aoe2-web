import type { Position } from '@/types/game'
import init, {
  NavigationGrid as WasmNavigationGrid,
  Position as WasmPosition,
  get_version,
  log as wasmLog,
  benchmark_pathfinding,
  AIManager,
  AIDifficulty
} from '@/wasm/game_engine'

/**
 * WASM-powered pathfinding system
 * High-performance A* implementation in Rust
 */
export class WasmPathfindingSystem {
  private grid: WasmNavigationGrid | null = null
  private initialized = false
  private aiManager: AIManager | null = null

  /**
   * Initialize WASM module
   */
  async init(gridWidth: number = 100, gridHeight: number = 100): Promise<void> {
    if (this.initialized) return

    try {
      // Initialize WASM module
      await init()

      // Create navigation grid
      this.grid = new WasmNavigationGrid(gridWidth, gridHeight)

      // Create AI manager
      this.aiManager = new AIManager()

      this.initialized = true

      const version = get_version()
      console.log(`✅ WASM Game Engine initialized (v${version})`)
      wasmLog('Pathfinding system ready')
    } catch (error) {
      console.error('❌ Failed to initialize WASM:', error)
      throw error
    }
  }

  /**
   * Check if WASM is initialized
   */
  isInitialized(): boolean {
    return this.initialized && this.grid !== null
  }

  /**
   * Find path using WASM A*
   */
  findPath(start: Position, goal: Position): Position[] {
    if (!this.grid) {
      console.warn('WASM not initialized, cannot find path')
      return []
    }

    try {
      const startX = Math.floor(start.x)
      const startZ = Math.floor(start.z || 0)
      const goalX = Math.floor(goal.x)
      const goalZ = Math.floor(goal.z || 0)

      // Call WASM pathfinding
      const wasmPath = this.grid.find_path(startX, startZ, goalX, goalZ)

      // Convert WASM positions to game positions
      const path: Position[] = []
      for (const pos of wasmPath) {
        path.push({
          x: pos.x + 0.5, // Center of cell
          y: 0,
          z: pos.z + 0.5
        })
      }

      return path
    } catch (error) {
      console.error('Error in WASM pathfinding:', error)
      return []
    }
  }

  /**
   * Set obstacle at position
   */
  addObstacle(position: Position, width: number = 1, height: number = 1): void {
    if (!this.grid) return

    const x = Math.floor(position.x)
    const z = Math.floor(position.z || 0)

    this.grid.set_obstacle_rect(x, z, width, height)
  }

  /**
   * Remove obstacle at position
   */
  removeObstacle(position: Position, width: number = 1, height: number = 1): void {
    if (!this.grid) return

    const x = Math.floor(position.x)
    const z = Math.floor(position.z || 0)

    // Mark cells as walkable
    for (let dz = 0; dz < height; dz++) {
      for (let dx = 0; dx < width; dx++) {
        this.grid.set_walkable(x + dx, z + dz, true)
      }
    }
  }

  /**
   * Check if position is walkable
   */
  isWalkable(position: Position): boolean {
    if (!this.grid) return true

    const x = Math.floor(position.x)
    const z = Math.floor(position.z || 0)

    return this.grid.is_walkable(x, z)
  }

  /**
   * Clear all obstacles
   */
  clearObstacles(): void {
    if (!this.grid) return
    this.grid.clear_obstacles()
  }

  /**
   * Benchmark pathfinding performance
   */
  async benchmark(gridSize: number = 100, iterations: number = 100): Promise<number> {
    if (!this.initialized) {
      await this.init(gridSize, gridSize)
    }

    const timeMs = benchmark_pathfinding(gridSize, iterations)
    const avgMs = timeMs / iterations

    console.log(`🚀 WASM Pathfinding Benchmark:`)
    console.log(`   Grid: ${gridSize}x${gridSize}`)
    console.log(`   Iterations: ${iterations}`)
    console.log(`   Total time: ${timeMs.toFixed(2)}ms`)
    console.log(`   Average: ${avgMs.toFixed(4)}ms per path`)

    return avgMs
  }

  /**
   * Add AI player
   */
  addAIPlayer(playerId: string, difficulty: 'easy' | 'medium' | 'hard'): void {
    if (!this.aiManager) return

    let aiDifficulty: AIDifficulty
    switch (difficulty) {
      case 'easy':
        aiDifficulty = AIDifficulty.Easy
        break
      case 'medium':
        aiDifficulty = AIDifficulty.Medium
        break
      case 'hard':
        aiDifficulty = AIDifficulty.Hard
        break
      default:
        aiDifficulty = AIDifficulty.Medium
    }

    this.aiManager.add_ai_player(playerId, aiDifficulty)
    console.log(`🤖 Added AI player ${playerId} with ${difficulty} difficulty`)
  }

  /**
   * Update AI (call every frame/tick)
   */
  updateAI(deltaTime: number, gameState: any): any {
    if (!this.aiManager) return []

    try {
      const actionsJson = this.aiManager.update_all(deltaTime, gameState)
      return JSON.parse(actionsJson)
    } catch (error) {
      console.error('Error updating AI:', error)
      return []
    }
  }

  /**
   * Get number of AI players
   */
  getAICount(): number {
    return this.aiManager?.get_ai_count() || 0
  }

  /**
   * Clear all AI players
   */
  clearAI(): void {
    this.aiManager?.clear()
  }

  /**
   * Get grid dimensions
   */
  getGridSize(): { width: number; height: number } {
    if (!this.grid) return { width: 0, height: 0 }

    return {
      width: this.grid.get_width(),
      height: this.grid.get_height()
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.grid = null
    this.aiManager = null
    this.initialized = false
  }
}

// Singleton instance
let wasmPathfinding: WasmPathfindingSystem | null = null

/**
 * Get or create WASM pathfinding instance
 */
export function getWasmPathfinding(): WasmPathfindingSystem {
  if (!wasmPathfinding) {
    wasmPathfinding = new WasmPathfindingSystem()
  }
  return wasmPathfinding
}

/**
 * Initialize WASM pathfinding system
 */
export async function initWasmPathfinding(width: number = 100, height: number = 100): Promise<WasmPathfindingSystem> {
  const system = getWasmPathfinding()
  await system.init(width, height)
  return system
}
