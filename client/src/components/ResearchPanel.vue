<template>
  <q-card class="research-panel">
    <q-card-section class="panel-header">
      <div class="text-h6">{{ building?.name || 'Building' }}</div>
      <div class="text-caption text-grey">Research Technologies</div>
    </q-card-section>

    <q-separator />

    <!-- Research Queue -->
    <q-card-section v-if="building && building.researchQueue.length > 0">
      <div class="text-subtitle2 q-mb-sm">Research in Progress</div>

      <div
        v-for="(item, index) in building.researchQueue"
        :key="index"
        class="queue-item active"
      >
        <div class="queue-item-info">
          <q-icon name="science" size="sm" />
          <span class="queue-item-name">{{ item.techName }}</span>
        </div>

        <div class="queue-item-progress">
          <q-linear-progress
            :value="item.progress"
            color="primary"
            size="8px"
            class="q-mb-xs"
          />
          <div class="text-caption">
            {{ Math.ceil(item.remainingTime) }}s
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

    <q-separator v-if="building && building.researchQueue.length > 0" />

    <!-- Available Technologies -->
    <q-card-section v-if="availableTechnologies.length > 0">
      <div class="text-subtitle2 q-mb-sm">Available Technologies</div>

      <div class="tech-grid">
        <q-btn
          v-for="tech in availableTechnologies"
          :key="tech.id"
          class="tech-btn"
          :disable="!canAfford(tech) || isResearched(tech.id)"
          @click="$emit('research', tech.id)"
        >
          <div class="tech-btn-content">
            <q-icon :name="getTechIcon(tech.category)" size="md" />
            <div class="tech-btn-name">{{ tech.name }}</div>
            <div class="tech-btn-cost">
              <template v-for="(amount, resource) in tech.cost" :key="resource">
                <span class="cost-item" :class="{ 'insufficient': !hasEnoughResource(resource, amount) }">
                  {{ amount }} {{ resource }}
                </span>
              </template>
            </div>
            <div class="text-caption">{{ tech.researchTime }}s</div>
          </div>

          <q-tooltip>
            <div class="text-bold">{{ tech.name }}</div>
            <div>{{ tech.description }}</div>
            <div>Time: {{ tech.researchTime }}s</div>
            <div>Cost: {{ formatCost(tech.cost) }}</div>
          </q-tooltip>

          <!-- Researched indicator -->
          <div v-if="isResearched(tech.id)" class="researched-badge">
            <q-icon name="check_circle" size="sm" color="green" />
          </div>
        </q-btn>
      </div>
    </q-card-section>

    <q-card-section v-else-if="building">
      <div class="text-center text-grey">
        No technologies available at this building
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getTechnologiesForBuilding, TechCategory } from '@/config/technologies'
import type { Technology } from '@/config/technologies'

interface Building {
  id: string
  name: string
  type: string
  researchQueue: Array<{
    techId: string
    techName: string
    progress: number
    totalTime: number
    remainingTime: number
  }>
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
  researchedTechs: Set<string>
}

const props = defineProps<Props>()

defineEmits<{
  research: [techId: string]
  cancel: [index: number]
}>()

const availableTechnologies = computed(() => {
  if (!props.building) return []
  return getTechnologiesForBuilding(props.building.type)
})

function getTechIcon(category: TechCategory): string {
  switch (category) {
    case TechCategory.MILITARY:
      return 'swords'
    case TechCategory.ECONOMY:
      return 'agriculture'
    case TechCategory.DEFENSE:
      return 'shield'
    default:
      return 'science'
  }
}

function hasEnoughResource(resource: string, amount: number): boolean {
  const resourceKey = resource as keyof Resources
  return props.resources[resourceKey] >= amount
}

function canAfford(tech: Technology): boolean {
  return Object.entries(tech.cost).every(([resource, amount]) =>
    hasEnoughResource(resource, amount || 0)
  )
}

function isResearched(techId: string): boolean {
  return props.researchedTechs.has(techId)
}

function formatCost(cost: Record<string, number | undefined>): string {
  return Object.entries(cost)
    .filter(([_, amount]) => amount !== undefined)
    .map(([resource, amount]) => `${amount} ${resource}`)
    .join(', ')
}
</script>

<style lang="scss" scoped>
.research-panel {
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
  min-width: 120px;
}

.queue-item-name {
  font-weight: 500;
}

.queue-item-progress {
  flex: 1;
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 0.75rem;
}

.tech-btn {
  height: auto;
  padding: 0.75rem;
  flex-direction: column;
  position: relative;

  &:hover:not([disabled]) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }
}

.tech-btn-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.tech-btn-name {
  font-weight: 600;
  font-size: 0.875rem;
  margin-top: 0.25rem;
  text-align: center;
}

.tech-btn-cost {
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

.researched-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  padding: 2px;
}
</style>
