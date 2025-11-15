<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { Engine } from './core/Engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: Engine | null = null

onMounted(() => {
  if (canvasRef.value) {
    // Initialize and start the game engine
    engine = new Engine(canvasRef.value)
    engine.start()
  }
})

onBeforeUnmount(() => {
  // Clean up when component is destroyed
  if (engine) {
    engine.stop()
  }
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title>
          Age of Empires II Web
        </q-toolbar-title>
        <q-space />
        <div class="text-caption">Phase 1: Foundation</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="game-container">
        <canvas ref="canvasRef" class="game-canvas"></canvas>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.game-container {
  width: 100vw;
  height: calc(100vh - 50px);
  overflow: hidden;
  position: relative;
}

.game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
}
</style>
