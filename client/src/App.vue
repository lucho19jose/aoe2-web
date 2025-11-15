<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Engine } from './core/Engine'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: Engine | null = null

onMounted(() => {
  if (canvasRef.value) {
    console.log('🎨 Canvas ready, initializing game engine...')

    // Initialize and start the game engine
    engine = new Engine(canvasRef.value)
    engine.start()
  }
})

onUnmounted(() => {
  // Clean up the engine when component is destroyed
  if (engine) {
    engine.destroy()
    engine = null
  }
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <!-- Header -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          Age of Empires II Web
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <!-- Main Content Area -->
    <q-page-container>
      <q-page class="game-container">
        <canvas ref="canvasRef" id="game-canvas"></canvas>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<style>
/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.game-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

#game-canvas {
  display: block;
  width: 100%;
  height: 100%;
  background-color: #1a1a1a;
  cursor: default;
}
</style>
