<template>
  <div class="game-view">
    <!-- Game canvas -->
    <canvas ref="gameCanvas" class="game-canvas"></canvas>

    <!-- HUD Overlay -->
    <div class="hud-overlay">
      <!-- Top bar -->
      <div class="top-bar">
        <div class="resources">
          <div class="resource food">
            <q-icon name="food_bank" size="24px" />
            <span>{{ Math.floor(resources.food) }}</span>
          </div>
          <div class="resource wood">
            <q-icon name="forest" size="24px" />
            <span>{{ Math.floor(resources.wood) }}</span>
          </div>
          <div class="resource gold">
            <q-icon name="diamond" size="24px" />
            <span>{{ Math.floor(resources.gold) }}</span>
          </div>
          <div class="resource stone">
            <q-icon name="architecture" size="24px" />
            <span>{{ Math.floor(resources.stone) }}</span>
          </div>
          <div class="population">
            <q-icon name="people" size="24px" />
            <span>{{ population }}/{{ maxPopulation }}</span>
          </div>
        </div>
        <div class="game-time">{{ gameTime }}</div>
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
        <div class="minimap-container">
          <canvas ref="minimapCanvas" width="200" height="200"></canvas>
          <div class="minimap-label">Minimap</div>
        </div>

        <div class="control-panel">
          <!-- Selected Units -->
          <div v-if="selectedEntities.length > 0 && selectedEntities[0].type !== undefined" class="entity-info">
            <div class="info-header">
              <strong>{{ selectedEntities[0].name }}</strong>
              <span class="count" v-if="selectedEntities.length > 1">({{ selectedEntities.length }})</span>
            </div>
            <div class="health-bar-container">
              <div class="health-bar" :style="{ width: (selectedEntities[0].hp / selectedEntities[0].maxHp * 100) + '%' }"></div>
            </div>
            <div class="entity-stats">
              <div class="stat">
                <q-icon name="favorite" size="16px" />
                HP: {{ Math.floor(selectedEntities[0].hp) }}/{{ selectedEntities[0].maxHp }}
              </div>
              <div class="stat">
                <q-icon name="swords" size="16px" />
                Attack: {{ selectedEntities[0].attack }}
              </div>
              <div class="stat">
                <q-icon name="shield" size="16px" />
                Defense: {{ selectedEntities[0].defense }}
              </div>
              <div class="stat">
                <q-icon name="speed" size="16px" />
                Speed: {{ selectedEntities[0].speed }}
              </div>
            </div>
            <div class="unit-state" v-if="selectedEntities[0].state">
              State: <span class="state-badge">{{ selectedEntities[0].state }}</span>
            </div>
          </div>

          <!-- Selected Building -->
          <div v-else-if="selectedEntities.length > 0 && selectedEntities[0].type" class="entity-info">
            <div class="info-header">
              <strong>{{ selectedEntities[0].name }}</strong>
            </div>
            <div class="health-bar-container">
              <div class="health-bar" :style="{ width: (selectedEntities[0].hp / selectedEntities[0].maxHp * 100) + '%' }"></div>
            </div>
            <div class="entity-stats">
              <div class="stat">
                <q-icon name="favorite" size="16px" />
                HP: {{ Math.floor(selectedEntities[0].hp) }}/{{ selectedEntities[0].maxHp }}
              </div>
              <div class="stat" v-if="!selectedEntities[0].isComplete">
                <q-icon name="construction" size="16px" />
                Progress: {{ Math.floor(selectedEntities[0].buildProgress * 100) }}%
              </div>
            </div>

            <!-- Production Queue -->
            <div v-if="selectedEntities[0].productionQueue && !selectedEntities[0].productionQueue.isEmpty()" class="production-queue">
              <div class="queue-header">Training Queue:</div>
              <div class="queue-items">
                <div
                  v-for="(queuedUnit, index) in getProductionQueue(selectedEntities[0])"
                  :key="index"
                  class="queue-item"
                >
                  <div class="unit-icon">{{ getUnitIcon(queuedUnit.type) }}</div>
                  <div class="progress-ring" v-if="index === 0">
                    <svg width="40" height="40">
                      <circle cx="20" cy="20" r="16" stroke="#333" stroke-width="3" fill="none" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="#4CAF50"
                        stroke-width="3"
                        fill="none"
                        :stroke-dasharray="100"
                        :stroke-dashoffset="100 - (queuedUnit.progress * 100)"
                        transform="rotate(-90 20 20)"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Building Actions -->
            <div v-if="selectedEntities[0].isComplete" class="building-actions">
              <div class="actions-header">Train Units:</div>
              <div class="action-buttons">
                <q-btn
                  v-if="canTrainVillager(selectedEntities[0])"
                  size="sm"
                  color="primary"
                  label="Villager (V)"
                  @click="trainUnit('villager')"
                  :disable="!canAfford({ food: 50 })"
                >
                  <q-tooltip>Cost: 50 food | Time: 25s</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="canTrainMilitia(selectedEntities[0])"
                  size="sm"
                  color="primary"
                  label="Militia (Q)"
                  @click="trainUnit('militia')"
                  :disable="!canAfford({ food: 60, gold: 20 })"
                >
                  <q-tooltip>Cost: 60 food, 20 gold | Time: 21s</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="canTrainArcher(selectedEntities[0])"
                  size="sm"
                  color="primary"
                  label="Archer (W)"
                  @click="trainUnit('archer')"
                  :disable="!canAfford({ wood: 25, gold: 45 })"
                >
                  <q-tooltip>Cost: 25 wood, 45 gold | Time: 35s</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="canTrainKnight(selectedEntities[0])"
                  size="sm"
                  color="primary"
                  label="Knight (E)"
                  @click="trainUnit('knight')"
                  :disable="!canAfford({ food: 60, gold: 75 })"
                >
                  <q-tooltip>Cost: 60 food, 75 gold | Time: 30s</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- No Selection -->
          <div v-else class="no-selection">
            <p>No unit or building selected</p>
            <div class="hotkeys-hint">
              <div class="hint-section">
                <strong>Buildings:</strong> H=House, B=Barracks, A=Archery, S=Stable
              </div>
              <div class="hint-section">
                <strong>Units:</strong> V=Villager, Q=Militia, W=Archer, E=Knight
              </div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { GameEngine } from '@/services/GameEngine'

