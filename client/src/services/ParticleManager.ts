import * as THREE from 'three'
import type { Position } from '@/types/game'

/**
 * Particle Manager for visual effects
 */

export type ParticleEffectType =
  | 'explosion'
  | 'smoke'
  | 'dust'
  | 'sparkle'
  | 'blood'
  | 'fire'
  | 'heal'
  | 'resource_gather'

interface Particle {
  id: string
  mesh: THREE.Points
  velocity: THREE.Vector3
  lifetime: number
  maxLifetime: number
  color: THREE.Color
  size: number
}

export class ParticleManager {
  private scene: THREE.Scene
  private particles: Map<string, Particle> = new Map()
  private particleCount = 0
  private maxParticles = 1000

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public createEffect(
    type: ParticleEffectType,
    position: Position,
    options?: {
      color?: number
      particleCount?: number
      size?: number
      duration?: number
      velocity?: number
    }
  ) {
    const config = this.getEffectConfig(type, options)

    for (let i = 0; i < config.particleCount; i++) {
      if (this.particles.size >= this.maxParticles) {
        // Remove oldest particle
        const firstKey = this.particles.keys().next().value
        this.removeParticle(firstKey)
      }

      this.createParticle(position, config)
    }
  }

  private getEffectConfig(
    type: ParticleEffectType,
    options?: any
  ): {
    color: number
    particleCount: number
    size: number
    duration: number
    velocity: number
    spread: number
  } {
    const defaults: Record<
      ParticleEffectType,
      {
        color: number
        particleCount: number
        size: number
        duration: number
        velocity: number
        spread: number
      }
    > = {
      explosion: {
        color: 0xff6600,
        particleCount: 50,
        size: 0.3,
        duration: 1.5,
        velocity: 8,
        spread: 1,
      },
      smoke: {
        color: 0x666666,
        particleCount: 20,
        size: 0.5,
        duration: 3,
        velocity: 2,
        spread: 0.5,
      },
      dust: {
        color: 0xccaa77,
        particleCount: 15,
        size: 0.2,
        duration: 1,
        velocity: 3,
        spread: 0.8,
      },
      sparkle: {
        color: 0xffff00,
        particleCount: 30,
        size: 0.1,
        duration: 0.8,
        velocity: 5,
        spread: 0.6,
      },
      blood: {
        color: 0x880000,
        particleCount: 25,
        size: 0.15,
        duration: 1.2,
        velocity: 4,
        spread: 0.7,
      },
      fire: {
        color: 0xff4400,
        particleCount: 40,
        size: 0.4,
        duration: 2,
        velocity: 3,
        spread: 0.4,
      },
      heal: {
        color: 0x00ff88,
        particleCount: 20,
        size: 0.2,
        duration: 1.5,
        velocity: 2,
        spread: 0.3,
      },
      resource_gather: {
        color: 0xffdd00,
        particleCount: 10,
        size: 0.15,
        duration: 1,
        velocity: 2,
        spread: 0.4,
      },
    }

    return {
      ...defaults[type],
      ...options,
    }
  }

  private createParticle(
    position: Position,
    config: {
      color: number
      size: number
      duration: number
      velocity: number
      spread: number
    }
  ) {
    const id = `particle_${this.particleCount++}`

    // Create particle geometry
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(3)
    positions[0] = position.x
    positions[1] = position.y || 0
    positions[2] = position.z || 0
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Create particle material
    const material = new THREE.PointsMaterial({
      color: config.color,
      size: config.size,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    // Create particle mesh
    const mesh = new THREE.Points(geometry, material)
    this.scene.add(mesh)

    // Random velocity
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * config.spread,
      Math.random() * config.velocity,
      (Math.random() - 0.5) * config.spread
    )

    const particle: Particle = {
      id,
      mesh,
      velocity,
      lifetime: 0,
      maxLifetime: config.duration,
      color: new THREE.Color(config.color),
      size: config.size,
    }

    this.particles.set(id, particle)
  }

  public update(deltaTime: number) {
    const particlesToRemove: string[] = []

    this.particles.forEach((particle, id) => {
      // Update lifetime
      particle.lifetime += deltaTime

      if (particle.lifetime >= particle.maxLifetime) {
        particlesToRemove.push(id)
        return
      }

      // Update position
      const positions = particle.mesh.geometry.attributes.position.array as Float32Array
      positions[0] += particle.velocity.x * deltaTime
      positions[1] += particle.velocity.y * deltaTime
      positions[2] += particle.velocity.z * deltaTime
      particle.mesh.geometry.attributes.position.needsUpdate = true

      // Apply gravity
      particle.velocity.y -= 9.8 * deltaTime

      // Fade out
      const lifePercent = particle.lifetime / particle.maxLifetime
      const material = particle.mesh.material as THREE.PointsMaterial
      material.opacity = 1 - lifePercent

      // Shrink over time
      material.size = particle.size * (1 - lifePercent * 0.5)
    })

    // Remove expired particles
    particlesToRemove.forEach((id) => this.removeParticle(id))
  }

  private removeParticle(id: string) {
    const particle = this.particles.get(id)
    if (particle) {
      this.scene.remove(particle.mesh)
      particle.mesh.geometry.dispose()
      ;(particle.mesh.material as THREE.PointsMaterial).dispose()
      this.particles.delete(id)
    }
  }

  public removeAll() {
    this.particles.forEach((_, id) => this.removeParticle(id))
  }

  public setMaxParticles(max: number) {
    this.maxParticles = max
  }

  public getParticleCount(): number {
    return this.particles.size
  }

  public dispose() {
    this.removeAll()
  }
}

// Helper function to create burst effects
export function createBurstEffect(
  particleManager: ParticleManager,
  position: Position,
  type: ParticleEffectType,
  intensity: number = 1
) {
  const baseCount = 30
  particleManager.createEffect(type, position, {
    particleCount: Math.floor(baseCount * intensity),
    velocity: 5 * intensity,
  })
}

// Helper function to create continuous effects
export function createContinuousEffect(
  particleManager: ParticleManager,
  position: Position,
  type: ParticleEffectType,
  duration: number
): NodeJS.Timeout {
  const interval = setInterval(() => {
    particleManager.createEffect(type, position, {
      particleCount: 5,
    })
  }, 100)

  setTimeout(() => {
    clearInterval(interval)
  }, duration * 1000)

  return interval
}
