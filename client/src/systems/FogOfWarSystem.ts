import * as THREE from 'three'
import type { Position } from '@/types/game'
import { Unit } from '@/entities/Unit'
import { Building } from '@/entities/Building'
import { positionToGridCoords } from '@/utils/gameUtils'

/**
 * Fog of War system - manages visibility on the map
 */

export enum VisibilityState {
  UNEXPLORED = 0,  // Never seen (black)
  EXPLORED = 1,     // Seen before but not currently visible (dark)
  VISIBLE = 2,      // Currently visible (clear)
}

export class FogOfWarSystem {
  private mapSize: number
  private gridSize: number
  private gridWidth: number
  private gridHeight: number
  private visibilityGrid: VisibilityState[][]
  private fogMesh: THREE.Mesh | null = null
  private fogTexture: THREE.DataTexture | null = null
  private textureData: Uint8Array | null = null
  private scene: THREE.Scene | null = null

  constructor(mapSize: number = 100, gridSize: number = 2) {
    this.mapSize = mapSize
    this.gridSize = gridSize
    this.gridWidth = Math.ceil(mapSize / gridSize)
    this.gridHeight = Math.ceil(mapSize / gridSize)

    // Initialize visibility grid (all unexplored)
    this.visibilityGrid = []
    for (let y = 0; y < this.gridHeight; y++) {
      this.visibilityGrid[y] = []
      for (let x = 0; x < this.gridWidth; x++) {
        this.visibilityGrid[y][x] = VisibilityState.UNEXPLORED
      }
    }
  }

  /**
   * Initialize fog of war rendering
   */
  public initialize(scene: THREE.Scene) {
    this.scene = scene

    // Create texture for fog
    const size = this.gridWidth * this.gridHeight
    this.textureData = new Uint8Array(size * 4) // RGBA

    // Initialize all black (unexplored)
    for (let i = 0; i < size; i++) {
      this.textureData[i * 4] = 0     // R
      this.textureData[i * 4 + 1] = 0 // G
      this.textureData[i * 4 + 2] = 0 // B
      this.textureData[i * 4 + 3] = 255 // A (fully opaque)
    }

    this.fogTexture = new THREE.DataTexture(
      this.textureData,
      this.gridWidth,
      this.gridHeight,
      THREE.RGBAFormat
    )
    this.fogTexture.needsUpdate = true

    // Create fog plane
    const geometry = new THREE.PlaneGeometry(this.mapSize, this.mapSize)
    const material = new THREE.MeshBasicMaterial({
      map: this.fogTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
    })

    this.fogMesh = new THREE.Mesh(geometry, material)
    this.fogMesh.rotation.x = -Math.PI / 2
    this.fogMesh.position.y = 0.2 // Slightly above ground
    this.fogMesh.renderOrder = 1000 // Render last

    scene.add(this.fogMesh)
  }

  /**
   * Update fog of war based on unit/building positions
   */
  public update(units: Unit[], buildings: Building[], playerId: string) {
    // First, decay all visible cells to explored
    this.decayVisibility()

    // Update visibility for player units
    units.forEach((unit) => {
      if (unit.ownerId === playerId) {
        this.revealArea(unit.position, this.getVisionRange(unit))
      }
    })

    // Update visibility for player buildings
    buildings.forEach((building) => {
      if (building.ownerId === playerId) {
        this.revealArea(building.position, this.getVisionRange(building))
      }
    })

    // Update fog texture
    this.updateTexture()
  }

