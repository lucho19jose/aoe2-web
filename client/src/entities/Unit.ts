import * as THREE from 'three'
import { Entity } from './Entity'
import type { Resource } from './Resource'
import type { Building } from './Building'
import { UNIT_TYPES, COLORS, GAME_CONFIG } from '@/config/gameConfig'
import type { Position, UnitType, ResourceType } from '@/types/game'

export enum UnitState {
  Idle = 'idle',
  Moving = 'moving',
  Harvesting = 'harvesting',
  Returning = 'returning',
  Depositing = 'depositing',
  Building = 'building',
  Attacking = 'attacking',
}

export enum CombatStance {
  Aggressive = 'aggressive', // Automatically attack nearby enemies
  Defensive = 'defensive',   // Only attack when attacked
  NoAction = 'no_action',    // Never attack automatically
}

/**
 * Represents a game unit (villager, soldier, etc.)
 */
export class Unit extends Entity {
  public type: UnitType
  public name: string
  public hp: number
  public maxHp: number
  public attack: number
  public defense: number
  public speed: number
  public state: UnitState = UnitState.Idle
  public isMoving = false
  public targetPosition: THREE.Vector3 | null = null
  public path: Position[] = []
  public currentWaypointIndex = 0

  // Harvesting
  public targetResource: Resource | null = null
  public targetDepositBuilding: Building | null = null
  public carriedResourceType: ResourceType | null = null
  public carriedResourceAmount = 0
  public maxCarryCapacity = 10
  public harvestTimer = 0
  public harvestInterval = 1 // seconds between harvests

  // Combat
  public targetEnemy: Unit | Building | null = null
  public attackTimer = 0
  public attackInterval = 1.5 // seconds between attacks
  public attackRange = 2 // units
  public combatStance: CombatStance = CombatStance.Aggressive
  public visionRange = 12 // Range to detect enemies
  public isRanged = false // Whether this unit attacks from range
  public lastAttacker: Unit | null = null // Track who attacked this unit

  private selectionRing: THREE.Mesh | null = null
  private healthBar: THREE.Mesh | null = null
  private resourceIndicator: THREE.Mesh | null = null
  private attackEffect: THREE.Mesh | null = null

  constructor(
    id: string,
    type: UnitType,
    position: Position,
    ownerId: string,
    playerColor: string = '#FF0000'
  ) {
    super(id, position, ownerId)

    this.type = type
    const unitConfig = UNIT_TYPES[type.toUpperCase() as keyof typeof UNIT_TYPES]

    this.name = unitConfig.name
    this.maxHp = unitConfig.hp
    this.hp = this.maxHp
    this.attack = unitConfig.attack
    this.defense = unitConfig.defense
    this.speed = unitConfig.speed

    // Configure combat based on unit type
    if ('range' in unitConfig && unitConfig.range) {
      this.attackRange = unitConfig.range
      this.isRanged = true
      this.attackInterval = 2.0 // Ranged units attack slower
    } else {
      this.attackRange = GAME_CONFIG.ATTACK_RANGE.MELEE
      this.isRanged = false
      this.attackInterval = 1.5 // Melee units attack faster
    }

    // Villagers are passive by default
    this.combatStance = type === 'villager' ? CombatStance.NoAction : CombatStance.Aggressive

    this.createMesh(playerColor)
  }

