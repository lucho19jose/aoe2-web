import type { Position, Resources, Unit, Building } from '@/types/game'
import { UNIT_TYPES, BUILDING_TYPES } from '@/config/gameConfig'

/**
 * Utility functions for game calculations
 */

// ========== Distance & Position Calculations ==========

export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dy = (pos2.y || 0) - (pos1.y || 0)
  const dz = (pos2.z || 0) - (pos1.z || 0)
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

export function calculateDistance2D(pos1: Position, pos2: Position): number {
  const dx = pos2.x - pos1.x
  const dz = (pos2.z || 0) - (pos1.z || 0)
  return Math.sqrt(dx * dx + dz * dz)
}

export function isWithinRange(pos1: Position, pos2: Position, range: number): boolean {
  return calculateDistance(pos1, pos2) <= range
}

export function normalizeVector(x: number, y: number, z: number = 0): { x: number; y: number; z: number } {
  const length = Math.sqrt(x * x + y * y + z * z)
  if (length === 0) return { x: 0, y: 0, z: 0 }
  return {
    x: x / length,
    y: y / length,
    z: z / length,
  }
}

export function interpolatePosition(from: Position, to: Position, t: number): Position {
  return {
    x: from.x + (to.x - from.x) * t,
    y: (from.y || 0) + ((to.y || 0) - (from.y || 0)) * t,
    z: (from.z || 0) + ((to.z || 0) - (from.z || 0)) * t,
  }
}

// ========== Collision Detection ==========

export function checkCircleCollision(
  pos1: Position,
  radius1: number,
  pos2: Position,
  radius2: number
): boolean {
  const distance = calculateDistance2D(pos1, pos2)
  return distance < radius1 + radius2
}

export function checkBoxCollision(
  pos1: Position,
  size1: { width: number; height: number },
  pos2: Position,
  size2: { width: number; height: number }
): boolean {
  const halfWidth1 = size1.width / 2
  const halfHeight1 = size1.height / 2
  const halfWidth2 = size2.width / 2
  const halfHeight2 = size2.height / 2

  return (
    Math.abs(pos1.x - pos2.x) < halfWidth1 + halfWidth2 &&
    Math.abs((pos1.z || 0) - (pos2.z || 0)) < halfHeight1 + halfHeight2
  )
}

export function isPositionValid(
  position: Position,
  size: { width: number; height: number },
  existingBuildings: Building[],
  mapSize: number = 100
): boolean {
  // Check map bounds
  const halfWidth = size.width / 2
  const halfHeight = size.height / 2

  if (
    position.x - halfWidth < -mapSize / 2 ||
    position.x + halfWidth > mapSize / 2 ||
    (position.z || 0) - halfHeight < -mapSize / 2 ||
    (position.z || 0) + halfHeight > mapSize / 2
  ) {
    return false
  }

  // Check collision with existing buildings
  for (const building of existingBuildings) {
    if (checkBoxCollision(position, size, building.position, building.size)) {
      return false
    }
  }

  return true
}

// ========== Resource Calculations ==========

export function canAfford(available: Resources, cost: Partial<Resources>): boolean {
  return (
    (available.food >= (cost.food || 0)) &&
    (available.wood >= (cost.wood || 0)) &&
    (available.gold >= (cost.gold || 0)) &&
    (available.stone >= (cost.stone || 0))
  )
}

export function subtractResources(resources: Resources, cost: Partial<Resources>): Resources {
  return {
    food: resources.food - (cost.food || 0),
    wood: resources.wood - (cost.wood || 0),
    gold: resources.gold - (cost.gold || 0),
    stone: resources.stone - (cost.stone || 0),
  }
}

export function addResources(resources: Resources, amount: Partial<Resources>): Resources {
  return {
    food: resources.food + (amount.food || 0),
    wood: resources.wood + (amount.wood || 0),
    gold: resources.gold + (amount.gold || 0),
    stone: resources.stone + (amount.stone || 0),
  }
}

export function getUnitCost(unitType: string): Partial<Resources> {
  const config = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
  return config?.cost || {}
}

export function getBuildingCost(buildingType: string): Partial<Resources> {
  const config = BUILDING_TYPES[buildingType.toUpperCase() as keyof typeof BUILDING_TYPES]
  return config?.cost || {}
}

// ========== Combat Calculations ==========

export function calculateDamage(attacker: Unit, defender: Unit): number {
  const baseDamage = attacker.attack
  const actualDamage = Math.max(1, baseDamage - defender.defense)
  return actualDamage
}

export function calculateAttackTime(attacker: Unit): number {
  // Time in seconds between attacks
  return 2 // Default 2 seconds, can be made configurable
}

