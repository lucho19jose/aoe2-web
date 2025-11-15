<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Engine } from './core/Engine'
import { Unit } from './game-logic/entities/Unit'

const canvasRef = ref<HTMLCanvasElement | null>(null)
let engine: Engine | null = null

/**
 * Create test units scattered randomly on the map
 */
function createTestUnits(engine: Engine): void {
  const entityManager = engine.getEntityManager()
  const TILE_SIZE = 32
  const GRID_WIDTH = 100
  const GRID_HEIGHT = 100

  console.log('Creating 50 test units...')

  // Create 50 units with different types at random positions
  for (let i = 0; i < 50; i++) {
    // Random position within the grid
    const x = (Math.random() - 0.5) * GRID_WIDTH * TILE_SIZE
    const y = (Math.random() - 0.5) * GRID_HEIGHT * TILE_SIZE

    // Create different unit types for variety
    const unitType = i % 4
    switch (unitType) {
      case 0:
        Unit.createMilitia(entityManager, x, y)
        break
      case 1:
        Unit.createVillager(entityManager, x, y)
        break
      case 2:
        Unit.createArcher(entityManager, x, y)
        break
      case 3:
        Unit.createKnight(entityManager, x, y)
        break
    }
  }

  console.log(`✅ Created ${entityManager.getEntityCount()} units`)
}

onMounted(() => {
  if (canvasRef.value) {
    console.log('🎨 Canvas ready, initializing game engine...')

    // Initialize and start the game engine
    engine = new Engine(canvasRef.value)

    // Create test units
    createTestUnits(engine)

    // Start the game loop
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
