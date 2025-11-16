import * as THREE from 'three'
import { Entity } from './Entity'
import { UNIT_TYPES, COLORS } from '@/config/gameConfig'
import type { Position, UnitType } from '@/types/game'

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
  public isMoving = false
  public targetPosition: THREE.Vector3 | null = null
  public path: Position[] = []
  public currentWaypointIndex = 0
  private selectionRing: THREE.Mesh | null = null
  private healthBar: THREE.Mesh | null = null

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
  }

  public takeDamage(damage: number) {
    const actualDamage = Math.max(1, damage - this.defense)
    this.hp = Math.max(0, this.hp - actualDamage)
    this.updateHealthBar()
    return this.hp <= 0
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

  public update(deltaTime: number) {
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

    // Make health bar always face camera (billboard effect)
    if (this.healthBar && this.mesh) {
      this.healthBar.lookAt(this.healthBar.parent!.position.clone().add(new THREE.Vector3(0, 0, 1)))
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