export function isInAttackRange(attacker: Unit, target: Unit | Building, attackRange: number): boolean {
  return isWithinRange(attacker.position, target.position, attackRange)
}

// ========== Unit Selection ==========

export function getUnitsInBox(
  units: Unit[],
  boxStart: Position,
  boxEnd: Position
): Unit[] {
  const minX = Math.min(boxStart.x, boxEnd.x)
  const maxX = Math.max(boxStart.x, boxEnd.x)
  const minZ = Math.min(boxStart.z || 0, boxEnd.z || 0)
  const maxZ = Math.max(boxStart.z || 0, boxEnd.z || 0)

  return units.filter((unit) => {
    const pos = unit.position
    return (
      pos.x >= minX &&
      pos.x <= maxX &&
      (pos.z || 0) >= minZ &&
      (pos.z || 0) <= maxZ
    )
  })
}

export function findNearestUnit(from: Position, units: Unit[], maxRange?: number): Unit | null {
  let nearest: Unit | null = null
  let minDistance = maxRange || Infinity

  for (const unit of units) {
    const distance = calculateDistance(from, unit.position)
    if (distance < minDistance) {
      minDistance = distance
      nearest = unit
    }
  }

  return nearest
}

export function findNearestBuilding(
  from: Position,
  buildings: Building[],
  maxRange?: number
): Building | null {
  let nearest: Building | null = null
  let minDistance = maxRange || Infinity

  for (const building of buildings) {
    const distance = calculateDistance(from, building.position)
    if (distance < minDistance) {
      minDistance = distance
      nearest = building
    }
  }

  return nearest
}

// ========== Formation & Movement ==========

export function calculateFormationPositions(
  centerPosition: Position,
  unitCount: number,
  spacing: number = 2
): Position[] {
  const positions: Position[] = []
  const rows = Math.ceil(Math.sqrt(unitCount))
  const cols = Math.ceil(unitCount / rows)

  for (let i = 0; i < unitCount; i++) {
    const row = Math.floor(i / cols)
    const col = i % cols

    const offsetX = (col - (cols - 1) / 2) * spacing
    const offsetZ = (row - (rows - 1) / 2) * spacing

    positions.push({
      x: centerPosition.x + offsetX,
      y: centerPosition.y || 0,
      z: (centerPosition.z || 0) + offsetZ,
    })
  }

  return positions
}

// ========== Time & Game State ==========

export function formatGameTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function calculateBuildProgress(elapsedTime: number, buildTime: number): number {
  return Math.min(1, elapsedTime / buildTime)
}

// ========== Population ==========

export function calculatePopulationCapacity(buildings: Building[]): number {
  let capacity = 0

  for (const building of buildings) {
    if (building.type === 'house' && building.isComplete) {
      capacity += 5 // Each house provides 5 population
    } else if (building.type === 'town_center' && building.isComplete) {
      capacity += 10 // Town center provides 10 population
    }
  }

  return capacity
}

export function hasPopulationSpace(currentPopulation: number, maxPopulation: number): boolean {
  return currentPopulation < maxPopulation
}

// ========== Grid & Pathfinding Helpers ==========

export function positionToGridCoords(
  position: Position,
  gridSize: number
): { x: number; y: number } {
  return {
    x: Math.floor(position.x / gridSize),
    y: Math.floor((position.z || 0) / gridSize),
  }
}

export function gridCoordsToPosition(
  gridX: number,
  gridY: number,
  gridSize: number
): Position {
  return {
    x: gridX * gridSize + gridSize / 2,
    y: 0,
    z: gridY * gridSize + gridSize / 2,
  }
}

export function getManhattanDistance(
  grid1: { x: number; y: number },
  grid2: { x: number; y: number }
): number {
  return Math.abs(grid1.x - grid2.x) + Math.abs(grid1.y - grid2.y)
}

// ========== Color Utilities ==========

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('')
}

// ========== Random Utilities ==========

export function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

export function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1))
}

export function randomPosition(mapSize: number): Position {
  return {
    x: randomInRange(-mapSize / 2, mapSize / 2),
    y: 0,
    z: randomInRange(-mapSize / 2, mapSize / 2),
  }
}

// ========== Validation ==========

export function isValidPosition(position: Position): boolean {
  return (
    typeof position.x === 'number' &&
    !isNaN(position.x) &&
    typeof position.z === 'number' &&
    !isNaN(position.z)
  )
}

export function clampPosition(position: Position, mapSize: number): Position {
  return {
    x: Math.max(-mapSize / 2, Math.min(mapSize / 2, position.x)),
    y: position.y || 0,
    z: Math.max(-mapSize / 2, Math.min(mapSize / 2, position.z || 0)),
  }
}
