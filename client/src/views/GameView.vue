<template>
  <div class="game-view">
    <!-- Game canvas -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <!-- HUD Overlay -->
    <div class="hud-overlay">
      <!-- Top bar -->
      <div class="top-bar">
        <div class="resources">
          <div class="resource">
            <q-icon name="food_bank" size="24px" />
            <span>{{ resources.food }}</span>
          </div>
          <div class="resource">
            <q-icon name="forest" size="24px" />
            <span>{{ resources.wood }}</span>
          </div>
          <div class="resource">
            <q-icon name="diamond" size="24px" />
            <span>{{ resources.gold }}</span>
          </div>
          <div class="resource">
            <q-icon name="architecture" size="24px" />
            <span>{{ resources.stone }}</span>
          </div>
          <div class="resource population">
            <q-icon name="groups" size="24px" />
            <span :class="{ 'population-warning': population.current >= population.max }">
              {{ population.current }}/{{ population.max }}
            </span>
          </div>
        </div>
        <div class="game-time">{{ gameTime }}</div>
        <div class="formation-indicator">
          <q-icon name="format_shapes" size="20px" />
          <span>{{ currentFormation }}</span>
        </div>
        <q-btn
          flat
          round
          icon="menu"
          color="white"
          @click="showGameMenu = true"
        />
      </div>

      <!-- Bottom UI -->
      <div class="bottom-ui">
        <div class="minimap">
          <canvas ref="minimapCanvas" width="200" height="200"></canvas>
        </div>
        <div class="control-panel">
          <div v-if="selectedBuilding && selectedBuilding.canProduce?.length > 0" class="building-info">
            <production-panel
              :building="selectedBuilding"
              :resources="resources"
              @train="handleTrainUnit"
              @cancel="handleCancelUnit"
            />
          </div>
          <div v-else-if="selectedBuilding && hasResearchTech(selectedBuilding)" class="building-info">
            <research-panel
              :building="selectedBuilding"
              :resources="resources"
              :researched-techs="researchedTechs"
              @research="handleResearch"
              @cancel="handleCancelResearch"
            />
          </div>
          <div v-else-if="selectedUnit" class="unit-info">
            <p><strong>{{ selectedUnit.name }}</strong></p>
            <div class="unit-stats">
              <div>HP: {{ selectedUnit.hp }}/{{ selectedUnit.maxHp }}</div>
              <div>Attack: {{ selectedUnit.attack }}</div>
            </div>
          </div>
          <div v-else class="no-selection">
            <p>No unit selected</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Menu Dialog -->
    <q-dialog v-model="showGameMenu">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">Game Menu</div>
        </q-card-section>
        <q-card-section>
          <q-btn label="Resume" color="primary" class="full-width q-mb-sm" @click="showGameMenu = false" />
          <q-btn label="Settings" color="primary" class="full-width q-mb-sm" @click="goToSettings" />
          <q-btn label="Exit to Menu" color="negative" class="full-width" @click="exitGame" />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Victory/Defeat Dialog -->
    <q-dialog v-model="showVictoryDialog" persistent>
      <q-card style="min-width: 400px" :class="victoryState.result === 'victory' ? 'victory-card' : 'defeat-card'">
        <q-card-section class="text-center">
          <div class="text-h4 q-mb-md">
            <q-icon
              :name="victoryState.result === 'victory' ? 'emoji_events' : 'cancel'"
              size="64px"
              :color="victoryState.result === 'victory' ? 'yellow-8' : 'red-8'"
            />
          </div>
          <div class="text-h5">
            {{ victoryState.result === 'victory' ? '¡VICTORIA!' : victoryState.result === 'defeat' ? '¡DERROTA!' : '¡EMPATE!' }}
          </div>
        </q-card-section>
        <q-card-section>
          <div class="text-body1 text-center">{{ victoryState.message }}</div>
          <div v-if="victoryState.condition" class="text-caption text-center q-mt-sm">
            Condición: {{ getVictoryConditionName(victoryState.condition) }}
          </div>
        </q-card-section>
        <q-card-section>
          <q-btn label="Return to Menu" color="primary" class="full-width" @click="exitGame" />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { GameEngine } from '@/services/GameEngine'
import { FormationType } from '@/utils/Formation'
import ProductionPanel from '@/components/ProductionPanel.vue'
import ResearchPanel from '@/components/ResearchPanel.vue'
import type { UnitType, VictoryState, VictoryCondition } from '@/types/game'
import { getTechnologiesForBuilding } from '@/config/technologies'

const router = useRouter()
const gameStore = useGameStore()

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const minimapCanvas = ref<HTMLCanvasElement | null>(null)
const showGameMenu = ref(false)
const showVictoryDialog = ref(false)

const resources = ref({
  food: 200,
  wood: 200,
  gold: 100,
  stone: 100
})

const population = ref({
  current: 0,
  max: 3
})

const victoryState = ref<VictoryState>({
  isGameOver: false,
  result: null,
  condition: null,
  winnerName: null,
  message: '',
  timestamp: 0
})

const gameTime = ref('00:00')
const selectedUnit = ref<any>(null)
const selectedBuilding = ref<any>(null)
const currentFormation = ref('Box')
const researchedTechs = ref<Set<string>>(new Set())

let gameEngine: GameEngine | null = null
let selectionUpdateInterval: number | null = null

