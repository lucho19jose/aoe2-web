<script setup lang="ts">
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (canvasRef.value) {
    const canvas = canvasRef.value
    const ctx = canvas.getContext('2d')

    // Set canvas size to window size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight - 50 // Account for header
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Simple test: draw a dark background
    if (ctx) {
      ctx.fillStyle = '#1a1a1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw some text in the center
      ctx.fillStyle = '#42b883'
      ctx.font = '24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Game Canvas Ready', canvas.width / 2, canvas.height / 2)
    }
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
