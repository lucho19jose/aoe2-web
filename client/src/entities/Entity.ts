import * as THREE from 'three'
import type { Position } from '@/types/game'

/**
 * Base class for all game entities
 */
export abstract class Entity {
  public id: string
  public position: THREE.Vector3
  public mesh: THREE.Object3D | null = null
  public isSelected = false
  public ownerId: string

  constructor(id: string, position: Position, ownerId: string) {
    this.id = id
    this.position = new THREE.Vector3(position.x, position.y || 0, position.z || 0)
    this.ownerId = ownerId
  }

  abstract update(deltaTime: number): void
  abstract render(scene: THREE.Scene): void
  abstract dispose(): void

  setSelected(selected: boolean) {
    this.isSelected = selected
  }

  setPosition(x: number, y: number, z: number) {
    this.position.set(x, y, z)
    if (this.mesh) {
      this.mesh.position.set(x, y, z)
    }
  }

  getPosition(): Position {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    }
  }

  distanceTo(other: Entity): number {
    return this.position.distanceTo(other.position)
  }
}
