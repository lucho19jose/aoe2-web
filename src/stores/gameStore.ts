import { defineStore } from 'pinia'
import { Engine } from '@/core/Engine'

export const useGameStore = defineStore('game', {
  state: () => ({
    engine: null as Engine | null,
    isRunning: false
  }),

  actions: {
    initialize(canvas: HTMLCanvasElement) {
      this.engine = new Engine(canvas)
      this.engine.start()
      this.isRunning = true
    },

    cleanup() {
      if (this.engine) {
        this.engine.stop()
        this.isRunning = false
      }
    },

    handleMouseDown(event: MouseEvent) {
      this.engine?.handleMouseDown(event)
    },

    handleMouseMove(event: MouseEvent) {
      this.engine?.handleMouseMove(event)
    },

    handleMouseUp(event: MouseEvent) {
      this.engine?.handleMouseUp(event)
    }
  }
})
