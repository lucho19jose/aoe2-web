<template>
  <q-card class="unit-card">
    <q-card-section class="unit-header" :style="{ borderLeft: `4px solid ${playerColor}` }">
      <div class="row items-center">
        <div class="col">
          <div class="text-h6">{{ unit.name }}</div>
          <div class="text-caption text-grey">{{ unitType }}</div>
        </div>
        <div class="col-auto">
          <q-icon :name="unitIcon" size="lg" :color="iconColor" />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <!-- Health -->
      <div class="stat-row">
        <div class="stat-label">
          <q-icon name="favorite" color="red" size="sm" />
          <span>Health</span>
        </div>
        <div class="stat-value">{{ unit.hp }} / {{ unit.maxHp }}</div>
      </div>
      <q-linear-progress
        :value="healthPercent"
        :color="healthColor"
        size="8px"
        class="q-mb-md"
      />

      <!-- Attack -->
      <div v-if="unit.attack" class="stat-row">
        <div class="stat-label">
          <q-icon name="gavel" color="orange" size="sm" />
          <span>Attack</span>
        </div>
        <div class="stat-value">{{ unit.attack }}</div>
      </div>

      <!-- Defense -->
      <div v-if="unit.defense !== undefined" class="stat-row">
        <div class="stat-label">
          <q-icon name="shield" color="blue" size="sm" />
          <span>Defense</span>
        </div>
        <div class="stat-value">{{ unit.defense }}</div>
      </div>

      <!-- Speed -->
      <div v-if="unit.speed" class="stat-row">
        <div class="stat-label">
          <q-icon name="speed" color="green" size="sm" />
          <span>Speed</span>
        </div>
        <div class="stat-value">{{ unit.speed }}</div>
      </div>

      <!-- Status -->
      <div class="stat-row q-mt-md">
        <q-badge :color="statusColor" :label="statusLabel" />
      </div>
    </q-card-section>

    <q-separator v-if="showActions" />

    <q-card-actions v-if="showActions" align="right">
      <q-btn
        flat
        color="negative"
        label="Delete"
        icon="delete"
        size="sm"
        @click="$emit('delete', unit)"
      />
      <q-btn
        flat
        color="warning"
        label="Stop"
        icon="stop"
        size="sm"
        @click="$emit('stop', unit)"
      />
      <q-btn
        flat
        color="primary"
        label="Select"
        icon="touch_app"
        size="sm"
        @click="$emit('select', unit)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Unit {
  id: string
  name: string
  type: string
  hp: number
  maxHp: number
  attack?: number
  defense?: number
  speed?: number
  isMoving?: boolean
}

interface Props {
  unit: Unit
  playerColor?: string
  showActions?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  playerColor: '#FF0000',
  showActions: true
})

defineEmits<{
  delete: [unit: Unit]
  stop: [unit: Unit]
  select: [unit: Unit]
}>()

const unitType = computed(() => {
  return props.unit.type.charAt(0).toUpperCase() + props.unit.type.slice(1)
})

const unitIcon = computed(() => {
  switch (props.unit.type.toLowerCase()) {
    case 'villager':
      return 'engineering'
    case 'militia':
    case 'swordsman':
      return 'swords'
    case 'archer':
    case 'crossbowman':
      return 'auto_fix_high'
    case 'knight':
    case 'cavalry':
      return 'directions_run'
    case 'monk':
      return 'auto_fix_high'
    default:
      return 'person'
  }
})

const iconColor = computed(() => {
  if (healthPercent.value < 0.3) return 'negative'
  if (healthPercent.value < 0.6) return 'warning'
  return 'positive'
})

const healthPercent = computed(() => {
  return props.unit.hp / props.unit.maxHp
})

const healthColor = computed(() => {
  if (healthPercent.value > 0.6) return 'positive'
  if (healthPercent.value > 0.3) return 'warning'
  return 'negative'
})

const statusLabel = computed(() => {
  if (props.unit.hp <= 0) return 'Dead'
  if (props.unit.isMoving) return 'Moving'
  return 'Idle'
})

const statusColor = computed(() => {
  if (props.unit.hp <= 0) return 'grey'
  if (props.unit.isMoving) return 'info'
  return 'positive'
})
</script>

<style lang="scss" scoped>
.unit-card {
  min-width: 250px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.unit-header {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  font-size: 1.1rem;
}
</style>
