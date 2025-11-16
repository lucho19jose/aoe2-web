<template>
  <q-card class="production-panel">
    <q-card-section class="panel-header">
      <div class="text-h6">{{ building?.name || 'Building' }}</div>
      <div class="text-caption text-grey">Production</div>
    </q-card-section>

    <q-separator />

    <!-- Production Queue -->
    <q-card-section v-if="building && building.productionQueue.length > 0">
      <div class="text-subtitle2 q-mb-sm">Queue ({{ building.productionQueue.length }}/{{ building.maxQueueSize }})</div>

      <div
        v-for="(item, index) in building.productionQueue"
        :key="index"
        class="queue-item"
        :class="{ 'active': index === 0 }"
      >
        <div class="queue-item-info">
          <q-icon :name="getUnitIcon(item.unitType)" size="sm" />
          <span class="queue-item-name">{{ formatUnitType(item.unitType) }}</span>
        </div>

        <div class="queue-item-progress">
          <q-linear-progress
            v-if="index === 0"
            :value="item.progress"
            color="primary"
            size="8px"
            class="q-mb-xs"
          />
          <div class="text-caption">
            <template v-if="index === 0">
              {{ Math.ceil(item.remainingTime) }}s
            </template>
            <template v-else>
              Queued
            </template>
          </div>
        </div>

        <q-btn
          flat
          dense
          round
          icon="close"
          size="xs"
          color="negative"
          @click="$emit('cancel', index)"
        >
          <q-tooltip>Cancel</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <q-separator v-if="building && building.productionQueue.length > 0" />

    <!-- Available Units -->
    <q-card-section v-if="building && building.canProduce.length > 0">
      <div class="text-subtitle2 q-mb-sm">Train Units</div>

      <div class="units-grid">
        <q-btn
          v-for="unitType in building.canProduce"
          :key="unitType"
          class="unit-btn"
          :disable="!canAfford(unitType)"
          @click="$emit('train', unitType)"
        >
          <div class="unit-btn-content">
            <q-icon :name="getUnitIcon(unitType)" size="md" />
            <div class="unit-btn-name">{{ formatUnitType(unitType) }}</div>
            <div class="unit-btn-cost">
              <template v-for="(amount, resource) in getUnitCost(unitType)" :key="resource">
                <span class="cost-item" :class="{ 'insufficient': !hasEnoughResource(resource, amount) }">
                  {{ amount }} {{ resource }}
                </span>
              </template>
            </div>
            <div class="text-caption">{{ getUnitTrainTime(unitType) }}s</div>
          </div>

          <q-tooltip>
            <div class="text-bold">{{ formatUnitType(unitType) }}</div>
            <div>Train time: {{ getUnitTrainTime(unitType) }}s</div>
            <div>Cost: {{ formatCost(getUnitCost(unitType)) }}</div>
          </q-tooltip>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section v-else-if="building">
      <div class="text-center text-grey">
        This building cannot produce units
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UNIT_TYPES } from '@/config/gameConfig'
import type { UnitType } from '@/types/game'

interface Building {
  id: string
  name: string
  type: string
  canProduce: UnitType[]
  productionQueue: Array<{
    unitType: UnitType
    progress: number
    totalTime: number
    remainingTime: number
  }>
  maxQueueSize: number
}

interface Resources {
  food: number
  wood: number
  gold: number
  stone: number
}

interface Props {
  building: Building | null
  resources: Resources
}

const props = defineProps<Props>()

defineEmits<{
  train: [unitType: UnitType]
  cancel: [index: number]
}>()

function formatUnitType(unitType: UnitType): string {
  return unitType.charAt(0).toUpperCase() + unitType.slice(1).replace('_', ' ')
}

function getUnitIcon(unitType: UnitType): string {
  switch (unitType.toLowerCase()) {
    case 'villager':
      return 'engineering'
    case 'militia':
    case 'swordsman':
    case 'spearman':
      return 'swords'
    case 'archer':
    case 'crossbowman':
    case 'skirmisher':
      return 'auto_fix_high'
    case 'knight':
    case 'cavalry':
    case 'scout':
    case 'camel':
      return 'directions_run'
    default:
      return 'person'
  }
}

function getUnitCost(unitType: UnitType): Record<string, number> {
  const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
  return unitConfig?.cost || {}
}

function getUnitTrainTime(unitType: UnitType): number {
  const unitConfig = UNIT_TYPES[unitType.toUpperCase() as keyof typeof UNIT_TYPES]
  return unitConfig?.trainTime || 0
}

function hasEnoughResource(resource: string, amount: number): boolean {
  const resourceKey = resource as keyof Resources
  return props.resources[resourceKey] >= amount
}

function canAfford(unitType: UnitType): boolean {
  const cost = getUnitCost(unitType)
  return Object.entries(cost).every(([resource, amount]) =>
    hasEnoughResource(resource, amount)
  )
}

function formatCost(cost: Record<string, number>): string {
  return Object.entries(cost)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(', ')
}
</script>

<style lang="scss" scoped>
.production-panel {
  min-width: 350px;
  max-width: 500px;
}

.panel-header {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.05) 100%);
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  margin-bottom: 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  transition: background 0.2s;

  &.active {
    background: rgba(33, 150, 243, 0.1);
    border-left: 3px solid #2196f3;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.queue-item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 100px;
}

.queue-item-name {
  font-weight: 500;
}

.queue-item-progress {
  flex: 1;
}

.units-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 0.75rem;
}

.unit-btn {
  height: auto;
  padding: 0.75rem;
  flex-direction: column;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.unit-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.unit-btn-name {
  font-weight: 600;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.unit-btn-cost {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.cost-item {
  color: #4caf50;

  &.insufficient {
    color: #f44336;
    text-decoration: line-through;
  }
}
</style>
