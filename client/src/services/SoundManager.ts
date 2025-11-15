/**
 * Sound Manager for handling all game audio
 */

export type SoundType =
  | 'unit_select'
  | 'unit_move'
  | 'unit_attack'
  | 'unit_death'
  | 'building_construct'
  | 'building_complete'
  | 'building_destroy'
  | 'resource_gather'
  | 'button_click'
  | 'alert'
  | 'victory'
  | 'defeat'

interface SoundConfig {
  path: string
  volume: number
  loop?: boolean
}

export class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map()
  private musicTrack: HTMLAudioElement | null = null
  private masterVolume = 1.0
  private sfxVolume = 1.0
  private musicVolume = 0.6
  private isMuted = false

  constructor() {
    this.initializeSounds()
  }

  private initializeSounds() {
    const soundConfigs: Record<SoundType, SoundConfig> = {
      unit_select: { path: '/sounds/unit_select.mp3', volume: 0.5 },
      unit_move: { path: '/sounds/unit_move.mp3', volume: 0.4 },
      unit_attack: { path: '/sounds/unit_attack.mp3', volume: 0.6 },
      unit_death: { path: '/sounds/unit_death.mp3', volume: 0.7 },
      building_construct: { path: '/sounds/building_construct.mp3', volume: 0.5, loop: true },
      building_complete: { path: '/sounds/building_complete.mp3', volume: 0.7 },
      building_destroy: { path: '/sounds/building_destroy.mp3', volume: 0.7 },
      resource_gather: { path: '/sounds/resource_gather.mp3', volume: 0.3 },
      button_click: { path: '/sounds/button_click.mp3', volume: 0.4 },
      alert: { path: '/sounds/alert.mp3', volume: 0.8 },
      victory: { path: '/sounds/victory.mp3', volume: 0.9 },
      defeat: { path: '/sounds/defeat.mp3', volume: 0.9 },
    }

    // Pre-load all sounds
    for (const [type, config] of Object.entries(soundConfigs)) {
      const audio = new Audio()
      audio.volume = config.volume * this.sfxVolume * this.masterVolume
      audio.loop = config.loop || false

      // Note: In production, these files would need to exist
      // For now, we'll silently handle missing files
      audio.onerror = () => {
        console.warn(`Sound file not found: ${config.path}`)
      }

      this.sounds.set(type as SoundType, audio)
    }
  }

  public play(soundType: SoundType) {
    if (this.isMuted) return

    const sound = this.sounds.get(soundType)
    if (sound) {
      // Clone the audio element to allow overlapping sounds
      const clone = sound.cloneNode() as HTMLAudioElement
      clone.volume = sound.volume
      clone.play().catch((error) => {
        // Silently handle play errors (e.g., user hasn't interacted with page yet)
        console.debug('Sound play error:', error)
      })
    }
  }

  public stop(soundType: SoundType) {
    const sound = this.sounds.get(soundType)
    if (sound) {
      sound.pause()
      sound.currentTime = 0
    }
  }

  public playMusic(trackPath: string, loop: boolean = true) {
    if (this.musicTrack) {
      this.stopMusic()
    }

    this.musicTrack = new Audio(trackPath)
    this.musicTrack.volume = this.musicVolume * this.masterVolume
    this.musicTrack.loop = loop
    this.musicTrack.onerror = () => {
      console.warn(`Music file not found: ${trackPath}`)
    }

    if (!this.isMuted) {
      this.musicTrack.play().catch((error) => {
        console.debug('Music play error:', error)
      })
    }
  }

  public stopMusic() {
    if (this.musicTrack) {
      this.musicTrack.pause()
      this.musicTrack.currentTime = 0
      this.musicTrack = null
    }
  }

  public pauseMusic() {
    if (this.musicTrack && !this.musicTrack.paused) {
      this.musicTrack.pause()
    }
  }

  public resumeMusic() {
    if (this.musicTrack && this.musicTrack.paused && !this.isMuted) {
      this.musicTrack.play().catch((error) => {
        console.debug('Music resume error:', error)
      })
    }
  }

  public setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  public setSfxVolume(volume: number) {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
    this.updateAllVolumes()
  }

  public setMusicVolume(volume: number) {
    this.musicVolume = Math.max(0, Math.min(1, volume))
    if (this.musicTrack) {
      this.musicTrack.volume = this.musicVolume * this.masterVolume
    }
  }

  private updateAllVolumes() {
    // Update all sound effects volumes
    this.sounds.forEach((sound) => {
      const baseVolume = parseFloat(sound.dataset.baseVolume || '1')
      sound.volume = baseVolume * this.sfxVolume * this.masterVolume
    })

    // Update music volume
    if (this.musicTrack) {
      this.musicTrack.volume = this.musicVolume * this.masterVolume
    }
  }

  public mute() {
    this.isMuted = true
    this.sounds.forEach((sound) => sound.pause())
    if (this.musicTrack) {
      this.musicTrack.pause()
    }
  }

  public unmute() {
    this.isMuted = false
    if (this.musicTrack) {
      this.musicTrack.play().catch(() => {})
    }
  }

  public toggleMute() {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume
  }

  public getSfxVolume(): number {
    return this.sfxVolume
  }

  public getMusicVolume(): number {
    return this.musicVolume
  }

  public isMutedState(): boolean {
    return this.isMuted
  }

  public dispose() {
    this.stopMusic()
    this.sounds.forEach((sound) => {
      sound.pause()
      sound.src = ''
    })
    this.sounds.clear()
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager()
  }
  return soundManagerInstance
}

export function disposeSoundManager() {
  if (soundManagerInstance) {
    soundManagerInstance.dispose()
    soundManagerInstance = null
  }
}
