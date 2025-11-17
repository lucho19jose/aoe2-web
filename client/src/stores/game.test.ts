/**
 * Tests for game store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from './game'

describe('Game Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Initial state', () => {
    it('starts with correct default values', () => {
      const store = useGameStore()
      expect(store.isPlaying).toBe(false)
      expect(store.isPaused).toBe(false)
      expect(store.currentTime).toBe(0)
      expect(store.selectedUnits).toEqual([])
      expect(store.resources).toEqual({
        food: 200,
        wood: 200,
        gold: 100,
        stone: 100
      })
    })
  })

  describe('Game controls', () => {
    it('starts game correctly', () => {
      const store = useGameStore()
      store.startGame()
      expect(store.isPlaying).toBe(true)
      expect(store.isPaused).toBe(false)
      expect(store.currentTime).toBe(0)
    })

    it('pauses game correctly', () => {
      const store = useGameStore()
      store.startGame()
      store.pauseGame()
      expect(store.isPaused).toBe(true)
    })

    it('resumes game correctly', () => {
      const store = useGameStore()
      store.startGame()
      store.pauseGame()
      store.resumeGame()
      expect(store.isPaused).toBe(false)
    })

    it('stops game and resets state', () => {
      const store = useGameStore()
      store.startGame()
      store.selectUnits(['unit1', 'unit2'])
      store.updateTime(100)
      store.stopGame()

      expect(store.isPlaying).toBe(false)
      expect(store.isPaused).toBe(false)
      expect(store.currentTime).toBe(0)
      expect(store.selectedUnits).toEqual([])
    })
  })

  describe('Time updates', () => {
    it('updates time when not paused', () => {
      const store = useGameStore()
      store.startGame()
      store.updateTime(10)
      expect(store.currentTime).toBe(10)
      store.updateTime(5)
      expect(store.currentTime).toBe(15)
    })

    it('does not update time when paused', () => {
      const store = useGameStore()
      store.startGame()
      store.pauseGame()
      store.updateTime(10)
      expect(store.currentTime).toBe(0)
    })
  })

  describe('Unit selection', () => {
    it('selects units correctly', () => {
      const store = useGameStore()
      const units = ['unit1', 'unit2', 'unit3']
      store.selectUnits(units)
      expect(store.selectedUnits).toEqual(units)
    })

    it('replaces previously selected units', () => {
      const store = useGameStore()
      store.selectUnits(['unit1'])
      store.selectUnits(['unit2', 'unit3'])
      expect(store.selectedUnits).toEqual(['unit2', 'unit3'])
    })
  })

  describe('Resource management', () => {
    it('updates resources correctly', () => {
      const store = useGameStore()
      store.updateResources({ food: 300, gold: 150 })
      expect(store.resources.food).toBe(300)
      expect(store.resources.gold).toBe(150)
      expect(store.resources.wood).toBe(200) // unchanged
    })

    it('adds resources correctly', () => {
      const store = useGameStore()
      store.addResource('food', 50)
      expect(store.resources.food).toBe(250)
    })

    it('spends resources when sufficient', () => {
      const store = useGameStore()
      const result = store.spendResource('gold', 50)
      expect(result).toBe(true)
      expect(store.resources.gold).toBe(50)
    })

    it('does not spend resources when insufficient', () => {
      const store = useGameStore()
      const result = store.spendResource('gold', 200)
      expect(result).toBe(false)
      expect(store.resources.gold).toBe(100) // unchanged
    })

    it('handles multiple resource operations', () => {
      const store = useGameStore()
      store.addResource('wood', 100)
      store.spendResource('wood', 50)
      store.addResource('stone', 25)
      expect(store.resources.wood).toBe(250)
      expect(store.resources.stone).toBe(125)
    })
  })
})
