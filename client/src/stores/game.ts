import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface GameState {
  isPlaying: boolean
  isPaused: boolean
  currentTime: number
  selectedUnits: string[]
  resources: {
    food: number
    wood: number
    gold: number
    stone: number
  }
}

export const useGameStore = defineStore('game', () => {
  // State
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const currentTime = ref(0)
  const selectedUnits = ref<string[]>([])
  const resources = ref({
    food: 200,
    wood: 200,
    gold: 100,
    stone: 100
  })

  // Actions
  function startGame() {
    isPlaying.value = true
    isPaused.value = false
    currentTime.value = 0
  }

  function pauseGame() {
    isPaused.value = true
  }

  function resumeGame() {
    isPaused.value = false
  }

  function stopGame() {
    isPlaying.value = false
    isPaused.value = false
    currentTime.value = 0
    selectedUnits.value = []
  }

  function updateTime(deltaTime: number) {
    if (!isPaused.value) {
      currentTime.value += deltaTime
    }
  }

  function selectUnits(unitIds: string[]) {
    selectedUnits.value = unitIds
  }

  function updateResources(newResources: Partial<typeof resources.value>) {
    resources.value = { ...resources.value, ...newResources }
  }

  function addResource(type: keyof typeof resources.value, amount: number) {
    resources.value[type] += amount
  }

  function spendResource(type: keyof typeof resources.value, amount: number): boolean {
    if (resources.value[type] >= amount) {
      resources.value[type] -= amount
      return true
    }
    return false
  }

  return {
    // State
    isPlaying,
    isPaused,
    currentTime,
    selectedUnits,
    resources,
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    stopGame,
    updateTime,
    selectUnits,
    updateResources,
    addResource,
    spendResource
  }
})
