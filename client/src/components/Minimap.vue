<template>
  <div class="minimap-container" :style="{ width: size + 'px', height: size + 'px' }">
    <canvas
      ref="minimapCanvas"
      :width="size"
      :height="size"
      class="minimap-canvas"
      @click="handleClick"
      @mousemove="handleMouseMove"
      @mouseleave="handleMouseLeave"
    />

    <!-- Hover tooltip -->
    <div v-if="hoverInfo" class="minimap-tooltip" :style="tooltipStyle">
      {{ hoverInfo }}
    </div>

    <!-- Minimap controls -->
    <div class="minimap-controls">
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="visibility"
        :color="showFogOfWar ? 'white' : 'grey'"
        @click="toggleFogOfWar"
      >
        <q-tooltip>Toggle Fog of War</q-tooltip>
      </q-btn>
      <q-btn
        flat
        dense
        round
        size="xs"
        icon="terrain"
        :color="showTerrain ? 'white' : 'grey'"
        @click="toggleTerrain"
      >
        <q-tooltip>Toggle Terrain</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import type { Unit, Building, Position } from '@/types/game'

interface Props {
  size?: number
  mapSize?: number
  units?: Unit[]
  buildings?: Building[]
  cameraPosition?: Position
  playerColor?: string
  enemyColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 200,
  mapSize: 100,
  units: () => [],
  buildings: () => [],
  cameraPosition: () => ({ x: 0, y: 0, z: 0 }),
  playerColor: '#0000FF',
  enemyColor: '#FF0000',
})

const emit = defineEmits<{
  cameraMove: [position: Position]
}>()

const minimapCanvas = ref<HTMLCanvasElement | null>(null)
const showFogOfWar = ref(true)
const showTerrain = ref(true)
const hoverInfo = ref<string | null>(null)
const mousePos = ref({ x: 0, y: 0 })

const tooltipStyle = computed(() => ({
  left: `${mousePos.value.x + 10}px`,
  top: `${mousePos.value.y + 10}px`,
}))

let animationFrameId: number | null = null

onMounted(() => {
  startRendering()
})

onUnmounted(() => {
  stopRendering()
})

function startRendering() {
  const render = () => {
    drawMinimap()
    animationFrameId = requestAnimationFrame(render)
  }
  render()
}

function stopRendering() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

function drawMinimap() {
  const canvas = minimapCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const { size, mapSize } = props
  const scale = size / mapSize

  // Clear canvas
  ctx.fillStyle = '#1a1a1a'
  ctx.fillRect(0, 0, size, size)

  // Draw terrain (if enabled)
  if (showTerrain.value) {
    drawTerrainGrid(ctx, scale)
  }

  // Draw buildings
  props.buildings.forEach((building) => {
    drawBuilding(ctx, building, scale)
  })

  // Draw units
  props.units.forEach((unit) => {
    drawUnit(ctx, unit, scale)
  })

  // Draw camera viewport
  drawCameraViewport(ctx, scale)

  // Draw border
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 2
  ctx.strokeRect(0, 0, size, size)
}

function drawTerrainGrid(ctx: CanvasRenderingContext2D, scale: number) {
  const { size } = props
  const gridSize = 10

  ctx.strokeStyle = '#2a2a2a'
  ctx.lineWidth = 1

  for (let i = 0; i <= size; i += gridSize * scale) {
    // Vertical lines
    ctx.beginPath()
    ctx.moveTo(i, 0)
    ctx.lineTo(i, size)
    ctx.stroke()

    // Horizontal lines
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(size, i)
    ctx.stroke()
  }
}

function drawBuilding(ctx: CanvasRenderingContext2D, building: Building, scale: number) {
  const { size, mapSize } = props
  const x = ((building.position.x + mapSize / 2) / mapSize) * size
  const y = (((building.position.z || 0) + mapSize / 2) / mapSize) * size

  const buildingSize = building.size.width * scale

  ctx.fillStyle = building.ownerId === 'player1' ? props.playerColor : props.enemyColor
  ctx.fillRect(x - buildingSize / 2, y - buildingSize / 2, buildingSize, buildingSize)

  // Health indicator
  const healthPercent = building.hp / building.maxHp
  ctx.fillStyle = healthPercent > 0.6 ? '#00ff00' : healthPercent > 0.3 ? '#ffff00' : '#ff0000'
  ctx.fillRect(x - buildingSize / 2, y - buildingSize / 2 - 2, buildingSize * healthPercent, 1)
}

