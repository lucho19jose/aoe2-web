<template>
  <q-card class="game-card" :class="{ 'game-card--full': isFull, 'game-card--starting': isStarting }">
    <q-card-section>
      <div class="row items-center">
        <div class="col">
          <div class="text-h6">{{ game.name }}</div>
          <div class="text-caption text-grey">{{ mapSizeLabel }}</div>
        </div>
        <div class="col-auto">
          <q-badge :color="statusColor" :label="statusLabel" />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row items-center q-gutter-sm">
        <q-icon name="people" size="sm" />
        <span class="text-body2">
          {{ game.player_count || 0 }} / {{ game.max_players || 8 }} players
        </span>
      </div>

      <q-linear-progress
        :value="playerProgress"
        :color="progressColor"
        class="q-mt-sm"
        size="8px"
      />
    </q-card-section>

    <q-separator v-if="showPlayers && game.players && game.players.length > 0" />

    <q-card-section v-if="showPlayers && game.players && game.players.length > 0" class="players-section">
      <div class="text-subtitle2 q-mb-xs">Players:</div>
      <q-chip
        v-for="player in game.players"
        :key="player.id"
        :color="player.is_ready ? 'positive' : 'grey'"
        text-color="white"
        size="sm"
        :icon="player.is_ready ? 'check_circle' : 'schedule'"
      >
        {{ player.user.username }}
      </q-chip>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn
        v-if="canJoin"
        flat
        color="primary"
        label="Join"
        icon="login"
        @click="$emit('join', game)"
      />
      <q-btn
        v-if="canView"
        flat
        color="secondary"
        label="View"
        icon="visibility"
        @click="$emit('view', game)"
      />
      <q-btn
        v-if="canSpectate"
        flat
        color="grey"
        label="Spectate"
        icon="remove_red_eye"
        @click="$emit('spectate', game)"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Game {
  id: number
  name: string
  status: 'waiting' | 'starting' | 'in_progress' | 'finished'
  max_players: number
  player_count: number
  map_size: string
  players?: Array<{
    id: number
    user: { username: string }
    is_ready: boolean
  }>
}

interface Props {
  game: Game
  showPlayers?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showPlayers: false
})

defineEmits<{
  join: [game: Game]
  view: [game: Game]
  spectate: [game: Game]
}>()

const statusLabel = computed(() => {
  switch (props.game.status) {
    case 'waiting':
      return 'Waiting'
    case 'starting':
      return 'Starting'
    case 'in_progress':
      return 'In Progress'
    case 'finished':
      return 'Finished'
    default:
      return 'Unknown'
  }
})

const statusColor = computed(() => {
  switch (props.game.status) {
    case 'waiting':
      return 'positive'
    case 'starting':
      return 'warning'
    case 'in_progress':
      return 'info'
    case 'finished':
      return 'grey'
    default:
      return 'grey'
  }
})

const mapSizeLabel = computed(() => {
  const size = props.game.map_size || 'medium'
  return size.charAt(0).toUpperCase() + size.slice(1) + ' Map'
})

const playerProgress = computed(() => {
  return (props.game.player_count || 0) / (props.game.max_players || 1)
})

const progressColor = computed(() => {
  if (playerProgress.value >= 1) return 'negative'
  if (playerProgress.value >= 0.75) return 'warning'
  return 'positive'
})

const isFull = computed(() => {
  return (props.game.player_count || 0) >= (props.game.max_players || 0)
})

const isStarting = computed(() => {
  return props.game.status === 'starting'
})

const canJoin = computed(() => {
  return props.game.status === 'waiting' && !isFull.value
})

const canView = computed(() => {
  return props.game.status === 'waiting'
})

const canSpectate = computed(() => {
  return props.game.status === 'in_progress'
})
</script>

<style lang="scss" scoped>
.game-card {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  }

  &--full {
    opacity: 0.7;
  }

  &--starting {
    border: 2px solid var(--q-warning);
  }
}

.players-section {
  max-height: 120px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 2px;
  }
}
</style>
