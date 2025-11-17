<template>
  <div class="home-view">
    <div class="container">
      <div class="header">
        <h1 class="title">Age of Empires II</h1>
        <h2 class="subtitle">Web Edition</h2>
      </div>

      <div class="menu">
        <q-btn
          size="lg"
          color="primary"
          label="Single Player"
          class="menu-btn"
          @click="startSinglePlayer"
        />
        <q-btn
          size="lg"
          color="primary"
          label="Multiplayer"
          class="menu-btn"
          @click="goToLobby"
        />
        <q-btn
          size="lg"
          color="primary"
          label="Settings"
          class="menu-btn"
          @click="goToSettings"
        />
        <q-btn
          size="lg"
          color="primary"
          label="About"
          class="menu-btn"
          @click="showAbout"
        />
      </div>

      <div class="footer">
        <p>Version 0.1.0 - Alpha</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()

const startSinglePlayer = () => {
  router.push('/single-player')
}

const goToLobby = () => {
  router.push('/lobby')
}

const goToSettings = () => {
  router.push('/settings')
}

const showAbout = () => {
  $q.dialog({
    title: 'About',
    message: 'Age of Empires II: Web Edition\n\nA browser-based RTS game inspired by Age of Empires II.\n\nBuilt with Vue 3, Three.js, and Django.',
    ok: 'Close'
  })
}
</script>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
}

.header {
  margin-bottom: 4rem;

  .title {
    font-size: 4rem;
    font-weight: bold;
    color: #f0a500;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
    margin-bottom: 0.5rem;
  }

  .subtitle {
    font-size: 2rem;
    color: #e94560;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  }
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 400px;
  margin: 0 auto;

  .menu-btn {
    width: 100%;
    height: 60px;
    font-size: 1.2rem;
    font-weight: 600;
  }
}

.footer {
  margin-top: 4rem;
  color: #8b8b8b;
  font-size: 0.9rem;
}
</style>