onMounted(() => {
  if (gameCanvas.value) {
    gameEngine = new GameEngine(gameCanvas.value, minimapCanvas.value!)

    // Set resource update callback
    gameEngine.setOnResourcesUpdate((newResources) => {
      resources.value = { ...newResources }
    })

    // Set population update callback
    gameEngine.setOnPopulationUpdate((current, max) => {
      population.value = { current, max }
    })

    // Set victory state change callback
    gameEngine.setOnVictoryStateChange((state) => {
      victoryState.value = state
      if (state.isGameOver) {
        showVictoryDialog.value = true
      }
    })

    // Setup keyboard shortcuts for formations
    setupFormationHotkeys()

    gameEngine.start()

    // Update selection periodically
    selectionUpdateInterval = window.setInterval(() => {
      updateSelection()
      // Update researched technologies
      if (gameEngine) {
        researchedTechs.value = gameEngine.getResearchedTechnologies()
      }
    }, 100)
  }
})

onUnmounted(() => {
  if (selectionUpdateInterval) {
    clearInterval(selectionUpdateInterval)
  }
  gameEngine?.stop()
  document.removeEventListener('keydown', handleFormationHotkey)
})

const setupFormationHotkeys = () => {
  document.addEventListener('keydown', handleFormationHotkey)
}

const handleFormationHotkey = (event: KeyboardEvent) => {
  if (!gameEngine) return

  switch (event.key) {
    case 'F1':
      gameEngine.setFormation(FormationType.Line)
      currentFormation.value = 'Line'
      break
    case 'F2':
      gameEngine.setFormation(FormationType.Column)
      currentFormation.value = 'Column'
      break
    case 'F3':
      gameEngine.setFormation(FormationType.Box)
      currentFormation.value = 'Box'
      break
    case 'F4':
      gameEngine.setFormation(FormationType.Wedge)
      currentFormation.value = 'Wedge'
      break
    case 'F5':
      gameEngine.setFormation(FormationType.Scattered)
      currentFormation.value = 'Scattered'
      break
  }
}

const updateSelection = () => {
  if (!gameEngine) return

  const selected = gameEngine.getSelectedEntities()

  if (selected.length === 0) {
    selectedUnit.value = null
    selectedBuilding.value = null
    return
  }

  const entity = selected[0]

  // Check if it's a building
  if ('canProduce' in entity) {
    selectedBuilding.value = {
      id: entity.id,
      name: entity.name,
      type: entity.type,
      canProduce: entity.canProduce || [],
      productionQueue: entity.productionQueue || [],
      maxQueueSize: entity.maxQueueSize || 5,
      researchQueue: entity.researchQueue || []
    }
    selectedUnit.value = null
  } else {
    // It's a unit
    selectedUnit.value = {
      name: entity.name || 'Unit',
      hp: Math.floor(entity.hp || 0),
      maxHp: Math.floor(entity.maxHp || 100),
      attack: Math.floor(entity.attack || 0)
    }
    selectedBuilding.value = null
  }
}

const handleTrainUnit = (unitType: UnitType) => {
  if (!gameEngine || !selectedBuilding.value) return

  const success = gameEngine.trainUnit(selectedBuilding.value.id, unitType)

  if (success) {
    console.log(`Training ${unitType}`)
  }
}

const handleCancelUnit = (index: number) => {
  console.log(`Cancelling unit at index ${index}`)
  // TODO: Implement cancel logic in GameEngine
}

const hasResearchTech = (building: any): boolean => {
  if (!building || !building.type) return false
  const techs = getTechnologiesForBuilding(building.type)
  return techs.length > 0
}

const handleResearch = (techId: string) => {
  if (!gameEngine || !selectedBuilding.value) return

  const success = gameEngine.researchTechnology(selectedBuilding.value.id, techId)

  if (success) {
    console.log(`Researching ${techId}`)
  }
}

const handleCancelResearch = (index: number) => {
  console.log(`Cancelling research at index ${index}`)
  // TODO: Implement cancel research logic in GameEngine
}

const goToSettings = () => {
  showGameMenu.value = false
  router.push('/settings')
}

const exitGame = () => {
  gameEngine?.stop()
  router.push('/')
}

const getVictoryConditionName = (condition: VictoryCondition): string => {
  const names: Record<VictoryCondition, string> = {
    conquest: 'Conquista',
    population: 'Población',
    wonder: 'Maravilla',
    time_limit: 'Límite de Tiempo',
    relics: 'Reliquias'
  }
  return names[condition] || condition
}
</script>

<style lang="scss" scoped>
.game-view {
  width: 100%;
  height: 100%;
  position: relative;
  background: #000;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;

  > * {
    pointer-events: auto;
  }
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1rem;
  color: white;
}

.resources {
  display: flex;
  gap: 2rem;

  .resource {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
  }
}

.game-time {
  font-size: 1.2rem;
  font-weight: 600;
}

.formation-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
}

.bottom-ui {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 220px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  padding: 1rem;
  gap: 1rem;
}

.minimap {
  width: 200px;
  height: 200px;
  background: rgba(50, 50, 50, 0.9);
  border: 2px solid #666;
  border-radius: 4px;

  canvas {
    width: 100%;
    height: 100%;
  }
}

.control-panel {
  flex: 1;
  background: rgba(30, 30, 30, 0.9);
  border: 2px solid #666;
  border-radius: 4px;
  padding: 1rem;
  color: white;
}

.unit-info {
  .unit-stats {
    margin-top: 0.5rem;
    display: flex;
    gap: 1rem;
  }
}

.no-selection {
  color: #888;
  text-align: center;
  padding-top: 2rem;
}

.population {
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  padding-left: 0.75rem;
}

.population-warning {
  color: #ff6b6b;
  font-weight: bold;
}

.victory-card {
  background: linear-gradient(135deg, #1a3a1a 0%, #2d5a2d 100%);
  border: 3px solid #4caf50;

  .q-card__section {
    color: white;
  }
}

.defeat-card {
  background: linear-gradient(135deg, #3a1a1a 0%, #5a2d2d 100%);
  border: 3px solid #f44336;

  .q-card__section {
    color: white;
  }
}
</style>