const router = useRouter()
const gameStore = useGameStore()

const gameCanvas = ref<HTMLCanvasElement | null>(null)
const minimapCanvas = ref<HTMLCanvasElement | null>(null)
const showGameMenu = ref(false)

const resources = ref({
  food: 200,
  wood: 200,
  gold: 100,
  stone: 100
})

const population = ref(3)
const maxPopulation = ref(200)
const gameTime = ref('00:00')
const selectedEntities = ref<any[]>([])

let gameEngine: GameEngine | null = null
let gameStartTime = Date.now()
let updateInterval: number | null = null

onMounted(() => {
  if (gameCanvas.value) {
    gameEngine = new GameEngine(gameCanvas.value, minimapCanvas.value!)

    // Set resource update callback
    gameEngine.setOnResourcesUpdate((updatedResources) => {
      resources.value = { ...updatedResources }
    })

    gameEngine.start()

    // Update UI every 100ms
    updateInterval = window.setInterval(() => {
      updateGameState()
    }, 100)

    // Update game time every second
    setInterval(() => {
      const elapsed = Math.floor((Date.now() - gameStartTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      gameTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }, 1000)
  }
})

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval)
  }
  gameEngine?.stop()
})

const updateGameState = () => {
  if (!gameEngine) return

  // Update selected entities
  const selected = gameEngine.getSelectedEntities()
  selectedEntities.value = selected.map(entity => ({
    ...entity,
    // Create plain object to avoid reactivity issues with THREE.js objects
    type: (entity as any).type,
    name: (entity as any).name,
    hp: (entity as any).hp,
    maxHp: (entity as any).maxHp,
    attack: (entity as any).attack,
    defense: (entity as any).defense,
    speed: (entity as any).speed,
    state: (entity as any).state,
    isComplete: (entity as any).isComplete,
    buildProgress: (entity as any).buildProgress,
    productionQueue: (entity as any).productionQueue
  }))
}

const canAfford = (cost: Record<string, number>): boolean => {
  if (cost.food && resources.value.food < cost.food) return false
  if (cost.wood && resources.value.wood < cost.wood) return false
  if (cost.gold && resources.value.gold < cost.gold) return false
  if (cost.stone && resources.value.stone < cost.stone) return false
  return true
}

