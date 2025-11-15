import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Unit, Building, Player, Resources } from '@/types/game'
import { getGameWebSocket, disconnectGameWebSocket } from '@/services/WebSocketService'

/**
 * Game synchronization store - manages multiplayer game state
 */
export const useGameSyncStore = defineStore('gameSync', () => {
  // Connection state
  const isConnected = ref(false)
  const currentGameId = ref<string | null>(null)
  const ws = ref<any>(null)

  // Game state
  const players = ref<Map<string, Player>>(new Map())
  const units = ref<Map<string, Unit>>(new Map())
  const buildings = ref<Map<string, Building>>(new Map())
  const currentPlayerId = ref<string | null>(null)

  // Game status
  const gameStatus = ref<'waiting' | 'starting' | 'in_progress' | 'finished'>('waiting')
  const gameTime = ref(0)
  const isPaused = ref(false)

  // Computed
  const currentPlayer = computed(() => {
    return currentPlayerId.value ? players.value.get(currentPlayerId.value) : null
  })

  const playerUnits = computed(() => {
    if (!currentPlayerId.value) return []
    return Array.from(units.value.values()).filter(
      (unit) => unit.ownerId === currentPlayerId.value
    )
  })

  const playerBuildings = computed(() => {
    if (!currentPlayerId.value) return []
    return Array.from(buildings.value.values()).filter(
      (building) => building.ownerId === currentPlayerId.value
    )
  })

  const playerResources = computed((): Resources => {
    return currentPlayer.value?.resources || { food: 0, wood: 0, gold: 0, stone: 0 }
  })

  const playerPopulation = computed(() => {
    return currentPlayer.value?.population || 0
  })

  const playerMaxPopulation = computed(() => {
    return currentPlayer.value?.maxPopulation || 0
  })

  // Actions
  async function connectToGame(gameId: string, playerId: string) {
    try {
      currentGameId.value = gameId
      currentPlayerId.value = playerId

      ws.value = getGameWebSocket(gameId)
      await ws.value.connect()

      setupWebSocketHandlers()
      isConnected.value = true

      console.log(`Connected to game ${gameId}`)
    } catch (error) {
      console.error('Failed to connect to game:', error)
      throw error
    }
  }

  function setupWebSocketHandlers() {
    if (!ws.value) return

    // Connection status
    ws.value.on('connected', () => {
      isConnected.value = true
      console.log('WebSocket connected')
    })

    ws.value.on('disconnected', () => {
      isConnected.value = false
      console.log('WebSocket disconnected')
    })

    // Game state updates
    ws.value.on('game_state', (message: any) => {
      updateGameState(message.data)
    })

    // Unit updates
    ws.value.on('unit_update', (message: any) => {
      handleUnitUpdate(message.data)
    })

    ws.value.on('unit_created', (message: any) => {
      handleUnitCreated(message.data)
    })

    ws.value.on('unit_destroyed', (message: any) => {
      handleUnitDestroyed(message.data)
    })

    // Building updates
    ws.value.on('building_update', (message: any) => {
      handleBuildingUpdate(message.data)
    })

    ws.value.on('building_created', (message: any) => {
      handleBuildingCreated(message.data)
    })

    ws.value.on('building_destroyed', (message: any) => {
      handleBuildingDestroyed(message.data)
    })

    // Resource updates
    ws.value.on('resource_update', (message: any) => {
      handleResourceUpdate(message.data)
    })

    // Player updates
    ws.value.on('player_joined', (message: any) => {
      handlePlayerJoined(message.data)
    })

    ws.value.on('player_left', (message: any) => {
      handlePlayerLeft(message.data)
    })

    // Game status updates
    ws.value.on('game_started', () => {
      gameStatus.value = 'in_progress'
    })

    ws.value.on('game_paused', () => {
      isPaused.value = true
    })

    ws.value.on('game_resumed', () => {
      isPaused.value = false
    })

    ws.value.on('game_finished', (message: any) => {
      gameStatus.value = 'finished'
      console.log('Game finished:', message.data)
    })
  }

  function updateGameState(state: any) {
    // Update players
    if (state.players) {
      players.value.clear()
      state.players.forEach((player: Player) => {
        players.value.set(player.id, player)
      })
    }

    // Update units
    if (state.units) {
      units.value.clear()
      state.units.forEach((unit: Unit) => {
        units.value.set(unit.id, unit)
      })
    }

    // Update buildings
    if (state.buildings) {
      buildings.value.clear()
      state.buildings.forEach((building: Building) => {
        buildings.value.set(building.id, building)
      })
    }

    // Update game status
    if (state.status) {
      gameStatus.value = state.status
    }

    if (state.time !== undefined) {
      gameTime.value = state.time
    }
  }

  function handleUnitUpdate(data: any) {
    const unit = units.value.get(data.id)
    if (unit) {
      Object.assign(unit, data)
    }
  }

  function handleUnitCreated(data: any) {
    units.value.set(data.id, data)
  }

  function handleUnitDestroyed(data: any) {
    units.value.delete(data.id)
  }

  function handleBuildingUpdate(data: any) {
    const building = buildings.value.get(data.id)
    if (building) {
      Object.assign(building, data)
    }
  }

  function handleBuildingCreated(data: any) {
    buildings.value.set(data.id, data)
  }

  function handleBuildingDestroyed(data: any) {
    buildings.value.delete(data.id)
  }

  function handleResourceUpdate(data: any) {
    const player = players.value.get(data.playerId)
    if (player) {
      player.resources = data.resources
    }
  }

  function handlePlayerJoined(data: any) {
    players.value.set(data.id, data)
  }

  function handlePlayerLeft(data: any) {
    players.value.delete(data.id)
  }

  // Send commands to server
  function sendUnitCommand(unitIds: string[], command: string, target?: any) {
    if (!ws.value || !isConnected.value) return

    ws.value.sendUnitCommand(unitIds, command, target)
  }

  function sendBuildCommand(buildingType: string, position: any) {
    if (!ws.value || !isConnected.value) return

    ws.value.sendBuildCommand(buildingType, position)
  }

  function sendChatMessage(message: string) {
    if (!ws.value || !isConnected.value) return

    ws.value.sendChatMessage(message)
  }

  function requestGameState() {
    if (!ws.value || !isConnected.value) return

    ws.value.requestGameState()
  }

  function disconnectFromGame() {
    if (ws.value) {
      disconnectGameWebSocket()
      ws.value = null
    }

    isConnected.value = false
    currentGameId.value = null
    players.value.clear()
    units.value.clear()
    buildings.value.clear()
  }

  function reset() {
    disconnectFromGame()
    currentPlayerId.value = null
    gameStatus.value = 'waiting'
    gameTime.value = 0
    isPaused.value = false
  }

  return {
    // State
    isConnected,
    currentGameId,
    players,
    units,
    buildings,
    currentPlayerId,
    gameStatus,
    gameTime,
    isPaused,

    // Computed
    currentPlayer,
    playerUnits,
    playerBuildings,
    playerResources,
    playerPopulation,
    playerMaxPopulation,

    // Actions
    connectToGame,
    sendUnitCommand,
    sendBuildCommand,
    sendChatMessage,
    requestGameState,
    disconnectFromGame,
    reset,
  }
})
