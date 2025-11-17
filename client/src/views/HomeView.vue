<template>
  <div class="home-view">
    <!-- User info bar -->
    <div class="user-bar">
      <div class="user-info" v-if="authStore.isAuthenticated">
        <q-icon name="account_circle" size="md" />
        <span class="username">{{ authStore.user?.username }}</span>
        <q-btn
          flat
          dense
          icon="logout"
          color="white"
          @click="handleLogout"
        >
          <q-tooltip>Logout</q-tooltip>
        </q-btn>
      </div>
      <div class="auth-buttons" v-else>
        <q-btn
          flat
          label="Login"
          color="white"
          @click="$router.push('/login')"
        />
        <q-btn
          unelevated
          label="Register"
          color="primary"
          @click="$router.push('/register')"
        />
      </div>
    </div>

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
          icon="person"
          @click="startSinglePlayer"
        />
        <q-btn
          size="lg"
          color="primary"
          label="Multiplayer"
          class="menu-btn"
          icon="groups"
          @click="goToLobby"
          :disable="!authStore.isAuthenticated"
        >
          <q-tooltip v-if="!authStore.isAuthenticated">
            Login required for multiplayer
          </q-tooltip>
        </q-btn>
        <q-btn
          size="lg"
          color="primary"
          label="Settings"
          class="menu-btn"
          icon="settings"
          @click="goToSettings"
        />
        <q-btn
          size="lg"
          color="primary"
          label="About"
          class="menu-btn"
          icon="info"
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
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const startSinglePlayer = () => {
  router.push('/game')
}

const goToLobby = () => {
  if (!authStore.isAuthenticated) {
    $q.notify({
      type: 'warning',
      message: 'Please login to play multiplayer',
    })
    router.push('/login')
    return
  }
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

const handleLogout = async () => {
  $q.dialog({
    title: 'Logout',
    message: 'Are you sure you want to logout?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await authStore.logout()
    $q.notify({
      type: 'info',
      message: 'Logged out successfully'
    })
  })
}
</script>

<style lang="scss" scoped>
.home-view {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
}

.user-bar {
  position: absolute;
  top: 0;
  right: 0;
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 100;

  .user-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: white;

    .username {
      font-weight: 600;
    }
  }

  .auth-buttons {
    display: flex;
    gap: 0.5rem;
  }
}

.container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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
