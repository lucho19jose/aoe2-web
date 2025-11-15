<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    // Resize canvas to fill window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight - 50 // Account for header

      // Clear canvas
      if (ctx) {
        ctx.fillStyle = '#1a1a1a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
  }
})
</script>

<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark">
      <q-toolbar>
        <q-toolbar-title>
          Age of Empires II Web
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="game-container">
        <canvas ref="canvasRef" id="game-canvas"></canvas>
      </div>
    </q-page-container>
  </q-layout>
</template>

<style scoped>
.game-container {
  position: relative;
  width: 100vw;
  height: calc(100vh - 50px);
  overflow: hidden;
}

#game-canvas {
  display: block;
  cursor: crosshair;
}
</style>