  /**
   * Decay visible cells to explored
   */
  private decayVisibility() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (this.visibilityGrid[y][x] === VisibilityState.VISIBLE) {
          this.visibilityGrid[y][x] = VisibilityState.EXPLORED
        }
      }
    }
  }

  /**
   * Reveal area around a position
   */
  public revealArea(position: Position, radius: number) {
    const centerGrid = positionToGridCoords(position, this.gridSize)
    const gridRadius = Math.ceil(radius / this.gridSize)

    for (let dy = -gridRadius; dy <= gridRadius; dy++) {
      for (let dx = -gridRadius; dx <= gridRadius; dx++) {
        const x = centerGrid.x + dx
        const y = centerGrid.y + dy

        if (this.isValidGridCoord(x, y)) {
          // Check if within circular radius
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance <= gridRadius) {
            this.visibilityGrid[y][x] = VisibilityState.VISIBLE
          }
        }
      }
    }
  }

  /**
   * Update the fog texture
   */
  private updateTexture() {
    if (!this.textureData || !this.fogTexture) return

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const index = (y * this.gridWidth + x) * 4
        const state = this.visibilityGrid[y][x]

        switch (state) {
          case VisibilityState.UNEXPLORED:
            // Black, fully opaque
            this.textureData[index] = 0
            this.textureData[index + 1] = 0
            this.textureData[index + 2] = 0
            this.textureData[index + 3] = 255
            break

          case VisibilityState.EXPLORED:
            // Dark gray, semi-transparent
            this.textureData[index] = 30
            this.textureData[index + 1] = 30
            this.textureData[index + 2] = 30
            this.textureData[index + 3] = 180
            break

          case VisibilityState.VISIBLE:
            // Fully transparent
            this.textureData[index] = 0
            this.textureData[index + 1] = 0
            this.textureData[index + 2] = 0
            this.textureData[index + 3] = 0
            break
        }
      }
    }

    this.fogTexture.needsUpdate = true
  }

  /**
   * Check if a position is visible
   */
  public isVisible(position: Position): boolean {
    const gridCoords = positionToGridCoords(position, this.gridSize)
    if (!this.isValidGridCoord(gridCoords.x, gridCoords.y)) {
      return false
    }
    return this.visibilityGrid[gridCoords.y][gridCoords.x] === VisibilityState.VISIBLE
  }

  /**
   * Check if a position has been explored
   */
  public isExplored(position: Position): boolean {
    const gridCoords = positionToGridCoords(position, this.gridSize)
    if (!this.isValidGridCoord(gridCoords.x, gridCoords.y)) {
      return false
    }
    return this.visibilityGrid[gridCoords.y][gridCoords.x] !== VisibilityState.UNEXPLORED
  }

  /**
   * Get visibility state at position
   */
  public getVisibilityState(position: Position): VisibilityState {
    const gridCoords = positionToGridCoords(position, this.gridSize)
    if (!this.isValidGridCoord(gridCoords.x, gridCoords.y)) {
      return VisibilityState.UNEXPLORED
    }
    return this.visibilityGrid[gridCoords.y][gridCoords.x]
  }

  /**
   * Get vision range for a unit or building
   */
  private getVisionRange(entity: Unit | Building): number {
    if (entity instanceof Building) {
      return 15 // Buildings have fixed vision range
    }

    // Units have different vision ranges
    switch (entity.type) {
      case 'scout':
        return 12
      case 'archer':
        return 10
      default:
        return 8
    }
  }

  private isValidGridCoord(x: number, y: number): boolean {
    return x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight
  }

  /**
   * Enable or disable fog of war rendering
   */
  public setEnabled(enabled: boolean) {
    if (this.fogMesh) {
      this.fogMesh.visible = enabled
    }
  }

  /**
   * Set fog opacity
   */
  public setOpacity(opacity: number) {
    if (this.fogMesh) {
      const material = this.fogMesh.material as THREE.MeshBasicMaterial
      material.opacity = opacity
    }
  }

  /**
   * Reveal entire map (for debugging or observer mode)
   */
  public revealAll() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.visibilityGrid[y][x] = VisibilityState.VISIBLE
      }
    }
    this.updateTexture()
  }

  /**
   * Hide entire map
   */
  public hideAll() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.visibilityGrid[y][x] = VisibilityState.UNEXPLORED
      }
    }
    this.updateTexture()
  }

  /**
   * Get fog statistics
   */
  public getFogStats(): {
    total: number
    unexplored: number
    explored: number
    visible: number
    percentExplored: number
  } {
    const stats = {
      total: this.gridWidth * this.gridHeight,
      unexplored: 0,
      explored: 0,
      visible: 0,
      percentExplored: 0,
    }

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const state = this.visibilityGrid[y][x]
        if (state === VisibilityState.UNEXPLORED) stats.unexplored++
        else if (state === VisibilityState.EXPLORED) stats.explored++
        else if (state === VisibilityState.VISIBLE) stats.visible++
      }
    }

    stats.percentExplored = ((stats.explored + stats.visible) / stats.total) * 100

    return stats
  }

  /**
   * Clean up resources
   */
  public dispose() {
    if (this.fogMesh && this.scene) {
      this.scene.remove(this.fogMesh)
      this.fogMesh.geometry.dispose()
      ;(this.fogMesh.material as THREE.MeshBasicMaterial).dispose()
    }

    if (this.fogTexture) {
      this.fogTexture.dispose()
    }

    this.fogMesh = null
    this.fogTexture = null
    this.textureData = null
  }

  /**
   * Reset fog of war
   */
  public reset() {
    this.hideAll()
  }
}
