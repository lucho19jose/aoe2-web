/**
 * Unit tests for game store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGameStore } from '@/stores/game'

describe('Game Store', () => {
  beforeEach(() => {
    // Create a fresh pinia instance for each test
    setActivePinia(createPinia())
  })

  it('initializes with default values', () => {
    const store = useGameStore()

    expect(store.isGameActive).toBe(false)
    expect(store.selectedUnits).toEqual([])
    expect(store.resources).toBeDefined()
  })

  it('can start a new game', () => {
    const store = useGameStore()

    store.startNewGame()

    expect(store.isGameActive).toBe(true)
  })

  it('can select units', () => {
    const store = useGameStore()

    const mockUnit = { id: '1', type: 'villager' }
    store.selectUnit(mockUnit as any)

    expect(store.selectedUnits).toContain(mockUnit)
  })

  it('can clear selected units', () => {
    const store = useGameStore()

    const mockUnit = { id: '1', type: 'villager' }
    store.selectUnit(mockUnit as any)
    expect(store.selectedUnits.length).toBe(1)

    store.clearSelection()
    expect(store.selectedUnits).toEqual([])
  })
})
