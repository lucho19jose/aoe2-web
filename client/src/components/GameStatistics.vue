<template>
  <div v-if="visible" class="statistics-overlay">
    <div class="statistics-modal">
      <div class="statistics-header">
        <h2>{{ victoryState.hasWon ? '🎉 VICTORIA!' : '💀 DERROTA' }}</h2>
        <p v-if="victoryState.condition" class="victory-condition">
          Condición: {{ getVictoryConditionText(victoryState.condition) }}
        </p>
      </div>

      <div class="statistics-content">
        <!-- Summary Stats -->
        <div class="stats-summary">
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-label">Tiempo de Juego</div>
              <div class="stat-value">{{ formatTime(stats.gameTime) }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-info">
              <div class="stat-label">Puntuación Total</div>
              <div class="stat-value">{{ totalScore }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">⚔️</div>
            <div class="stat-info">
              <div class="stat-label">Unidades Entrenadas</div>
              <div class="stat-value">{{ stats.totalUnitsTrained }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon">🏗️</div>
            <div class="stat-info">
              <div class="stat-label">Edificios Construidos</div>
              <div class="stat-value">{{ stats.buildingsBuilt }}</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="stats-charts">
          <!-- Resources Chart -->
          <div class="chart-container">
            <h3>Recursos Recolectados</h3>
            <canvas ref="resourcesChart"></canvas>
          </div>

          <!-- Military Chart -->
          <div class="chart-container">
            <h3>Estadísticas Militares</h3>
            <canvas ref="militaryChart"></canvas>
          </div>

          <!-- Units by Type Chart -->
          <div class="chart-container">
            <h3>Unidades por Tipo</h3>
            <canvas ref="unitsChart"></canvas>
          </div>

          <!-- Score Breakdown -->
          <div class="chart-container">
            <h3>Desglose de Puntuación</h3>
            <canvas ref="scoreChart"></canvas>
          </div>
        </div>

        <!-- Detailed Stats -->
        <div class="stats-detailed">
          <div class="stat-section">
            <h3>📊 Economía</h3>
            <div class="stat-row">
              <span>Comida:</span>
              <span class="stat-number">{{ stats.resourcesGathered.food }}</span>
            </div>
            <div class="stat-row">
              <span>Madera:</span>
              <span class="stat-number">{{ stats.resourcesGathered.wood }}</span>
            </div>
            <div class="stat-row">
              <span>Oro:</span>
              <span class="stat-number">{{ stats.resourcesGathered.gold }}</span>
            </div>
            <div class="stat-row">
              <span>Piedra:</span>
              <span class="stat-number">{{ stats.resourcesGathered.stone }}</span>
            </div>
          </div>

          <div class="stat-section">
            <h3>⚔️ Militar</h3>
            <div class="stat-row">
              <span>Unidades Eliminadas:</span>
              <span class="stat-number">{{ stats.totalUnitsKilled }}</span>
            </div>
            <div class="stat-row">
              <span>Unidades Perdidas:</span>
              <span class="stat-number">{{ stats.totalUnitsLost }}</span>
            </div>
            <div class="stat-row">
              <span>Daño Causado:</span>
              <span class="stat-number">{{ Math.floor(stats.damageDealt) }}</span>
            </div>
            <div class="stat-row">
              <span>Daño Recibido:</span>
              <span class="stat-number">{{ Math.floor(stats.damageTaken) }}</span>
            </div>
          </div>

          <div class="stat-section">
            <h3>🔬 Investigación</h3>
            <div class="stat-row">
              <span>Tecnologías Investigadas:</span>
              <span class="stat-number">{{ stats.technologiesResearched.length }}</span>
            </div>
            <div v-if="stats.technologiesResearched.length > 0" class="tech-list">
              <div v-for="tech in stats.technologiesResearched" :key="tech" class="tech-item">
                {{ tech }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="statistics-footer">
        <button @click="close" class="btn-primary">Cerrar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import type { VictoryState } from '@/types/game'
import type { PlayerStatistics } from '@/services/StatisticsService'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

interface Props {
  visible: boolean
  victoryState: VictoryState
  statistics: PlayerStatistics
}

const props = defineProps<Props>()
const emit = defineEmits(['close'])

const resourcesChart = ref<HTMLCanvasElement>()
const militaryChart = ref<HTMLCanvasElement>()
const unitsChart = ref<HTMLCanvasElement>()
const scoreChart = ref<HTMLCanvasElement>()

const stats = computed(() => props.statistics)
const totalScore = computed(() => stats.value.militaryScore + stats.value.economyScore)

let charts: Chart[] = []

const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}m ${secs}s`
}

const getVictoryConditionText = (condition: string): string => {
  const conditions: Record<string, string> = {
    conquest: 'Conquista - Todos los enemigos eliminados',
    wonder: 'Maravilla - Mantener la Maravilla durante 200 años',
    relic: 'Reliquias - Controlar todas las reliquias sagradas',
    score: 'Puntuación - Mayor puntuación alcanzada'
  }
  return conditions[condition] || condition
}

const createCharts = () => {
  // Dispose old charts
  charts.forEach(chart => chart.destroy())
  charts = []

  if (!resourcesChart.value || !militaryChart.value || !unitsChart.value || !scoreChart.value) {
    return
  }

  // Resources Chart
  const resourcesCtx = resourcesChart.value.getContext('2d')
  if (resourcesCtx) {
    charts.push(new Chart(resourcesCtx, {
      type: 'bar',
      data: {
        labels: ['Comida', 'Madera', 'Oro', 'Piedra'],
        datasets: [
          {
            label: 'Recolectado',
            data: [
              stats.value.resourcesGathered.food,
              stats.value.resourcesGathered.wood,
              stats.value.resourcesGathered.gold,
              stats.value.resourcesGathered.stone
            ],
            backgroundColor: ['#ff6b6b', '#8b7355', '#ffd700', '#808080']
          },
          {
            label: 'Gastado',
            data: [
              stats.value.resourcesSpent.food,
              stats.value.resourcesSpent.wood,
              stats.value.resourcesSpent.gold,
              stats.value.resourcesSpent.stone
            ],
            backgroundColor: ['#ff9999', '#b39876', '#ffe066', '#a0a0a0']
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    }))
  }

  // Military Chart
  const militaryCtx = militaryChart.value.getContext('2d')
  if (militaryCtx) {
    charts.push(new Chart(militaryCtx, {
      type: 'doughnut',
      data: {
        labels: ['Unidades Entrenadas', 'Unidades Eliminadas', 'Unidades Perdidas'],
        datasets: [{
          data: [
            stats.value.totalUnitsTrained,
            stats.value.totalUnitsKilled,
            stats.value.totalUnitsLost
          ],
          backgroundColor: ['#4a90e2', '#50c878', '#e74c3c']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }))
  }

  // Units by Type Chart
  const unitsCtx = unitsChart.value.getContext('2d')
  if (unitsCtx) {
    const unitTypes = Object.keys(stats.value.unitsTrainedByType)
    const unitCounts = Object.values(stats.value.unitsTrainedByType)

    charts.push(new Chart(unitsCtx, {
      type: 'pie',
      data: {
        labels: unitTypes,
        datasets: [{
          data: unitCounts,
          backgroundColor: [
            '#ff6b6b', '#4a90e2', '#50c878', '#ffd700',
            '#9370db', '#ff8c00', '#20b2aa', '#dc143c'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    }))
  }

  // Score Breakdown Chart
  const scoreCtx = scoreChart.value.getContext('2d')
  if (scoreCtx) {
    charts.push(new Chart(scoreCtx, {
      type: 'bar',
      data: {
        labels: ['Militar', 'Economía'],
        datasets: [{
          label: 'Puntuación',
          data: [stats.value.militaryScore, stats.value.economyScore],
          backgroundColor: ['#e74c3c', '#50c878']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        indexAxis: 'y'
      }
    }))
  }
}

const close = () => {
  emit('close')
}

watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      createCharts()
    })
  }
})

onMounted(() => {
  if (props.visible) {
    createCharts()
  }
})
</script>

<style scoped>
.statistics-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.statistics-modal {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 16px;
  max-width: 1200px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  color: white;
}

.statistics-header {
  padding: 2rem;
  text-align: center;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.statistics-header h2 {
  margin: 0;
  font-size: 3rem;
  font-weight: bold;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.victory-condition {
  margin-top: 0.5rem;
  font-size: 1.2rem;
  opacity: 0.9;
}

.statistics-content {
  padding: 2rem;
}

.stats-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-4px);
  background: rgba(255, 255, 255, 0.08);
}

.stat-icon {
  font-size: 2.5rem;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: bold;
}

.stats-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
}

.chart-container h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
}

.chart-container canvas {
  max-height: 300px;
}

.stats-detailed {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.stat-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
}

.stat-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.3rem;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 0.5rem;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-number {
  font-weight: bold;
  color: #4a90e2;
}

.tech-list {
  margin-top: 1rem;
  max-height: 200px;
  overflow-y: auto;
}

.tech-item {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  margin-bottom: 0.5rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.statistics-footer {
  padding: 1.5rem 2rem;
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 1rem 3rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}
</style>
