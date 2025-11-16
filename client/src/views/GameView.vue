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
        <div class="minimap">
          <canvas ref="minimapCanvas" width="200" height="200"></canvas>
        </div>
        <div class="control-panel">
          <div v-if="selectedUnit" class="unit-info">
            <div class="unit-header">
              <strong>{{ selectedUnit.name }}</strong>
              <span class="unit-state">{{ selectedUnit.state }}</span>
            </div>
            <div class="health-bar-container">
              <div class="health-bar" :style="{ width: (selectedUnit.hp / selectedUnit.maxHp * 100) + '%' }"></div>
            </div>
            <div class="unit-stats">
              <div>❤️ HP: {{ Math.floor(selectedUnit.hp) }}/{{ selectedUnit.maxHp }}</div>
              <div>⚔️ Attack: {{ selectedUnit.attack }}</div>
              <div>🛡️ Defense: {{ selectedUnit.defense }}</div>
              <div>🏃 Speed: {{ selectedUnit.speed.toFixed(1) }}</div>
            </div>
            <div v-if="selectedUnit.carriedResourceAmount > 0" class="carrying-resources">
              <div>📦 Carrying: {{ Math.floor(selectedUnit.carriedResourceAmount) }} {{ selectedUnit.carriedResourceType }}</div>
            </div>

            <!-- Build menu for villagers -->
            <div v-if="selectedUnit.type === 'villager'" class="build-menu">
              <div class="build-menu-header">Build</div>
              <div class="build-buttons">
                <q-btn
                  size="sm"
                  class="build-btn"
                  @click="build('house')"
                  :disable="!canAfford({ wood: 25 })"
                >
                  <div class="build-btn-content">
                    <div>🏠 House</div>
                    <div class="cost">🌲 25</div>
                  </div>
                </q-btn>
                <q-btn
                  size="sm"
                  class="build-btn"
                  @click="build('barracks')"
                  :disable="!canAfford({ wood: 175 })"
                >
                  <div class="build-btn-content">
                    <div>⚔️ Barracks</div>
                    <div class="cost">🌲 175</div>
                  </div>
                </q-btn>
                <q-btn
                  size="sm"
                  class="build-btn"
                  @click="build('market')"
                  :disable="!canAfford({ wood: 175 })"
                >
                  <div class="build-btn-content">
                    <div>🏪 Market</div>
                    <div class="cost">🌲 175</div>
                  </div>
                </q-btn>
                <q-btn
                  size="sm"
                  class="build-btn"
                  @click="build('blacksmith')"
                  :disable="!canAfford({ wood: 150 })"
                >
                  <div class="build-btn-content">
                    <div>🔨 Blacksmith</div>
                    <div class="cost">🌲 150</div>
                  </div>
                </q-btn>
              </div>
            </div>
          </div>
          <div v-else class="no-selection">
            <p>No unit selected</p>
            <p class="hint">Click a unit to select it</p>
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

const gameTime = ref('00:00')
const selectedUnit = ref<any>(null)

let gameEngine: GameEngine | null = null
let gameTimeInterval: number | null = null
let startTime = Date.now()

onMounted(() => {
  if (gameCanvas.value && minimapCanvas.value) {
    gameEngine = new GameEngine(gameCanvas.value, minimapCanvas.value)

    // Set up resource update callback
    gameEngine.setOnResourcesUpdate((newResources) => {
      resources.value = {
        food: Math.floor(newResources.food),
        wood: Math.floor(newResources.wood),
        gold: Math.floor(newResources.gold),
        stone: Math.floor(newResources.stone)
      }
    })

    // Initialize resources
    resources.value = gameEngine.getPlayerResources()

    // Start game time counter
    gameTimeInterval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      const minutes = Math.floor(elapsed / 60)
      const seconds = elapsed % 60
      gameTime.value = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }, 1000)

    // Update selected unit info periodically
    setInterval(() => {
      const selected = gameEngine?.getSelectedEntities()
      if (selected && selected.length > 0) {
        selectedUnit.value = selected[0]
      } else {
        selectedUnit.value = null
      }
    }, 100)

    gameEngine.start()
  }
})

onUnmounted(() => {
  if (gameTimeInterval) {
    clearInterval(gameTimeInterval)
  }
  gameEngine?.dispose()
})

const goToSettings = () => {
  showGameMenu.value = false
  router.push('/settings')
}

const exitGame = () => {
  gameEngine?.stop()
  router.push('/')
}

const build = (buildingType: string) => {
  if (gameEngine) {
    gameEngine.enterBuildMode(buildingType as any)
  }
}

const canAfford = (cost: { food?: number; wood?: number; gold?: number; stone?: number }) => {
  if (cost.food && resources.value.food < cost.food) return false
  if (cost.wood && resources.value.wood < cost.wood) return false
  if (cost.gold && resources.value.gold < cost.gold) return false
  if (cost.stone && resources.value.stone < cost.stone) return false
  return true
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
  .unit-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;

    strong {
      font-size: 1.1rem;
    }

    .unit-state {
      background: rgba(240, 165, 0, 0.3);
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
      font-size: 0.85rem;
      text-transform: capitalize;
    }
  }

  .health-bar-container {
    width: 100%;
    height: 8px;
    background: rgba(255, 0, 0, 0.3);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.8rem;

    .health-bar {
      height: 100%;
      background: linear-gradient(90deg, #21ba45 0%, #3dd55a 100%);
      transition: width 0.3s ease;
    }
  }

  .unit-stats {
    margin-top: 0.5rem;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;

    div {
      background: rgba(255, 255, 255, 0.05);
      padding: 0.4rem 0.6rem;
      border-radius: 4px;
      font-size: 0.9rem;
    }
  }

  .carrying-resources {
    margin-top: 0.8rem;
    padding: 0.6rem;
    background: rgba(240, 165, 0, 0.2);
    border-left: 3px solid #f0a500;
    border-radius: 4px;
    font-size: 0.9rem;
  }
}

.no-selection {
  color: #888;
  text-align: center;
  padding-top: 2rem;

  .hint {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #666;
  }
}

.build-menu {
  margin-top: 1rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .build-menu-header {
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #f0a500;
  }

  .build-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;

    .build-btn {
      background: rgba(240, 165, 0, 0.2);
      border: 1px solid rgba(240, 165, 0, 0.4);
      padding: 0.4rem;

      &:hover:not(.disabled) {
        background: rgba(240, 165, 0, 0.3);
      }

      &.disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .build-btn-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.75rem;
      color: white;

      .cost {
        font-size: 0.7rem;
        color: #ccc;
      }
    }
  }
}
</style>
