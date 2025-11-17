<template>
  <div class="single-player-lobby">
    <div class="container">
      <div class="header">
        <q-btn flat icon="arrow_back" label="Volver" @click="goBack" />
        <h2>Configuración de Partida</h2>
        <div style="width: 100px"></div>
      </div>

      <div class="content">
        <div class="config-panels">
          <!-- Map Selection -->
          <div class="config-panel">
            <h3>Seleccionar Mapa</h3>
            <div class="map-grid">
              <div
                v-for="map in maps"
                :key="map.id"
                class="map-card"
                :class="{ selected: selectedMap === map.id }"
                @click="selectedMap = map.id"
              >
                <div class="map-icon">
                  <q-icon :name="map.icon" size="48px" />
                </div>
                <div class="map-name">{{ map.name }}</div>
                <div class="map-description">{{ map.description }}</div>
              </div>
            </div>
          </div>

          <!-- Map Size -->
          <div class="config-panel">
            <h3>Tamaño del Mapa</h3>
            <q-btn-toggle
              v-model="mapSize"
              toggle-color="primary"
              :options="[
                { label: 'Pequeño', value: 'small' },
                { label: 'Mediano', value: 'medium' },
                { label: 'Grande', value: 'large' }
              ]"
            />
          </div>

          <!-- Civilization Selection -->
          <div class="config-panel">
            <h3>Tu Civilización</h3>
            <q-select
              v-model="selectedCivilization"
              :options="civilizations"
              option-value="id"
              option-label="name"
              outlined
              dark
              bg-color="rgba(255,255,255,0.1)"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.name }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <div v-if="selectedCivilization" class="civ-bonuses">
              <h4>Bonificaciones:</h4>
              <ul>
                <li v-for="(bonus, index) in selectedCivilization.bonuses" :key="index">
                  {{ bonus.description }}
                </li>
              </ul>
              <div class="unique-unit">
                <strong>Unidad Única:</strong> {{ selectedCivilization.uniqueUnit.name }} -
                {{ selectedCivilization.uniqueUnit.description }}
              </div>
            </div>
          </div>

          <!-- AI Opponents -->
          <div class="config-panel">
            <h3>Oponentes IA</h3>
            <div class="ai-config">
              <div class="ai-count">
                <label>Número de oponentes:</label>
                <q-slider
                  v-model="aiOpponents"
                  :min="0"
                  :max="7"
                  :step="1"
                  label
                  label-always
                  color="primary"
                />
              </div>

              <div class="ai-difficulty">
                <label>Dificultad:</label>
                <q-btn-toggle
                  v-model="aiDifficulty"
                  toggle-color="primary"
                  :options="[
                    { label: 'Fácil', value: 'easy' },
                    { label: 'Medio', value: 'medium' },
                    { label: 'Difícil', value: 'hard' }
                  ]"
                />
              </div>

              <div v-if="aiOpponents > 0" class="ai-civilizations">
                <h4>Civilizaciones IA:</h4>
                <div v-for="i in aiOpponents" :key="i" class="ai-civ-row">
                  <span>IA {{ i }}:</span>
                  <q-select
                    v-model="aiCivilizations[i - 1]"
                    :options="civilizations"
                    option-value="id"
                    option-label="name"
                    outlined
                    dense
                    dark
                    bg-color="rgba(255,255,255,0.1)"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Victory Conditions -->
          <div class="config-panel">
            <h3>Condiciones de Victoria</h3>
            <q-option-group
              v-model="victoryConditions"
              :options="[
                { label: 'Conquista (Destruir todos los enemigos)', value: 'conquest' },
                { label: 'Maravilla (Construir y mantener una Maravilla)', value: 'wonder' },
                { label: 'Reliquias (Controlar todas las reliquias)', value: 'relic' },
                { label: 'Todas las anteriores', value: 'all' }
              ]"
              color="primary"
              dark
            />
          </div>

          <!-- Starting Resources -->
          <div class="config-panel">
            <h3>Recursos Iniciales</h3>
            <q-btn-toggle
              v-model="startingResources"
              toggle-color="primary"
              :options="[
                { label: 'Estándar', value: 'standard' },
                { label: 'Bajo', value: 'low' },
                { label: 'Alto', value: 'high' },
                { label: 'Infinito', value: 'infinite' }
              ]"
            />
          </div>
        </div>

        <!-- Start Game Button -->
        <div class="actions">
          <q-btn
            size="lg"
            color="primary"
            label="Comenzar Partida"
            icon="play_arrow"
            @click="startGame"
            :disable="!canStartGame"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAllCivilizations } from '@/config/civilizations'