  private createMesh(playerColor: string) {
    // Create unit body
    const geometry = new THREE.BoxGeometry(0.8, 1.6, 0.8)
    const material = new THREE.MeshStandardMaterial({
      color: playerColor,
      roughness: 0.7,
      metalness: 0.3,
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.copy(this.position)
    this.mesh.castShadow = true
    this.mesh.receiveShadow = true
    this.mesh.userData = { entityId: this.id, type: 'unit' }

    // Create selection ring
    const ringGeometry = new THREE.RingGeometry(0.8, 1.0, 32)
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.UI.SELECTION_BOX,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    })
    this.selectionRing = new THREE.Mesh(ringGeometry, ringMaterial)
    this.selectionRing.rotation.x = -Math.PI / 2
    this.selectionRing.position.y = 0.1
    this.selectionRing.visible = false
    this.mesh.add(this.selectionRing)

    // Create health bar background
    const healthBarBg = new THREE.PlaneGeometry(1, 0.1)
    const healthBarBgMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const healthBarBgMesh = new THREE.Mesh(healthBarBg, healthBarBgMaterial)
    healthBarBgMesh.position.set(0, 1.5, 0)
    this.mesh.add(healthBarBgMesh)

    // Create health bar
    const healthBarGeometry = new THREE.PlaneGeometry(1, 0.08)
    const healthBarMaterial = new THREE.MeshBasicMaterial({
      color: COLORS.UI.HEALTH_BAR_GREEN,
    })
    this.healthBar = new THREE.Mesh(healthBarGeometry, healthBarMaterial)
    this.healthBar.position.set(0, 1.5, 0.01)
    this.mesh.add(this.healthBar)
  }

  public moveTo(target: Position, path?: Position[]) {
    if (path && path.length > 0) {
      // Use pathfinding path
      this.path = path
      this.currentWaypointIndex = 0
      const firstWaypoint = this.path[this.currentWaypointIndex]
      this.targetPosition = new THREE.Vector3(
        firstWaypoint.x,
        firstWaypoint.y || 0,
        firstWaypoint.z || 0
      )
    } else {
      // Direct movement (no pathfinding)
      this.path = []
      this.currentWaypointIndex = 0
      this.targetPosition = new THREE.Vector3(target.x, target.y || 0, target.z || 0)
    }
    this.isMoving = true
  }

  public stop() {
    this.isMoving = false
    this.targetPosition = null
    this.path = []
    this.currentWaypointIndex = 0
    this.state = UnitState.Idle
  }

  /**
   * Start harvesting a resource
   */
  public harvestResource(resource: Resource, depositBuilding: Building) {
    if (this.type !== 'villager') {
      console.warn('Only villagers can harvest resources')
      return
    }

    this.targetResource = resource
    this.targetDepositBuilding = depositBuilding
    this.state = UnitState.Moving

    // Move to resource
    this.moveTo({
      x: resource.position.x,
      y: 0,
      z: resource.position.z
    })
  }

  /**
   * Perform harvesting action
   */
  private performHarvest(deltaTime: number) {
    if (!this.targetResource || !this.targetResource.isAvailable()) {
      this.stopHarvesting()
      return
    }

    this.harvestTimer += deltaTime

    if (this.harvestTimer >= this.harvestInterval) {
      const harvestAmount = this.targetResource.harvestRate
      const harvested = this.targetResource.harvest(harvestAmount)

      this.carriedResourceAmount += harvested
      this.carriedResourceType = this.targetResource.type
      this.harvestTimer = 0

      // Update resource indicator
      this.updateResourceIndicator()

      // Check if carrying max capacity or resource depleted
      if (this.carriedResourceAmount >= this.maxCarryCapacity || this.targetResource.depleted) {
        this.returnToDeposit()
      }
    }
  }

  /**
   * Return resources to deposit building
   */
  private returnToDeposit() {
    if (!this.targetDepositBuilding) {
      this.stopHarvesting()
      return
    }

    this.state = UnitState.Returning

    // Move to deposit building
    this.moveTo({
      x: this.targetDepositBuilding.position.x,
      y: 0,
      z: this.targetDepositBuilding.position.z
    })
  }

