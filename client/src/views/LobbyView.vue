<template>
  <div class="lobby-view">
    <div class="container">
      <div class="header">
        <q-btn flat icon="arrow_back" label="Volver" @click="goBack" />
        <h2>Lobby Multijugador</h2>
        <div style="width: 100px"></div>
      </div>

      <div class="content">
        <!-- Matchmaking Section -->
        <div class="matchmaking-section">
          <div class="matchmaking-panel">
            <h3>Búsqueda Rápida (Matchmaking)</h3>
            <div class="matchmaking-options">
              <div class="option-group">
                <label>Modo de Juego:</label>
                <q-btn-toggle
                  v-model="matchmakingMode"
                  toggle-color="primary"
                  :options="[
                    { label: '1v1', value: '1v1' },
                    { label: '2v2', value: '2v2' },
                    { label: '3v3', value: '3v3' },
                    { label: '4v4', value: '4v4' }
                  ]"
                />
              </div>

              <div class="option-group">
                <label>Tipo de Partida:</label>
                <q-btn-toggle
                  v-model="matchType"
                  toggle-color="primary"
                  :options="[
                    { label: 'Casual', value: 'casual' },
                    { label: 'Clasificatoria', value: 'ranked' }
                  ]"
                />
              </div>

              <div class="player-stats" v-if="matchType === 'ranked'">
                <div class="stat">
                  <span class="label">ELO:</span>
                  <span class="value">{{ playerElo }}</span>
                </div>
                <div class="stat">
                  <span class="label">Victorias:</span>
                  <span class="value">{{ playerWins }}</span>
                </div>
                <div class="stat">
                  <span class="label">Derrotas:</span>
                  <span class="value">{{ playerLosses }}</span>
                </div>
              </div>
            </div>

            <div class="matchmaking-action">
              <q-btn
                v-if="!isSearching"
                size="lg"
                color="primary"
                label="Buscar Partida"
                icon="search"
                @click="startMatchmaking"
              />
              <div v-else class="searching-indicator">
                <q-spinner-dots color="primary" size="60px" />
                <div class="searching-text">
                  Buscando oponentes...
                  <div class="search-time">{{ searchTime }}s</div>
                </div>
                <q-btn
                  flat
                  color="negative"
                  label="Cancelar"
                  @click="cancelMatchmaking"
                />
              </div>
            </div>
          </div>
        </div>

        <q-separator dark />

        <!-- Custom Games Section -->
        <div class="custom-games-section">
          <div class="section-header">
            <h3>Partidas Personalizadas</h3>
            <q-btn color="primary" label="Crear Partida" @click="showCreateDialog = true" />
          </div>

          <div class="game-list">
            <q-list bordered separator>
              <q-item
                v-for="game in availableGames"
                :key="game.id"
                clickable
                @click="joinGame(game)"
              >
                <q-item-section>
                  <q-item-label>
                    <q-icon :name="getMapIcon(game.map)" />
                    {{ game.name }}
                  </q-item-label>
                  <q-item-label caption>
                    {{ game.map }} - {{ game.mapSize }} | {{ game.players }}/{{ game.maxPlayers }} jugadores
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <div class="game-info">
                    <q-badge :color="game.status === 'waiting' ? 'green' : 'orange'">
                      {{ getStatusLabel(game.status) }}
                    </q-badge>
                    <div class="game-elo" v-if="game.isRanked">
                      ELO: {{ game.avgElo }}±{{ game.eloRange }}
                    </div>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>

            <div v-if="availableGames.length === 0" class="no-games">
              <q-icon name="info" size="48px" color="grey" />
              <p>No hay partidas disponibles. ¡Crea una nueva!</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Game Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card class="create-game-card">
        <q-card-section>
          <div class="text-h6">Crear Partida Personalizada</div>
        </q-card-section>

        <q-card-section>
          <q-input
            v-model="newGame.name"
            label="Nombre de la partida"
            outlined
            dark
          />

          <q-select
            v-model="newGame.map"
            :options="mapOptions"
            label="Mapa"
            outlined
            dark
          />

          <q-select
            v-model="newGame.mapSize"
            :options="['Pequeño', 'Mediano', 'Grande']"
            label="Tamaño"
            outlined
            dark
          />

          <q-input
            v-model.number="newGame.maxPlayers"
            type="number"
            label="Máximo de jugadores"
            outlined
            dark
            :min="2"
            :max="8"
          />

          <q-toggle
            v-model="newGame.isRanked"
            label="Partida clasificatoria"
            dark
          />

          <q-toggle
            v-model="newGame.isPrivate"
            label="Partida privada (con contraseña)"
            dark
          />

          <q-input
            v-if="newGame.isPrivate"
            v-model="newGame.password"
            label="Contraseña"
            type="password"
            outlined
            dark
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancelar" color="grey" v-close-popup />
          <q-btn label="Crear" color="primary" @click="createGame" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Matchmaking
const matchmakingMode = ref('1v1')
const matchType = ref('casual')
const isSearching = ref(false)
const searchTime = ref(0)
let searchInterval: number | null = null

// Player stats (mock data)
const playerElo = ref(1200)
const playerWins = ref(15)
const playerLosses = ref(10)

