import type { Resources } from '@/types/game'

/**
 * Game Statistics Service
 * Tracks player performance and game metrics
 */
export interface PlayerStatistics {
  playerId: string
  playerName: string

  // Resources
  resourcesGathered: Resources
  resourcesSpent: Resources
  currentResources: Resources

  // Units
  unitsTrainedByType: Record<string, number>
  unitsKilledByType: Record<string, number>
  unitsLostByType: Record<string, number>
  totalUnitsTrained: number
  totalUnitsKilled: number
  totalUnitsLost: number
  currentUnits: number

  // Buildings
  buildingsBuilt: number
  buildingsLost: number
  currentBuildings: number

  // Technologies
  technologiesResearched: string[]

  // Military
  damageDealt: number
  damageTaken: number
  militaryScore: number

  // Economy
  economyScore: number

  // Time
  gameTime: number
  startTime: number
}

export class StatisticsService {
  private statistics: Map<string, PlayerStatistics> = new Map()

  constructor() {
    console.log('📊 Statistics Service initialized')
  }

  /**
   * Initialize statistics for a player
   */
  public initializePlayer(playerId: string, playerName: string) {
    this.statistics.set(playerId, {
      playerId,
      playerName,
      resourcesGathered: { food: 0, wood: 0, gold: 0, stone: 0 },
      resourcesSpent: { food: 0, wood: 0, gold: 0, stone: 0 },
      currentResources: { food: 0, wood: 0, gold: 0, stone: 0 },
      unitsTrainedByType: {},
      unitsKilledByType: {},
      unitsLostByType: {},
      totalUnitsTrained: 0,
      totalUnitsKilled: 0,
      totalUnitsLost: 0,
      currentUnits: 0,
      buildingsBuilt: 0,
      buildingsLost: 0,
      currentBuildings: 0,
      technologiesResearched: [],
      damageDealt: 0,
      damageTaken: 0,
      militaryScore: 0,
      economyScore: 0,
      gameTime: 0,
      startTime: Date.now()
    })
  }

  /**
   * Record resources gathered
   */
  public recordResourceGathered(playerId: string, resourceType: keyof Resources, amount: number) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.resourcesGathered[resourceType] += amount
      stats.currentResources[resourceType] += amount
      this.updateEconomyScore(playerId)
    }
  }

  /**
   * Record resources spent
   */
  public recordResourceSpent(playerId: string, resources: Partial<Resources>) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      for (const [resource, amount] of Object.entries(resources)) {
        if (amount) {
          const key = resource as keyof Resources
          stats.resourcesSpent[key] += amount
          stats.currentResources[key] -= amount
        }
      }
    }
  }

  /**
   * Record unit trained
   */
  public recordUnitTrained(playerId: string, unitType: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.unitsTrainedByType[unitType] = (stats.unitsTrainedByType[unitType] || 0) + 1
      stats.totalUnitsTrained++
      stats.currentUnits++
      this.updateMilitaryScore(playerId)
    }
  }

  /**
   * Record unit killed
   */
  public recordUnitKilled(playerId: string, unitType: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.unitsKilledByType[unitType] = (stats.unitsKilledByType[unitType] || 0) + 1
      stats.totalUnitsKilled++
      this.updateMilitaryScore(playerId)
    }
  }

  /**
   * Record unit lost
   */
  public recordUnitLost(playerId: string, unitType: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.unitsLostByType[unitType] = (stats.unitsLostByType[unitType] || 0) + 1
      stats.totalUnitsLost++
      stats.currentUnits--
    }
  }

  /**
   * Record building built
   */
  public recordBuildingBuilt(playerId: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.buildingsBuilt++
      stats.currentBuildings++
      this.updateEconomyScore(playerId)
    }
  }

  /**
   * Record building lost
   */
  public recordBuildingLost(playerId: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.buildingsLost++
      stats.currentBuildings--
    }
  }

  /**
   * Record technology researched
   */
  public recordTechnologyResearched(playerId: string, techId: string) {
    const stats = this.statistics.get(playerId)
    if (stats && !stats.technologiesResearched.includes(techId)) {
      stats.technologiesResearched.push(techId)
    }
  }

  /**
   * Record damage dealt
   */
  public recordDamageDealt(playerId: string, damage: number) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.damageDealt += damage
      this.updateMilitaryScore(playerId)
    }
  }

  /**
   * Record damage taken
   */
  public recordDamageTaken(playerId: string, damage: number) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.damageTaken += damage
    }
  }

  /**
   * Update game time
   */
  public updateGameTime(playerId: string, gameTime: number) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.gameTime = gameTime
    }
  }

  /**
   * Update military score
   */
  private updateMilitaryScore(playerId: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      stats.militaryScore =
        (stats.totalUnitsKilled * 10) +
        (stats.damageDealt / 10) -
        (stats.totalUnitsLost * 5)
    }
  }

  /**
   * Update economy score
   */
  private updateEconomyScore(playerId: string) {
    const stats = this.statistics.get(playerId)
    if (stats) {
      const totalGathered =
        stats.resourcesGathered.food +
        stats.resourcesGathered.wood +
        stats.resourcesGathered.gold +
        stats.resourcesGathered.stone

      stats.economyScore =
        totalGathered +
        (stats.buildingsBuilt * 100) +
        (stats.technologiesResearched.length * 200)
    }
  }

  /**
   * Get player statistics
   */
  public getPlayerStatistics(playerId: string): PlayerStatistics | undefined {
    return this.statistics.get(playerId)
  }

  /**
   * Get all statistics
   */
  public getAllStatistics(): PlayerStatistics[] {
    return Array.from(this.statistics.values())
  }

  /**
   * Calculate final score
   */
  public calculateFinalScore(playerId: string): number {
    const stats = this.statistics.get(playerId)
    if (!stats) return 0

    return stats.militaryScore + stats.economyScore
  }

  /**
   * Generate statistics summary
   */
  public generateSummary(playerId: string): string {
    const stats = this.statistics.get(playerId)
    if (!stats) return 'No statistics available'

    const totalResources =
      stats.resourcesGathered.food +
      stats.resourcesGathered.wood +
      stats.resourcesGathered.gold +
      stats.resourcesGathered.stone

    return `
🎮 Game Statistics for ${stats.playerName}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Game Time: ${Math.floor(stats.gameTime / 60)}m ${Math.floor(stats.gameTime % 60)}s

📊 Economy
  • Total Resources Gathered: ${totalResources}
    - Food: ${stats.resourcesGathered.food}
    - Wood: ${stats.resourcesGathered.wood}
    - Gold: ${stats.resourcesGathered.gold}
    - Stone: ${stats.resourcesGathered.stone}
  • Buildings Built: ${stats.buildingsBuilt}
  • Technologies Researched: ${stats.technologiesResearched.length}

⚔️  Military
  • Units Trained: ${stats.totalUnitsTrained}
  • Units Killed: ${stats.totalUnitsKilled}
  • Units Lost: ${stats.totalUnitsLost}
  • Damage Dealt: ${Math.floor(stats.damageDealt)}
  • Damage Taken: ${Math.floor(stats.damageTaken)}

🏆 Score
  • Military: ${Math.floor(stats.militaryScore)}
  • Economy: ${Math.floor(stats.economyScore)}
  • Total: ${this.calculateFinalScore(playerId)}
`
  }

  /**
   * Reset all statistics
   */
  public reset() {
    this.statistics.clear()
  }
}

// Singleton instance
let statisticsService: StatisticsService | null = null

export function getStatisticsService(): StatisticsService {
  if (!statisticsService) {
    statisticsService = new StatisticsService()
  }
  return statisticsService
}