  /**
   * Deposit carried resources
   */
  public depositResources(): { type: ResourceType; amount: number } | null {
    if (this.carriedResourceAmount === 0 || !this.carriedResourceType) {
      return null
    }

    const deposited = {
      type: this.carriedResourceType,
      amount: this.carriedResourceAmount
    }

    // Clear carried resources
    this.carriedResourceAmount = 0
    this.carriedResourceType = null
    this.updateResourceIndicator()

    // Return to harvest more if resource still available
    if (this.targetResource && this.targetResource.isAvailable()) {
      this.state = UnitState.Moving
      this.moveTo({
        x: this.targetResource.position.x,
        y: 0,
        z: this.targetResource.position.z
      })
    } else {
      this.stopHarvesting()
    }

    return deposited
  }

  /**
   * Stop harvesting
   */
  public stopHarvesting() {
    this.targetResource = null
    this.targetDepositBuilding = null
    this.state = UnitState.Idle
    this.stop()
  }

  /**
   * Check if unit is near target position
   */
  public isNearPosition(position: THREE.Vector3, threshold: number = 2): boolean {
    return this.position.distanceTo(position) < threshold
  }

  /**
   * Update resource indicator visual
   */
  private updateResourceIndicator() {
    // Remove old indicator
    if (this.resourceIndicator && this.mesh) {
      this.mesh.remove(this.resourceIndicator)
      this.resourceIndicator.geometry.dispose()
      ;(this.resourceIndicator.material as THREE.Material).dispose()
      this.resourceIndicator = null
    }

    // Create new indicator if carrying resources
    if (this.carriedResourceAmount > 0 && this.carriedResourceType && this.mesh) {
      const indicatorGeometry = new THREE.SphereGeometry(0.3, 8, 8)
      let color = 0xffffff

      switch (this.carriedResourceType) {
        case 'tree':
          color = 0x8b4513 // brown for wood
          break
        case 'gold_mine':
          color = 0xffd700 // gold
          break
        case 'stone_mine':
          color = 0x808080 // gray
          break
        case 'berry_bush':
        case 'deer':
          color = 0xff6b6b // red for food
          break
      }

      const indicatorMaterial = new THREE.MeshStandardMaterial({ color })
      this.resourceIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial)
      this.resourceIndicator.position.set(0.5, 1.2, 0)
      this.mesh.add(this.resourceIndicator)
    }
  }

  public takeDamage(damage: number, attacker?: Unit) {
    const actualDamage = Math.max(1, damage - this.defense)
    this.hp = Math.max(0, this.hp - actualDamage)
    this.updateHealthBar()

    // Track last attacker for defensive stance
    if (attacker) {
      this.lastAttacker = attacker
    }

    return this.hp <= 0
  }

  /**
   * Attack a target enemy
   */
  public attackTarget(target: Unit | Building) {
    this.targetEnemy = target
    this.state = UnitState.Attacking
    this.targetResource = null
    this.attackTimer = 0

    console.log(`⚔️ Unit ${this.id} attacking ${target.id}`)
  }

  /**
   * Find and attack nearby enemies if in aggressive stance
   */
  public findAndAttackNearbyEnemy(allUnits: Unit[], allBuildings: Building[]) {
    // Only auto-attack if aggressive stance and not busy
    if (this.combatStance !== CombatStance.Aggressive) return
    if (this.state !== UnitState.Idle) return
    if (this.targetEnemy) return

    // Find nearest enemy unit
    let nearestEnemy: Unit | Building | null = null
    let nearestDistance = this.visionRange

    // Check enemy units
    for (const unit of allUnits) {
      if (unit.ownerId === this.ownerId || unit.hp <= 0) continue

      const distance = this.position.distanceTo(unit.position)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestEnemy = unit
      }
    }

    // Check enemy buildings (lower priority)
    if (!nearestEnemy) {
      for (const building of allBuildings) {
        if (building.ownerId === this.ownerId || building.hp <= 0) continue

        const distance = this.position.distanceTo(building.position)
        if (distance < nearestDistance * 0.7) { // Only attack buildings if very close
          nearestDistance = distance
          nearestEnemy = building
        }
      }
    }

    // Attack if found
    if (nearestEnemy) {
      this.attackTarget(nearestEnemy)
    }
  }

  /**
   * Handle defensive stance - counter attack
   */
  public handleDefensiveStance() {
    if (this.combatStance !== CombatStance.Defensive) return
    if (this.state !== UnitState.Idle) return
    if (this.targetEnemy) return

    // Attack the last unit that attacked us
    if (this.lastAttacker && this.lastAttacker.hp > 0) {
      const distance = this.position.distanceTo(this.lastAttacker.position)
      if (distance <= this.visionRange) {
        this.attackTarget(this.lastAttacker)
      }
    }
  }

  /**
   * Update combat state
   */
  private updateCombat(deltaTime: number) {
    if (!this.targetEnemy || this.state !== UnitState.Attacking) return

    // Check if target is still valid
    if (this.targetEnemy instanceof Unit && this.targetEnemy.hp <= 0) {
      this.targetEnemy = null
      this.state = UnitState.Idle
      return
    }

    if (this.targetEnemy instanceof Building && this.targetEnemy.hp <= 0) {
      this.targetEnemy = null
      this.state = UnitState.Idle
      return
    }

    // Calculate distance to target
    const targetPos = this.targetEnemy.position
    const distance = this.position.distanceTo(targetPos)

    // Move towards target if out of range
    if (distance > this.attackRange) {
      const direction = targetPos.clone().sub(this.position).normalize()
      const moveDistance = this.speed * deltaTime
      const newPosition = this.position.clone().add(direction.multiplyScalar(moveDistance))

      this.position.copy(newPosition)
      if (this.mesh) {
        this.mesh.position.copy(this.position)
        // Face the target
        const angle = Math.atan2(direction.x, direction.z)
        this.mesh.rotation.y = angle
      }
    } else {
      // In range - attack
      this.attackTimer += deltaTime

      if (this.attackTimer >= this.attackInterval) {
        // Perform attack
        const isDead = this.targetEnemy.takeDamage(
          this.attack,
          this.targetEnemy instanceof Unit ? this : undefined
        )

        // Create attack visual effect
        this.createAttackEffect()

        console.log(`⚔️ ${this.id} deals ${this.attack} damage to ${this.targetEnemy.id}`)

        if (isDead) {
          console.log(`💀 ${this.targetEnemy.id} has been destroyed!`)
          this.targetEnemy = null
          this.state = UnitState.Idle
        }

        this.attackTimer = 0
      }
    }
  }

  /**
   * Create visual effect when attacking
   */
  private createAttackEffect() {
    if (!this.mesh || !this.targetEnemy) return

    // Remove old effect
    if (this.attackEffect) {
      this.mesh.remove(this.attackEffect)
      this.attackEffect.geometry.dispose()
      ;(this.attackEffect.material as THREE.Material).dispose()
    }

    if (this.isRanged) {
      // Create projectile effect for ranged units
      const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8)
      const projectileMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        emissive: 0xffaa00
      })
      this.attackEffect = new THREE.Mesh(projectileGeometry, projectileMaterial)

      // Position at unit
      this.attackEffect.position.copy(this.position)
      this.attackEffect.position.y += 1.0

      // TODO: Animate projectile to target (requires animation system)

      // For now, just show brief flash
      setTimeout(() => {
        if (this.attackEffect && this.mesh) {
          this.mesh.remove(this.attackEffect)
          this.attackEffect.geometry.dispose()
          ;(this.attackEffect.material as THREE.Material).dispose()
          this.attackEffect = null
        }
      }, 200)
    } else {
      // Create slash effect for melee units
      const slashGeometry = new THREE.PlaneGeometry(1.5, 1.5)
      const slashMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      })
      this.attackEffect = new THREE.Mesh(slashGeometry, slashMaterial)
      this.attackEffect.position.set(0.8, 1.0, 0)
      this.mesh.add(this.attackEffect)

      // Remove after short delay
      setTimeout(() => {
        if (this.attackEffect && this.mesh) {
          this.mesh.remove(this.attackEffect)
          this.attackEffect.geometry.dispose()
          ;(this.attackEffect.material as THREE.Material).dispose()
          this.attackEffect = null
        }
      }, 150)
    }
  }

  private updateHealthBar() {
    if (!this.healthBar) return

    const healthPercent = this.hp / this.maxHp
    this.healthBar.scale.x = healthPercent

    // Update color based on health
    const material = this.healthBar.material as THREE.MeshBasicMaterial
    if (healthPercent > 0.6) {
      material.color.setHex(COLORS.UI.HEALTH_BAR_GREEN)
    } else if (healthPercent > 0.3) {
      material.color.setHex(COLORS.UI.HEALTH_BAR_YELLOW)
    } else {
      material.color.setHex(COLORS.UI.HEALTH_BAR_RED)
    }
  }

  public setSelected(selected: boolean) {
    super.setSelected(selected)
    if (this.selectionRing) {
      this.selectionRing.visible = selected
    }
  }

  /**
   * Change combat stance
   */
  public setCombatStance(stance: CombatStance) {
    this.combatStance = stance
    console.log(`Unit ${this.id} stance changed to ${stance}`)
  }

  public update(deltaTime: number) {
    // Handle movement
    if (this.isMoving && this.targetPosition) {
      // Calculate direction to target
      const direction = new THREE.Vector3()
      direction.subVectors(this.targetPosition, this.position)
      const distance = direction.length()

      if (distance < 0.1) {
        // Reached current waypoint
        if (this.path.length > 0 && this.currentWaypointIndex < this.path.length - 1) {
          // Move to next waypoint in path
          this.currentWaypointIndex++
          const nextWaypoint = this.path[this.currentWaypointIndex]
          this.targetPosition = new THREE.Vector3(
            nextWaypoint.x,
            nextWaypoint.y || 0,
            nextWaypoint.z || 0
          )
        } else {
          // Reached final destination
          this.stop()
          this.onReachedDestination()
        }
      } else {
        // Move towards current waypoint
        direction.normalize()
        const moveDistance = this.speed * deltaTime
        const actualMove = Math.min(moveDistance, distance)

        this.position.add(direction.multiplyScalar(actualMove))

        // Update mesh position
        if (this.mesh) {
          this.mesh.position.copy(this.position)

          // Rotate to face movement direction
          const angle = Math.atan2(direction.x, direction.z)
          this.mesh.rotation.y = angle
        }
      }
    }

    // Handle harvesting state machine
    switch (this.state) {
      case UnitState.Harvesting:
        this.performHarvest(deltaTime)
        break

      case UnitState.Depositing:
        // Deposit is handled by GameEngine when unit reaches building
        break

      case UnitState.Attacking:
        this.updateCombat(deltaTime)
        break
    }

    // Make health bar always face camera (billboard effect)
    if (this.healthBar && this.mesh) {
      this.healthBar.lookAt(this.healthBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
    }
  }

  /**
   * Called when unit reaches its destination
   */
  private onReachedDestination() {
    if (this.state === UnitState.Moving && this.targetResource) {
      // Reached resource, start harvesting
      if (this.isNearPosition(this.targetResource.position, 2)) {
        this.state = UnitState.Harvesting
        this.targetResource.isBeingHarvested = true
      }
    } else if (this.state === UnitState.Returning && this.targetDepositBuilding) {
      // Reached deposit building
      if (this.isNearPosition(this.targetDepositBuilding.position, 3)) {
        this.state = UnitState.Depositing
        // Deposit will be triggered by GameEngine
      }
    }
  }

  public render(scene: THREE.Scene) {
    if (this.mesh && !this.mesh.parent) {
      scene.add(this.mesh)
    }
  }

  public dispose() {
    if (this.mesh) {
      this.mesh.parent?.remove(this.mesh)
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else {
            child.material?.dispose()
          }
        }
      })
    }
  }
}
