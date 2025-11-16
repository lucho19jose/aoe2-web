/**
 * Sound Service for game audio effects
 */

export enum SoundType {
  // Combat sounds
  SWORD_HIT = 'sword_hit',
  ARROW_SHOT = 'arrow_shot',
  UNIT_DIE = 'unit_die',
  BUILDING_DESTROY = 'building_destroy',

  // Production sounds
  UNIT_TRAINED = 'unit_trained',
  BUILDING_COMPLETE = 'building_complete',
  RESEARCH_COMPLETE = 'research_complete',

  // UI sounds
  CLICK = 'click',
  SELECT = 'select',
  ERROR = 'error',

  // Resource gathering
  CHOP_WOOD = 'chop_wood',
  MINE_GOLD = 'mine_gold',
  MINE_STONE = 'mine_stone',
  GATHER_FOOD = 'gather_food'
}

interface Sound {
  audio: HTMLAudioElement
  volume: number
  loop: boolean
}

export class SoundService {
  private sounds: Map<SoundType, Sound> = new Map()
  private masterVolume: number = 0.7
  private isMuted: boolean = false
  private soundEnabled: boolean = true

  constructor() {
    this.initializeSounds()
  }

  /**
   * Initialize sound effects
   * For now, we'll use Web Audio API to generate simple sounds
   * In production, you would load actual audio files
   */
  private initializeSounds() {
    // Create audio context for generating sounds
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Helper function to create a simple beep sound
    const createBeep = (frequency: number, duration: number, volume: number = 0.3): HTMLAudioElement => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration)

      const audio = new Audio()
      // For now, return empty audio element as placeholder
      // In production, load real audio files here
      return audio
    }

    // Register placeholder sounds
    // In production, replace with actual audio file loading
    this.registerSound(SoundType.SWORD_HIT, 0.5, false)
    this.registerSound(SoundType.ARROW_SHOT, 0.4, false)
    this.registerSound(SoundType.UNIT_DIE, 0.6, false)
    this.registerSound(SoundType.BUILDING_DESTROY, 0.7, false)
    this.registerSound(SoundType.UNIT_TRAINED, 0.5, false)
    this.registerSound(SoundType.BUILDING_COMPLETE, 0.6, false)
    this.registerSound(SoundType.RESEARCH_COMPLETE, 0.6, false)
    this.registerSound(SoundType.CLICK, 0.3, false)
    this.registerSound(SoundType.SELECT, 0.4, false)
    this.registerSound(SoundType.ERROR, 0.5, false)
    this.registerSound(SoundType.CHOP_WOOD, 0.4, false)
    this.registerSound(SoundType.MINE_GOLD, 0.4, false)
    this.registerSound(SoundType.MINE_STONE, 0.4, false)
    this.registerSound(SoundType.GATHER_FOOD, 0.4, false)

    console.log('✅ Sound Service initialized')
  }

  /**
   * Register a sound
   */
  private registerSound(type: SoundType, volume: number = 0.5, loop: boolean = false) {
    const audio = new Audio()
    // In production, set audio.src to actual sound file path
    // audio.src = `/sounds/${type}.mp3`

    this.sounds.set(type, {
      audio,
      volume,
      loop
    })
  }

  /**
   * Play a sound effect
   */
  public play(type: SoundType, volumeMultiplier: number = 1.0) {
    if (!this.soundEnabled || this.isMuted) return

    const sound = this.sounds.get(type)
    if (!sound) {
      console.warn(`Sound ${type} not found`)
      return
    }

    try {
      const audio = sound.audio.cloneNode() as HTMLAudioElement
      audio.volume = sound.volume * this.masterVolume * volumeMultiplier
      audio.loop = sound.loop

      audio.play().catch(error => {
        // Ignore autoplay errors (user hasn't interacted yet)
        if (error.name !== 'NotAllowedError') {
          console.warn(`Error playing sound ${type}:`, error)
        }
      })
    } catch (error) {
      console.warn(`Error playing sound ${type}:`, error)
    }
  }

  /**
   * Play combat sound based on unit type
   */
  public playCombatSound(unitType: string) {
    switch (unitType.toLowerCase()) {
      case 'archer':
      case 'crossbowman':
      case 'skirmisher':
        this.play(SoundType.ARROW_SHOT)
        break
      case 'militia':
      case 'swordsman':
      case 'knight':
      default:
        this.play(SoundType.SWORD_HIT)
        break
    }
  }

  /**
   * Play resource gathering sound
   */
  public playGatherSound(resourceType: string) {
    switch (resourceType.toLowerCase()) {
      case 'tree':
        this.play(SoundType.CHOP_WOOD)
        break
      case 'gold_mine':
        this.play(SoundType.MINE_GOLD)
        break
      case 'stone_mine':
        this.play(SoundType.MINE_STONE)
        break
      case 'berry_bush':
      case 'deer':
      case 'fish':
        this.play(SoundType.GATHER_FOOD)
        break
    }
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Get master volume
   */
  public getMasterVolume(): number {
    return this.masterVolume
  }

  /**
   * Mute/unmute all sounds
   */
  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  /**
   * Toggle mute
   */
  public toggleMute(): boolean {
    this.isMuted = !this.isMuted
    return this.isMuted
  }

  /**
   * Enable/disable sound system
   */
  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll() {
    this.sounds.forEach(sound => {
      sound.audio.pause()
      sound.audio.currentTime = 0
    })
  }
}

// Singleton instance
let soundService: SoundService | null = null

export function getSoundService(): SoundService {
  if (!soundService) {
    soundService = new SoundService()
  }
  return soundService
}