const canTrainVillager = (building: any): boolean => {
  return building.type === 'town_center'
}

const canTrainMilitia = (building: any): boolean => {
  return building.type === 'barracks'
}

const canTrainArcher = (building: any): boolean => {
  return building.type === 'archery_range'
}

const canTrainKnight = (building: any): boolean => {
  return building.type === 'stable'
}

const trainUnit = (unitType: string) => {
  // Training is handled by keyboard shortcuts in GameEngine
  // This function is called when clicking the UI buttons
  const event = new KeyboardEvent('keydown', {
    key: unitType === 'villager' ? 'v' : unitType === 'militia' ? 'q' : unitType === 'archer' ? 'w' : 'e',
    bubbles: true
  })
  window.dispatchEvent(event)
}

const getProductionQueue = (building: any) => {
  if (!building.productionQueue) return []
  return building.productionQueue.getQueue()
}

const getUnitIcon = (unitType: string): string => {
  const icons: Record<string, string> = {
    villager: '👷',
    militia: '⚔️',
    archer: '🏹',
    knight: '🐴',
    spearman: '🗡️',
    swordsman: '⚔️',
    crossbowman: '🏹',
    skirmisher: '🎯',
    scout: '👀',
    cavalry_archer: '🏇'
  }
  return icons[unitType] || '❓'
}

const goToSettings = () => {
  showGameMenu.value = false
  router.push('/settings')
}

const exitGame = () => {
  gameEngine?.stop()
  router.push('/')
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
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;

    &.food { color: #ff6b6b; }
    &.wood { color: #8b7355; }
    &.gold { color: #ffd700; }
    &.stone { color: #999; }
  }

  .population {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    padding: 0.25rem 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    color: #4CAF50;
  }
}

.game-time {
  font-size: 1.3rem;
  font-weight: 600;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.bottom-ui {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 250px;
  background: linear-gradient(0deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.8) 100%);
  backdrop-filter: blur(10px);
  display: flex;
  padding: 1rem;
  gap: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.minimap-container {
  width: 220px;
  height: 220px;
  position: relative;

  canvas {
    width: 100%;
    height: 100%;
    background: rgba(20, 20, 20, 0.9);
    border: 2px solid #444;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  }

  .minimap-label {
    position: absolute;
    bottom: 8px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
}

.control-panel {
  flex: 1;
  background: rgba(20, 20, 20, 0.95);
  border: 2px solid #444;
  border-radius: 8px;
  padding: 1rem;
  color: white;
  overflow-y: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

.entity-info {
  .info-header {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .count {
      color: #4CAF50;
      font-size: 0.9rem;
    }
  }

  .health-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 0, 0, 0.3);
    border-radius: 4px;
    margin-bottom: 1rem;
    overflow: hidden;

    .health-bar {
      height: 100%;
      background: linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%);
      transition: width 0.3s ease;
      box-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
    }
  }

  .entity-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
    margin-bottom: 1rem;

    .stat {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
      font-size: 0.9rem;
    }
  }

  .unit-state {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    color: #999;

    .state-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: rgba(76, 175, 80, 0.2);
      border: 1px solid #4CAF50;
      border-radius: 4px;
      color: #4CAF50;
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-left: 0.5rem;
    }
  }
}

.production-queue {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .queue-header {
    font-size: 0.9rem;
    color: #999;
    margin-bottom: 0.5rem;
  }

  .queue-items {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;

    .queue-item {
      position: relative;
      width: 50px;
      height: 50px;

      .unit-icon {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.8rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid #444;
        border-radius: 4px;
      }

      .progress-ring {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
      }
    }
  }
}

.building-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .actions-header {
    font-size: 0.9rem;
    color: #999;
    margin-bottom: 0.75rem;
  }

  .action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
}

.no-selection {
  color: #666;
  text-align: center;
  padding-top: 2rem;

  p {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }

  .hotkeys-hint {
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: left;
    color: #999;

    .hint-section {
      margin-bottom: 1rem;
      font-size: 0.9rem;

      strong {
        color: #fff;
        margin-right: 0.5rem;
      }

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
