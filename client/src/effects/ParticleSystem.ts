import * as THREE from 'three'
import type { Position } from '@/types/game'

/**
 * Particle emitter for visual effects
 */
export class ParticleEmitter {
  private particles: Particle[] = []
  private scene: THREE.Scene
  private maxParticles: number

  constructor(scene: THREE.Scene, maxParticles: number = 100) {
    this.scene = scene
    this.maxParticles = maxParticles
  }

  /**
   * Emit attack particles
   */
  public emitAttackEffect(position: Position, targetPosition: Position, color: number = 0xffff00) {
    const direction = new THREE.Vector3(
      targetPosition.x - position.x,
      0,
      targetPosition.z - position.z
    ).normalize()

    for (let i = 0; i < 5; i++) {
      const particle = new Particle(position, {
        velocity: {
          x: direction.x * (2 + Math.random()),
          y: 0.5 + Math.random(),
          z: direction.z * (2 + Math.random())
        },
        color,
        size: 0.2 + Math.random() * 0.2,
        lifetime: 0.3 + Math.random() * 0.2,
        gravity: -5
      })

      this.addParticle(particle)
    }
  }

  /**
   * Emit impact particles
   */
  public emitImpactEffect(position: Position, color: number = 0xff4444) {
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10
      const speed = 1 + Math.random() * 2

      const particle = new Particle(position, {
        velocity: {
          x: Math.cos(angle) * speed,
          y: 1 + Math.random(),
          z: Math.sin(angle) * speed
        },
        color,
        size: 0.15 + Math.random() * 0.15,
        lifetime: 0.4 + Math.random() * 0.2,
        gravity: -8
      })

      this.addParticle(particle)
    }
  }

  /**
   * Emit death explosion particles
   */
  public emitDeathEffect(position: Position) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3

      const particle = new Particle(position, {
        velocity: {
          x: Math.cos(angle) * speed,
          y: 2 + Math.random() * 2,
          z: Math.sin(angle) * speed
        },
        color: 0x888888,
        size: 0.2 + Math.random() * 0.3,
        lifetime: 0.6 + Math.random() * 0.4,
        gravity: -10
      })

      this.addParticle(particle)
    }
  }

  /**
   * Emit damage number
   */
  public emitDamageNumber(position: Position, damage: number) {
    // Create sprite for damage number
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.width = 128
    canvas.height = 64

    context.font = 'Bold 48px Arial'
    context.fillStyle = '#FF4444'
    context.strokeStyle = '#000000'
    context.lineWidth = 3
    context.textAlign = 'center'
    context.textBaseline = 'middle'

    const text = `-${damage}`
    context.strokeText(text, 64, 32)
    context.fillText(text, 64, 32)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)

    sprite.position.set(position.x, position.y + 2, position.z)
    sprite.scale.set(1, 0.5, 1)

    this.scene.add(sprite)

    // Animate upwards and fade
    const startY = position.y + 2
    const startTime = Date.now()
    const duration = 1000

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = elapsed / duration

      if (progress >= 1) {
        this.scene.remove(sprite)
        sprite.material.dispose()
        texture.dispose()
        return
      }

      sprite.position.y = startY + progress * 2
      sprite.material.opacity = 1 - progress
      requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Emit resource gathering particles
   */
  public emitGatherEffect(position: Position, resourceType: string) {
    const colors: Record<string, number> = {
      tree: 0x228b22,
      gold_mine: 0xffd700,
      stone_mine: 0x808080,
      berry_bush: 0x9370db,
      deer: 0xd2691e
    }

    const color = colors[resourceType] || 0xffffff

    for (let i = 0; i < 3; i++) {
      const particle = new Particle(position, {
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: 0.5 + Math.random() * 0.5,
          z: (Math.random() - 0.5) * 0.5
        },
        color,
        size: 0.1 + Math.random() * 0.1,
        lifetime: 0.5 + Math.random() * 0.3,
        gravity: -3
      })

      this.addParticle(particle)
    }
  }

  /**
   * Add particle to system
   */
  private addParticle(particle: Particle) {
    if (this.particles.length >= this.maxParticles) {
      const oldParticle = this.particles.shift()
      oldParticle?.dispose()
    }

    this.particles.push(particle)
    particle.render(this.scene)
  }

  /**
   * Update all particles
   */
  public update(deltaTime: number) {
    const toRemove: Particle[] = []

    this.particles.forEach(particle => {
      particle.update(deltaTime)
      if (particle.isDead()) {
        toRemove.push(particle)
      }
    })

    toRemove.forEach(particle => {
      const index = this.particles.indexOf(particle)
      if (index > -1) {
        this.particles.splice(index, 1)
        particle.dispose()
      }
    })
  }

  /**
   * Dispose all particles
   */
  public dispose() {
    this.particles.forEach(particle => particle.dispose())
    this.particles = []
  }
}

/**
 * Individual particle
 */
class Particle {
  private mesh: THREE.Mesh
  private velocity: THREE.Vector3
  private lifetime: number
  private maxLifetime: number
  private gravity: number

  constructor(position: Position, config: {
    velocity: { x: number; y: number; z: number }
    color: number
    size: number
    lifetime: number
    gravity: number
  }) {
    this.velocity = new THREE.Vector3(config.velocity.x, config.velocity.y, config.velocity.z)
    this.lifetime = config.lifetime
    this.maxLifetime = config.lifetime
    this.gravity = config.gravity

    const geometry = new THREE.SphereGeometry(config.size, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 1
    })

    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.position.set(position.x, position.y, position.z)
  }

  public update(deltaTime: number) {
    // Apply velocity
    this.mesh.position.x += this.velocity.x * deltaTime
    this.mesh.position.y += this.velocity.y * deltaTime
    this.mesh.position.z += this.velocity.z * deltaTime

    // Apply gravity
    this.velocity.y += this.gravity * deltaTime

    // Update lifetime and opacity
    this.lifetime -= deltaTime
    const lifetimePercent = this.lifetime / this.maxLifetime
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = lifetimePercent

    // Stop at ground level
    if (this.mesh.position.y < 0) {
      this.mesh.position.y = 0
      this.velocity.y = 0
      this.velocity.x *= 0.5
      this.velocity.z *= 0.5
    }
  }

  public isDead(): boolean {
    return this.lifetime <= 0
  }

  public render(scene: THREE.Scene) {
    scene.add(this.mesh)
  }

  public dispose() {
    this.mesh.parent?.remove(this.mesh)
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
