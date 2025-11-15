<template>
  <div class="resource-counter" :class="{ 'resource-counter--insufficient': isInsufficient }">
    <q-icon :name="icon" :size="size" :color="iconColor" />
    <span class="resource-value" :class="`text-${size}`">{{ formattedValue }}</span>
    <span v-if="showDelta && delta !== 0" class="resource-delta" :class="deltaClass">
      {{ deltaText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  type: 'food' | 'wood' | 'gold' | 'stone' | 'population'
  value: number
  delta?: number
  showDelta?: boolean
  size?: string
  required?: number
}

const props = withDefaults(defineProps<Props>(), {
  delta: 0,
  showDelta: false,
  size: 'md',
  required: undefined
})

const icon = computed(() => {
  switch (props.type) {
    case 'food':
      return 'restaurant'
    case 'wood':
      return 'park'
    case 'gold':
      return 'paid'
    case 'stone':
      return 'foundation'
    case 'population':
      return 'people'
    default:
      return 'help'
  }
})

const iconColor = computed(() => {
  if (isInsufficient.value) return 'negative'

  switch (props.type) {
    case 'food':
      return 'deep-orange'
    case 'wood':
      return 'brown'
    case 'gold':
      return 'yellow-9'
    case 'stone':
      return 'grey-7'
    case 'population':
      return 'blue-6'
    default:
      return 'grey'
  }
})

const formattedValue = computed(() => {
  if (props.type === 'population' && props.required !== undefined) {
    return `${props.value}/${props.required}`
  }
  return props.value.toLocaleString()
})

const isInsufficient = computed(() => {
  return props.required !== undefined && props.value < props.required
})

const deltaClass = computed(() => {
  return props.delta > 0 ? 'resource-delta--positive' : 'resource-delta--negative'
})

const deltaText = computed(() => {
  const sign = props.delta > 0 ? '+' : ''
  return `${sign}${props.delta}`
})
</script>

<style lang="scss" scoped>
.resource-counter {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
  }

  &--insufficient {
    animation: pulse 1s ease-in-out infinite;
  }
}

.resource-value {
  font-weight: 600;
  color: white;
  min-width: 3rem;
  text-align: right;
}

.resource-delta {
  font-size: 0.875rem;
  font-weight: 500;

  &--positive {
    color: #4caf50;
  }

  &--negative {
    color: #f44336;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
