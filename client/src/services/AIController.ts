import type { Unit, Building, Position, Resources } from '@/types/game'
import { findNearestUnit, findNearestBuilding, calculateDistance, canAfford } from '@/utils/gameUtils'
import { getPathfinder } from '@/utils/Pathfinding'

/**
 * AI Controller for computer-controlled players
 */

export enum AIPersonality {
  AGGRESSIVE = 'aggressive',
  DEFENSIVE = 'defensive',
  ECONOMIC = 'economic',
  BALANCED = 'balanced',
}

export enum AIDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

interface AIState {
  playerId: string
  personality: AIPersonality
  difficulty: AIDifficulty
  resources: Resources
  units: Unit[]
  buildings: Building[]
  enemyUnits: Unit[]
  enemyBuildings: Building[]
  phase: 'early' | 'mid' | 'late'
  lastDecisionTime: number
}

export class AIController {
  private state: AIState
  private decisionInterval: number // Time between AI decisions (ms)
  private pathfinder = getPathfinder()

  constructor(
    playerId: string,
    personality: AIPersonality = AIPersonality.BALANCED,
    difficulty: AIDifficulty = AIDifficulty.MEDIUM
  ) {
    this.state = {
      playerId,
      personality,
      difficulty,
      resources: { food: 200, wood: 200, gold: 100, stone: 100 },
      units: [],
      buildings: [],
      enemyUnits: [],
      enemyBuildings: [],
      phase: 'early',
      lastDecisionTime: 0,
    }

    // Set decision interval based on difficulty
    switch (difficulty) {
      case AIDifficulty.EASY:
        this.decisionInterval = 3000 // 3 seconds
        break
      case AIDifficulty.MEDIUM:
        this.decisionInterval = 1500 // 1.5 seconds
        break
      case AIDifficulty.HARD:
        this.decisionInterval = 500 // 0.5 seconds
        break
    }
  }

  public update(deltaTime: number, currentTime: number) {
    // Check if it's time to make a decision
    if (currentTime - this.state.lastDecisionTime < this.decisionInterval) {
      return
    }

    this.state.lastDecisionTime = currentTime

    // Update game phase
    this.updatePhase()

    // Make decisions based on personality
    this.makeDecisions()
  }

  private updatePhase() {
    const totalUnits = this.state.units.length
    const totalBuildings = this.state.buildings.length

    if (totalUnits < 10 && totalBuildings < 5) {
      this.state.phase = 'early'
    } else if (totalUnits < 30 && totalBuildings < 15) {
      this.state.phase = 'mid'
    } else {
      this.state.phase = 'late'
    }
  }

  private makeDecisions() {
    switch (this.state.personality) {
      case AIPersonality.AGGRESSIVE:
        this.aggressiveStrategy()
        break
      case AIPersonality.DEFENSIVE:
        this.defensiveStrategy()
        break
      case AIPersonality.ECONOMIC:
        this.economicStrategy()
        break
      case AIPersonality.BALANCED:
        this.balancedStrategy()
        break
    }
  }

  private aggressiveStrategy() {
    // Focus on military units and attacking
    this.trainMilitaryUnits(0.7) // 70% of resources to military
    this.attackEnemies()
    this.trainVillagers(0.3) // 30% to economy
  }

  private defensiveStrategy() {
    // Focus on defense and buildings
    this.buildDefenses()
    this.defendBase()
    this.trainMilitaryUnits(0.5)
    this.trainVillagers(0.5)
  }

  private economicStrategy() {
    // Focus on resource gathering
    this.trainVillagers(0.8) // 80% to villagers
    this.manageVillagers()
    this.expandEconomy()
    this.trainMilitaryUnits(0.2) // 20% to military
  }

  private balancedStrategy() {
    // Balanced approach
    if (this.state.phase === 'early') {
      this.trainVillagers(0.6)
      this.expandEconomy()
    } else if (this.state.phase === 'mid') {
      this.trainMilitaryUnits(0.5)
      this.trainVillagers(0.5)
    } else {
      this.trainMilitaryUnits(0.7)
      this.attackEnemies()
    }
  }

  private trainVillagers(resourceAllocation: number) {
    const villagersNeeded = Math.min(
      Math.floor(this.state.resources.food * resourceAllocation / 50),
      5 // Max 5 villagers per decision
    )

    for (let i = 0; i < villagersNeeded; i++) {
      if (canAfford(this.state.resources, { food: 50 })) {
        this.queueUnit('villager')
        this.state.resources.food -= 50
      }
    }
  }

  private trainMilitaryUnits(resourceAllocation: number) {
    // Determine unit mix based on phase
    const unitTypes = this.getPreferredMilitaryUnits()

    for (const unitType of unitTypes) {
      const cost = this.getUnitCost(unitType)
      if (canAfford(this.state.resources, cost)) {
        this.queueUnit(unitType)
        this.subtractCost(cost)
      }
    }
  }

  private getPreferredMilitaryUnits(): string[] {
    switch (this.state.phase) {
      case 'early':
        return ['militia', 'archer']
      case 'mid':
        return ['archer', 'knight', 'militia']
      case 'late':
        return ['knight', 'archer']
      default:
        return ['militia']
    }
  }

  private attackEnemies() {
    const militaryUnits = this.state.units.filter((u) => u.type !== 'villager')

    if (militaryUnits.length < 5) return // Need at least 5 units to attack

    for (const unit of militaryUnits) {
      // Find nearest enemy
      const nearestEnemy = findNearestUnit(unit.position, this.state.enemyUnits)

      if (nearestEnemy) {
        this.commandAttack(unit, nearestEnemy.position)
      } else {
        // No units, attack buildings
        const nearestBuilding = findNearestBuilding(unit.position, this.state.enemyBuildings)
        if (nearestBuilding) {
          this.commandMove(unit, nearestBuilding.position)
        }
      }
    }
  }