import type { Civilization } from '@/config/civilizations'

const router = useRouter()

// Map options
const maps = ref([
  {
    id: 'arabia',
    name: 'Arabia',
    description: 'Mapa abierto con recursos balanceados',
    icon: 'terrain'
  },
  {
    id: 'black_forest',
    name: 'Selva Negra',
    description: 'Bosques densos rodean a cada jugador',
    icon: 'park'
  },
  {
    id: 'oasis',
    name: 'Oasis',
    description: 'Agua en el centro, recursos alrededor',
    icon: 'water'
  },
  {
    id: 'nomad',
    name: 'Nómada',
    description: 'Sin centro urbano inicial, empieza con aldeanos',
    icon: 'directions_walk'
  }
])

const selectedMap = ref('arabia')
const mapSize = ref('medium')

// Civilizations
const civilizations = ref<Civilization[]>(getAllCivilizations())
const selectedCivilization = ref<Civilization | null>(civilizations.value[0])

// AI Configuration
const aiOpponents = ref(1)
const aiDifficulty = ref('medium')
const aiCivilizations = ref<(Civilization | null)[]>(
  Array(7).fill(null).map(() => civilizations.value[1])
)

// Victory and Resources
const victoryConditions = ref('all')
const startingResources = ref('standard')

const canStartGame = computed(() => {
  return selectedMap.value && selectedCivilization.value
})

const goBack = () => {
  router.push('/')
}

const startGame = () => {
  const gameConfig = {
    mode: 'single_player',
    map: {
      type: selectedMap.value,
      size: mapSize.value
    },
    civilization: selectedCivilization.value?.id,
    ai: {
      opponents: aiOpponents.value,
      difficulty: aiDifficulty.value,
      civilizations: aiCivilizations.value.slice(0, aiOpponents.value).map(c => c?.id)
    },
    victoryConditions: victoryConditions.value,
    startingResources: startingResources.value
  }

  console.log('Starting game with config:', gameConfig)

  // Store config in session storage
  sessionStorage.setItem('gameConfig', JSON.stringify(gameConfig))

  // Navigate to game
  router.push('/game')
}
</script>

<style lang="scss" scoped>
.single-player-lobby {
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

.config-panels {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 2rem;
}

.config-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);

  h3 {
    color: #f0a500;
    margin: 0 0 1rem 0;
    font-size: 1.3rem;
  }

  h4 {
    color: #ffd700;
    margin: 1rem 0 0.5rem 0;
    font-size: 1rem;
  }
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.map-card {
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: rgba(240, 165, 0, 0.5);
    transform: translateY(-4px);
  }

  &.selected {
    border-color: #f0a500;
    background: rgba(240, 165, 0, 0.2);
  }

  .map-icon {
    color: #f0a500;
    margin-bottom: 0.5rem;
  }

  .map-name {
    color: white;
    font-size: 1.1rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .map-description {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
}

.civ-bonuses {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  color: white;

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;

    li {
      margin: 0.3rem 0;
      color: rgba(255, 255, 255, 0.9);
    }
  }

  .unique-unit {
    margin-top: 1rem;
    padding: 0.5rem;
    background: rgba(240, 165, 0, 0.2);
    border-radius: 4px;
    color: #ffd700;
  }
}

.ai-config {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  label {
    color: white;
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
}

.ai-civilizations {
  margin-top: 1rem;
}

.ai-civ-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;

  span {
    color: white;
    min-width: 60px;
  }

  .q-select {
    flex: 1;
  }
}

.actions {
  text-align: center;
  padding: 2rem 0;
}

:deep(.q-field__control) {
  color: white;
}

:deep(.q-field__native) {
  color: white;
}
</style>
