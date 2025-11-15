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

onMounted(() => {
  if (gameCanvas.value) {
    gameEngine = new GameEngine(gameCanvas.value, minimapCanvas.value!)
    gameEngine.start()
  }
})

onUnmounted(() => {
  gameEngine?.stop()
})

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
</style>
