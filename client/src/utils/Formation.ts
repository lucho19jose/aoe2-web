import type { Position } from '@/types/game'
import * as THREE from 'three'

export enum FormationType {
  Line = 'line',           // Horizontal line
  Column = 'column',       // Vertical column
  Box = 'box',            // Square/Box formation
  Wedge = 'wedge',        // V formation (wedge)
  Scattered = 'scattered' // Random scattered (default)
}

/**
 * Formation system for organizing multiple units
 */
export class Formation {
  /**
   * Calculate formation positions for multiple units
   * @param centerPosition The center point of the formation
   * @param formationType Type of formation
   * @param unitCount Number of units in formation
   * @param spacing Space between units
   * @param facing Direction the formation faces (in radians)
   * @returns Array of positions for each unit
   */
  public static calculatePositions(
    centerPosition: Position,
    formationType: FormationType,
    unitCount: number,
    spacing: number = 2,
    facing: number = 0
  ): Position[] {
    const positions: Position[] = []

    switch (formationType) {
      case FormationType.Line:
        positions.push(...this.calculateLineFormation(centerPosition, unitCount, spacing, facing))
        break

      case FormationType.Column:
        positions.push(...this.calculateColumnFormation(centerPosition, unitCount, spacing, facing))
        break

      case FormationType.Box:
        positions.push(...this.calculateBoxFormation(centerPosition, unitCount, spacing))
        break

      case FormationType.Wedge:
        positions.push(...this.calculateWedgeFormation(centerPosition, unitCount, spacing, facing))
        break

      case FormationType.Scattered:
      default:
        positions.push(...this.calculateScatteredFormation(centerPosition, unitCount, spacing))
        break
    }

    return positions
  }

  /**
   * Line formation - horizontal line
   */
  private static calculateLineFormation(
    center: Position,
    count: number,
    spacing: number,
    facing: number
  ): Position[] {
    const positions: Position[] = []
    const halfWidth = (count - 1) * spacing / 2

    for (let i = 0; i < count; i++) {
      const offset = i * spacing - halfWidth

      // Apply rotation based on facing
      const x = center.x + offset * Math.cos(facing + Math.PI / 2)
      const z = center.z + offset * Math.sin(facing + Math.PI / 2)

      positions.push({ x, y: 0, z })
    }

    return positions
  }

  /**
   * Column formation - vertical column
   */
  private static calculateColumnFormation(
    center: Position,
    count: number,
    spacing: number,
    facing: number
  ): Position[] {
    const positions: Position[] = []
    const halfDepth = (count - 1) * spacing / 2

    for (let i = 0; i < count; i++) {
      const offset = i * spacing - halfDepth

      // Apply rotation based on facing
      const x = center.x + offset * Math.cos(facing)
      const z = center.z + offset * Math.sin(facing)

      positions.push({ x, y: 0, z })
    }

    return positions
  }

  /**
   * Box formation - square/rectangular grid
   */
  private static calculateBoxFormation(
    center: Position,
    count: number,
    spacing: number
  ): Position[] {
    const positions: Position[] = []

    // Calculate grid dimensions (approximate square)
    const cols = Math.ceil(Math.sqrt(count))
    const rows = Math.ceil(count / cols)

    const halfWidth = (cols - 1) * spacing / 2
    const halfDepth = (rows - 1) * spacing / 2

    let unitIndex = 0
    for (let row = 0; row < rows && unitIndex < count; row++) {
      for (let col = 0; col < cols && unitIndex < count; col++) {
        const x = center.x + (col * spacing - halfWidth)
        const z = center.z + (row * spacing - halfDepth)

        positions.push({ x, y: 0, z })
        unitIndex++
      }
    }

    return positions
  }

  /**
   * Wedge formation - V shape (good for attacks)
   */
  private static calculateWedgeFormation(
    center: Position,
    count: number,
    spacing: number,
    facing: number
  ): Position[] {
    const positions: Position[] = []

    // First unit at the tip
    positions.push({ x: center.x, y: 0, z: center.z })

    let remaining = count - 1
    let row = 1

    while (remaining > 0) {
      const unitsInRow = Math.min(remaining, row * 2)
      const halfWidth = unitsInRow * spacing / 2

      for (let i = 0; i < unitsInRow && remaining > 0; i++) {
        const offset = i * spacing - halfWidth
        const depth = row * spacing

        // Apply rotation based on facing
        const x = center.x + offset * Math.cos(facing + Math.PI / 2) - depth * Math.cos(facing)
        const z = center.z + offset * Math.sin(facing + Math.PI / 2) - depth * Math.sin(facing)

        positions.push({ x, y: 0, z })
        remaining--
      }

      row++
    }

    return positions
  }

  /**
   * Scattered formation - random positions around center
   */
  private static calculateScatteredFormation(
    center: Position,
    count: number,
    spacing: number
  ): Position[] {
    const positions: Position[] = []
    const radius = spacing * Math.sqrt(count)

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * radius

      const x = center.x + Math.cos(angle) * distance
      const z = center.z + Math.sin(angle) * distance

      positions.push({ x, y: 0, z })
    }

    return positions
  }

  /**
   * Calculate facing direction from one position to another
   */
  public static calculateFacing(from: Position, to: Position): number {
    const dx = to.x - from.x
    const dz = to.z - from.z
    return Math.atan2(dz, dx)
  }

  /**
   * Get spacing based on formation type
   */
  public static getDefaultSpacing(formationType: FormationType): number {
    switch (formationType) {
      case FormationType.Line:
        return 1.5
      case FormationType.Column:
        return 2.0
      case FormationType.Box:
        return 2.0
      case FormationType.Wedge:
        return 2.5
      case FormationType.Scattered:
        return 1.5
      default:
        return 2.0
    }
  }
}