  private defendBase() {
    const militaryUnits = this.state.units.filter((u) => u.type !== 'villager')
    const townCenter = this.state.buildings.find((b) => b.type === 'town_center')

    if (!townCenter) return

    for (const unit of militaryUnits) {
      // Check for nearby enemies
      const nearbyEnemy = this.state.enemyUnits.find((enemy) =>
        calculateDistance(unit.position, enemy.position) < 15
      )

      if (nearbyEnemy) {
        this.commandAttack(unit, nearbyEnemy.position)
      } else {
        // Patrol around town center
        const patrolRadius = 10
        const angle = (Date.now() / 1000 + unit.id.charCodeAt(0)) % (Math.PI * 2)
        const patrolPos: Position = {
          x: townCenter.position.x + Math.cos(angle) * patrolRadius,
          y: 0,
          z: (townCenter.position.z || 0) + Math.sin(angle) * patrolRadius,
        }
        this.commandMove(unit, patrolPos)
      }
    }
  }

  private manageVillagers() {
    const villagers = this.state.units.filter((u) => u.type === 'villager')

    // Assign villagers to gather resources
    const resourceNeeds = this.assessResourceNeeds()

    villagers.forEach((villager, index) => {
      const resourceType = this.selectResourceForVillager(index, resourceNeeds)
      // In a real implementation, would command villager to gather resource
      // For now, just a placeholder
    })
  }

  private assessResourceNeeds(): { food: number; wood: number; gold: number; stone: number } {
    return {
      food: this.state.resources.food < 100 ? 2 : 1,
      wood: this.state.resources.wood < 100 ? 2 : 1,
      gold: this.state.resources.gold < 50 ? 2 : 1,
      stone: this.state.resources.stone < 50 ? 1 : 0,
    }
  }

  private selectResourceForVillager(
    villagerIndex: number,
    needs: { food: number; wood: number; gold: number; stone: number }
  ): string {
    const total = needs.food + needs.wood + needs.gold + needs.stone
    const random = (villagerIndex * 7) % total // Pseudo-random but deterministic

    let current = 0
    if (random < (current += needs.food)) return 'food'
    if (random < (current += needs.wood)) return 'wood'
    if (random < (current += needs.gold)) return 'gold'
    return 'stone'
  }

  private expandEconomy() {
    // Build houses if near population cap
    const population = this.state.units.length
    const maxPopulation = this.calculateMaxPopulation()

    if (population >= maxPopulation - 5) {
      this.queueBuilding('house')
    }

    // Build economy buildings
    if (this.state.phase === 'mid' || this.state.phase === 'late') {
      if (!this.hasBuilding('market')) {
        this.queueBuilding('market')
      }
      if (!this.hasBuilding('blacksmith')) {
        this.queueBuilding('blacksmith')
      }
    }
  }

  private buildDefenses() {
    // Build military buildings
    if (!this.hasBuilding('barracks')) {
      this.queueBuilding('barracks')
    }
    if (this.state.phase !== 'early' && !this.hasBuilding('archery_range')) {
      this.queueBuilding('archery_range')
    }
  }

  private calculateMaxPopulation(): number {
    return this.state.buildings.reduce((total, building) => {
      if (building.type === 'house') return total + 5
      if (building.type === 'town_center') return total + 10
      return total
    }, 0)
  }

  private hasBuilding(type: string): boolean {
    return this.state.buildings.some((b) => b.type === type)
  }

  // Command methods (would be connected to game engine in real implementation)
  private queueUnit(type: string) {
    console.log(`[AI ${this.state.playerId}] Queueing unit: ${type}`)
    // Emit event or call game engine method
  }

  private queueBuilding(type: string) {
    console.log(`[AI ${this.state.playerId}] Queueing building: ${type}`)
    // Emit event or call game engine method
  }

  private commandMove(unit: Unit, target: Position) {
    // Use pathfinding
    const path = this.pathfinder.findPath(unit.position, target)
    if (path.length > 0) {
      // Command unit to follow path
    }
  }

  private commandAttack(unit: Unit, target: Position) {
    this.commandMove(unit, target)
  }

  private getUnitCost(type: string): Partial<Resources> {
    const costs: Record<string, Partial<Resources>> = {
      villager: { food: 50 },
      militia: { food: 60, gold: 20 },
      archer: { wood: 25, gold: 45 },
      knight: { food: 60, gold: 75 },
    }
    return costs[type] || {}
  }

  private subtractCost(cost: Partial<Resources>) {
    this.state.resources.food -= cost.food || 0
    this.state.resources.wood -= cost.wood || 0
    this.state.resources.gold -= cost.gold || 0
    this.state.resources.stone -= cost.stone || 0
  }

  // Update AI state from game state
  public updateState(state: {
    resources?: Resources
    units?: Unit[]
    buildings?: Building[]
    enemyUnits?: Unit[]
    enemyBuildings?: Building[]
  }) {
    if (state.resources) this.state.resources = state.resources
    if (state.units) this.state.units = state.units
    if (state.buildings) this.state.buildings = state.buildings
    if (state.enemyUnits) this.state.enemyUnits = state.enemyUnits
    if (state.enemyBuildings) this.state.enemyBuildings = state.enemyBuildings
  }

  public getPersonality(): AIPersonality {
    return this.state.personality
  }

  public getDifficulty(): AIDifficulty {
    return this.state.difficulty
  }
}
