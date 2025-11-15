<template>
  <div class="lobby-view">
    <div class="container">
      <div class="header">
        <q-btn flat icon="arrow_back" label="Back" @click="goBack" />
        <h2>Multiplayer Lobby</h2>
        <div style="width: 100px"></div>
      </div>

      <div class="content">
        <div class="game-list">
          <h3>Available Games</h3>
          <q-list bordered separator>
            <q-item v-for="game in games" :key="game.id" clickable @click="joinGame(game)">
              <q-item-section>
                <q-item-label>{{ game.name }}</q-item-label>
                <q-item-label caption>{{ game.players }}/{{ game.maxPlayers }} players</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="game.status === 'waiting' ? 'green' : 'orange'">
                  {{ game.status }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div class="actions">
          <q-btn color="primary" label="Create Game" @click="createGame" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const games = ref([
  { id: 1, name: 'Quick Match', players: 2, maxPlayers: 4, status: 'waiting' },
  { id: 2, name: 'Ranked 1v1', players: 1, maxPlayers: 2, status: 'waiting' },
  { id: 3, name: 'Team Game', players: 6, maxPlayers: 8, status: 'starting' }
])

const goBack = () => {
  router.push('/')
}

const joinGame = (game: any) => {
  console.log('Joining game:', game.id)
  router.push('/game')
}

const createGame = () => {
  console.log('Creating new game')
  router.push('/game')
}
</script>

<style lang="scss" scoped>
.lobby-view {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  h2 {
    color: #f0a500;
    font-size: 2rem;
    margin: 0;
  }
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.game-list {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;

  h3 {
    color: white;
    margin-bottom: 1rem;
  }
}

.actions {
  text-align: center;
}
</style>