// Available games
const availableGames = ref([
  {
    id: 1,
    name: 'Arabia Rush',
    map: 'Arabia',
    mapSize: 'Mediano',
    players: 2,
    maxPlayers: 4,
    status: 'waiting',
    isRanked: false,
    avgElo: 1150,
    eloRange: 100
  },
  {
    id: 2,
    name: 'Black Forest 1v1',
    map: 'Selva Negra',
    mapSize: 'Grande',
    players: 1,
    maxPlayers: 2,
    status: 'waiting',
    isRanked: true,
    avgElo: 1300,
    eloRange: 50
  },
  {
    id: 3,
    name: 'Team Game - Oasis',
    map: 'Oasis',
    mapSize: 'Grande',
    players: 6,
    maxPlayers: 8,
    status: 'starting',
    isRanked: false,
    avgElo: 1100,
    eloRange: 200
  }
])

// Create game dialog
const showCreateDialog = ref(false)
const newGame = ref({
  name: '',
  map: 'Arabia',
  mapSize: 'Mediano',
  maxPlayers: 2,
  isRanked: false,
  isPrivate: false,
  password: ''
})

const mapOptions = ['Arabia', 'Selva Negra', 'Oasis', 'Nómada']

const goBack = () => {
  router.push('/')
}

const getMapIcon = (mapName: string) => {
  const icons: Record<string, string> = {
    'Arabia': 'terrain',
    'Selva Negra': 'park',
    'Oasis': 'water',
    'Nómada': 'directions_walk'
  }
  return icons[mapName] || 'map'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'waiting': 'Esperando',
    'starting': 'Iniciando',
    'in_progress': 'En progreso'
  }
  return labels[status] || status
}

const startMatchmaking = () => {
  isSearching.value = true
  searchTime.value = 0

  searchInterval = window.setInterval(() => {
    searchTime.value++

    // Simulate finding a match after random time (5-15 seconds)
    if (searchTime.value >= 5 && Math.random() > 0.7) {
      matchFound()
    }
  }, 1000)

  console.log(`Starting matchmaking: ${matchmakingMode.value} ${matchType.value}`)
}

const cancelMatchmaking = () => {
  isSearching.value = false
  if (searchInterval) {
    clearInterval(searchInterval)
    searchInterval = null
  }
  searchTime.value = 0
}

const matchFound = () => {
  cancelMatchmaking()
  console.log('Match found!')

  // Simulate match found notification
  const config = {
    mode: 'multiplayer',
    matchmaking: {
      mode: matchmakingMode.value,
      type: matchType.value
    }
  }

  sessionStorage.setItem('gameConfig', JSON.stringify(config))
  router.push('/game')
}

const joinGame = (game: any) => {
  console.log('Joining game:', game.id)

  const config = {
    mode: 'multiplayer',
    gameId: game.id,
    map: {
      type: game.map.toLowerCase().replace(' ', '_'),
      size: game.mapSize
    }
  }

  sessionStorage.setItem('gameConfig', JSON.stringify(config))
  router.push('/game')
}

const createGame = () => {
  const game = {
    id: Date.now(),
    name: newGame.value.name || 'Nueva Partida',
    map: newGame.value.map,
    mapSize: newGame.value.mapSize,
    players: 1,
    maxPlayers: newGame.value.maxPlayers,
    status: 'waiting',
    isRanked: newGame.value.isRanked,
    avgElo: playerElo.value,
    eloRange: 100
  }

  availableGames.value.push(game)
  showCreateDialog.value = false

  // Reset form
  newGame.value = {
    name: '',
    map: 'Arabia',
    mapSize: 'Mediano',
    maxPlayers: 2,
    isRanked: false,
    isPrivate: false,
    password: ''
  }

  console.log('Created game:', game)
}

onUnmounted(() => {
  if (searchInterval) {
    clearInterval(searchInterval)
  }
})
</script>

<style lang="scss" scoped>
.lobby-view {
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
  overflow-y: auto;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  h2 {
    color: #f0a500;
    font-size: 2rem;
    margin: 0;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

// Matchmaking Section
.matchmaking-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.matchmaking-panel {
  h3 {
    color: #f0a500;
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
  }
}

.matchmaking-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.option-group {
  label {
    color: white;
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
}

.player-stats {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;

    .label {
      color: rgba(255, 255, 255, 0.7);
      font-size: 0.9rem;
    }

    .value {
      color: #f0a500;
      font-size: 1.5rem;
      font-weight: bold;
    }
  }
}

.matchmaking-action {
  text-align: center;
}

.searching-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;

  .searching-text {
    color: white;
    font-size: 1.2rem;
    text-align: center;

    .search-time {
      color: #f0a500;
      font-size: 1.5rem;
      font-weight: bold;
      margin-top: 0.5rem;
    }
  }
}

// Custom Games Section
.custom-games-section {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 2rem;
  backdrop-filter: blur(10px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  h3 {
    color: #f0a500;
    margin: 0;
    font-size: 1.5rem;
  }
}

.game-list {
  min-height: 300px;

  .q-item {
    background: rgba(0, 0, 0, 0.2);
    margin-bottom: 0.5rem;
    border-radius: 8px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(0, 0, 0, 0.4);
      transform: translateX(4px);
    }
  }
}

.game-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;

  .game-elo {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }
}

.no-games {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(255, 255, 255, 0.5);

  p {
    margin-top: 1rem;
    font-size: 1.1rem;
  }
}

// Create Game Dialog
.create-game-card {
  min-width: 500px;
  background: #1a1a2e;

  .q-card-section {
    &:not(:last-child) {
      padding-bottom: 0;
    }

    > * {
      margin-bottom: 1rem;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .text-h6 {
    color: #f0a500;
  }
}

:deep(.q-field__control) {
  color: white;
}

:deep(.q-field__native) {
  color: white;
}

:deep(.q-toggle__label) {
  color: white;
}
</style>