function drawUnit(ctx: CanvasRenderingContext2D, unit: Unit, scale: number) {
  const { size, mapSize } = props
  const x = ((unit.position.x + mapSize / 2) / mapSize) * size
  const y = (((unit.position.z || 0) + mapSize / 2) / mapSize) * size

  const radius = 2

  ctx.fillStyle = unit.ownerId === 'player1' ? props.playerColor : props.enemyColor
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  // Selected indicator
  if (unit.isSelected) {
    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawCameraViewport(ctx: CanvasRenderingContext2D, scale: number) {
  const { size, mapSize, cameraPosition } = props
  const x = ((cameraPosition.x + mapSize / 2) / mapSize) * size
  const y = (((cameraPosition.z || 0) + mapSize / 2) / mapSize) * size

  const viewportSize = 15 * scale

  ctx.strokeStyle = '#00ff00'
  ctx.lineWidth = 2
  ctx.strokeRect(x - viewportSize / 2, y - viewportSize / 2, viewportSize, viewportSize)

  // Camera center dot
  ctx.fillStyle = '#00ff00'
  ctx.beginPath()
  ctx.arc(x, y, 3, 0, Math.PI * 2)
  ctx.fill()
}

function handleClick(event: MouseEvent) {
  const canvas = minimapCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const clickY = event.clientY - rect.top

  // Convert to world coordinates
  const { size, mapSize } = props
  const worldX = (clickX / size) * mapSize - mapSize / 2
  const worldZ = (clickY / size) * mapSize - mapSize / 2

  // Emit camera move event
  emit('cameraMove', { x: worldX, y: 0, z: worldZ })
}

function handleMouseMove(event: MouseEvent) {
  const canvas = minimapCanvas.value
  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  mousePos.value = { x, y }

  // Check if hovering over unit or building
  const worldX = (x / props.size) * props.mapSize - props.mapSize / 2
  const worldZ = (y / props.size) * props.mapSize - props.mapSize / 2

  // Find nearby entities
  const nearbyUnit = findNearbyEntity(worldX, worldZ, props.units)
  const nearbyBuilding = findNearbyEntity(worldX, worldZ, props.buildings)

  if (nearbyUnit) {
    hoverInfo.value = `${nearbyUnit.name} (HP: ${nearbyUnit.hp}/${nearbyUnit.maxHp})`
  } else if (nearbyBuilding) {
    hoverInfo.value = `${nearbyBuilding.name} (HP: ${nearbyBuilding.hp}/${nearbyBuilding.maxHp})`
  } else {
    hoverInfo.value = null
  }
}

function handleMouseLeave() {
  hoverInfo.value = null
}

function findNearbyEntity(x: number, z: number, entities: (Unit | Building)[]): Unit | Building | null {
  const threshold = 2

  for (const entity of entities) {
    const dx = entity.position.x - x
    const dz = (entity.position.z || 0) - z
    const distance = Math.sqrt(dx * dx + dz * dz)

    if (distance < threshold) {
      return entity
    }
  }

  return null
}

function toggleFogOfWar() {
  showFogOfWar.value = !showFogOfWar.value
}

function toggleTerrain() {
  showTerrain.value = !showTerrain.value
}
</script>

<style lang="scss" scoped>
.minimap-container {
  position: relative;
  background: #000;
  border: 2px solid #444;
  border-radius: 4px;
  overflow: hidden;
}

.minimap-canvas {
  display: block;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
}

.minimap-controls {
  position: absolute;
  top: 4px;
  right: 4px;
  display: flex;
  gap: 4px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 2px;
}

.minimap-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1000;
}
</style>
