import { Unit } from '@/entities/Unit'
import { Building } from '@/entities/Building'
import type { Position } from '@/types/game'
import { calculateDistance, calculateDamage } from '@/utils/gameUtils'
import { GAME_CONFIG } from '@/config/gameConfig'

/**
 * Combat system - manages unit combat and attacks
 */

interface CombatState {
  attacker: Unit
  target: Unit | Building | null
  attackCooldown: number
  isAttacking: boolean
  state: 'idle' | 'pursuing' | 'attacking'
}

export class CombatSystem {
  private combatStates: Map<string, CombatState> = new Map()
  private onUnitDeath?: (unit: Unit) => void
  private onBuildingDestroyed?: (building: Building) => void
  private onDamageDealt?: (attacker: Unit, target: Unit | Building, damage: number) => void

  /**
   * Add a unit to the combat system
   */
  public addUnit(unit: Unit) {
    if (!this.combatStates.has(unit.id)) {
      this.combatStates.set(unit.id, {
        attacker: unit,
        target: null,
        attackCooldown: 0,
        isAttacking: false,
        state: 'idle',
      })
    }
  }

  /**
   * Remove a unit from combat system
   */
  public removeUnit(unitId: string) {
    this.combatStates.delete(unitId)

    // Remove as target from other units
    this.combatStates.forEach((state) => {
      if (state.target instanceof Unit && state.target.id === unitId) {
        state.target = null
        state.state = 'idle'
      }
    })
  }

  /**
   * Command a unit to attack a target
   */
  public commandAttack(attackerId: string, target: Unit | Building) {
    const state = this.combatStates.get(attackerId)
    if (!state) return

    state.target = target
    state.state = 'pursuing'
    state.isAttacking = true

    // Move towards target
    this.pursueTarget(state)
  }

  /**
   * Stop a unit from attacking
   */
  public commandStop(unitId: string) {
    const state = this.combatStates.get(unitId)
    if (!state) return

    state.target = null
    state.state = 'idle'
    state.isAttacking = false
    state.attacker.stop()
  }

  /**
   * Update combat system
   */
  public update(deltaTime: number) {
    this.combatStates.forEach((state) => {
      this.updateCombatState(state, deltaTime)
    })
  }

  private updateCombatState(state: CombatState, deltaTime: number) {
    // Update cooldown
    if (state.attackCooldown > 0) {
      state.attackCooldown -= deltaTime
    }

    // Check if target is still valid
    if (state.target) {
      if (state.target instanceof Unit && state.target.hp <= 0) {
        state.target = null
        state.state = 'idle'
        return
      }
      if (state.target instanceof Building && state.target.hp <= 0) {
        state.target = null
        state.state = 'idle'
        return
      }
    }

    switch (state.state) {
      case 'idle':
        // Do nothing
        break

      case 'pursuing':
        if (!state.target) {
          state.state = 'idle'
          break
        }

        const attackRange = this.getAttackRange(state.attacker)
        const distToTarget = calculateDistance(state.attacker.position, state.target.position)

        if (distToTarget <= attackRange) {
          // In range, start attacking
          state.state = 'attacking'
          state.attacker.stop()
        } else {
          // Not in range, keep moving
          this.pursueTarget(state)
        }
        break

      case 'attacking':
        if (!state.target) {
          state.state = 'idle'
          break
        }

        const range = this.getAttackRange(state.attacker)
        const distance = calculateDistance(state.attacker.position, state.target.position)

        if (distance > range) {
          // Target moved out of range, pursue again
          state.state = 'pursuing'
          this.pursueTarget(state)
          break
        }

        // Attack if cooldown is ready
        if (state.attackCooldown <= 0) {
          this.performAttack(state)
          state.attackCooldown = this.getAttackSpeed(state.attacker)
        }
        break
    }
  }

  private pursueTarget(state: CombatState) {
    if (!state.target) return

    // Move to target position
    state.attacker.moveTo(state.target.position)
  }

  private performAttack(state: CombatState) {
    if (!state.target) return

    const damage = calculateDamage(state.attacker, state.target as Unit)

    // Deal damage
    const died = state.target.takeDamage(damage)

    // Notify damage dealt
    if (this.onDamageDealt) {
      this.onDamageDealt(state.attacker, state.target, damage)
    }

    // Check if target died
    if (died) {
      if (state.target instanceof Unit) {
        if (this.onUnitDeath) {
          this.onUnitDeath(state.target)
        }
        this.removeUnit(state.target.id)
      } else if (state.target instanceof Building) {
        if (this.onBuildingDestroyed) {
          this.onBuildingDestroyed(state.target)
        }
      }

      state.target = null
      state.state = 'idle'
    }
  }

  private getAttackRange(unit: Unit): number {
    // Check if ranged unit
    if (unit.type === 'archer' || unit.type === 'cavalry_archer') {
      return GAME_CONFIG.ATTACK_RANGE.RANGED
    }

    return GAME_CONFIG.ATTACK_RANGE.MELEE
  }

  private getAttackSpeed(unit: Unit): number {
    // Time between attacks in seconds
    return 1 / GAME_CONFIG.ATTACK_SPEED
  }

  /**
   * Get units currently in combat
   */
  public getUnitsInCombat(): Unit[] {
    return Array.from(this.combatStates.values())
      .filter((state) => state.state !== 'idle')
      .map((state) => state.attacker)
  }

  /**
   * Get combat state for a unit
   */
  public getCombatState(unitId: string): CombatState | undefined {
    return this.combatStates.get(unitId)
  }

  /**
   * Set callback for when unit dies
   */
  public setOnUnitDeath(callback: (unit: Unit) => void) {
    this.onUnitDeath = callback
  }

  /**
   * Set callback for when building is destroyed
   */
  public setOnBuildingDestroyed(callback: (building: Building) => void) {
    this.onBuildingDestroyed = callback
  }

  /**
   * Set callback for when damage is dealt
   */
  public setOnDamageDealt(callback: (attacker: Unit, target: Unit | Building, damage: number) => void) {
    this.onDamageDealt = callback
  }

  /**
   * Check if unit is in combat
   */
  public isInCombat(unitId: string): boolean {
    const state = this.combatStates.get(unitId)
    return state ? state.state !== 'idle' : false
  }

  /**
   * Get combat statistics
   */
  public getCombatStats(): {
    totalUnits: number
    inCombat: number
    attacking: number
    pursuing: number
  } {
    let inCombat = 0
    let attacking = 0
    let pursuing = 0

    this.combatStates.forEach((state) => {
      if (state.state !== 'idle') {
        inCombat++
        if (state.state === 'attacking') attacking++
        if (state.state === 'pursuing') pursuing++
      }
    })

    return {
      totalUnits: this.combatStates.size,
      inCombat,
      attacking,
      pursuing,
    }
  }

  /**
   * Clear all combat states
   */
  public clear() {
    this.combatStates.clear()
  }
}
