<template>
  <q-page class="game-page">
    <!-- Game Canvas -->
    <canvas
      ref="gameCanvas"
      class="game-canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @contextmenu.prevent
    />

    <!-- Game HUD -->
    <div class="game-hud">
      <div class="resource-bar">
        <div class="resource-item">
          <span class="resource-icon">🍖</span>
          <span class="resource-value">{{ resources.food }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🪵</span>
          <span class="resource-value">{{ resources.wood }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🪙</span>
          <span class="resource-value">{{ resources.gold }}</span>
        </div>
        <div class="resource-item">
          <span class="resource-icon">🪨</span>
          <span class="resource-value">{{ resources.stone }}</span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameStore } from '@/stores/gameStore'

const gameStore = useGameStore()
const gameCanvas = ref<HTMLCanvasElement | null>(null)

const resources = ref({
  food: 200,
  wood: 200,
  gold: 100,
  stone: 100
})

onMounted(() => {
  if (gameCanvas.value) {
    gameStore.initialize(gameCanvas.value)
  }
})

onUnmounted(() => {
  gameStore.cleanup()
})

const onMouseDown = (event: MouseEvent) => {
  gameStore.handleMouseDown(event)
}

const onMouseMove = (event: MouseEvent) => {
  gameStore.handleMouseMove(event)
}

const onMouseUp = (event: MouseEvent) => {
  gameStore.handleMouseUp(event)
}
</script>

<style scoped>
.game-page {
  position: relative;
  width: 100%;
  height: calc(100vh - 50px);
  overflow: hidden;
  background: #000;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  pointer-events: none;
}

.resource-bar {
  display: flex;
  gap: 20px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.7);
  border-bottom: 2px solid #444;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
}

.resource-icon {
  font-size: 24px;
}

.resource-value {
  min-width: 60px;
  text-align: right;
}
</style>
