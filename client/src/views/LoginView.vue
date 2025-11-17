<template>
  <q-page class="flex flex-center login-page">
    <q-card class="login-card q-pa-md">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Age of Empires II
        </div>
        <div class="text-h6 text-grey-7">Web Edition</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            v-model="username"
            label="Username"
            outlined
            dense
            :rules="[val => !!val || 'Username is required']"
            autofocus
            @keyup.enter="handleLogin"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            type="password"
            outlined
            dense
            :rules="[val => !!val || 'Password is required']"
            @keyup.enter="handleLogin"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <div v-if="authStore.error" class="text-negative text-center">
            {{ authStore.error }}
          </div>

          <q-btn
            type="submit"
            label="Login"
            color="primary"
            class="full-width"
            :loading="authStore.loading"
            :disable="!username || !password"
          />

          <div class="text-center q-mt-md">
            <q-btn
              flat
              label="Don't have an account? Register"
              color="primary"
              @click="$router.push('/register')"
            />
          </div>

          <q-separator class="q-my-md" />

          <div class="text-center">
            <q-btn
              flat
              label="Continue as Guest"
              color="grey-7"
              @click="continueAsGuest"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const username = ref('')
const password = ref('')

async function handleLogin() {
  try {
    await authStore.login(username.value, password.value)

    $q.notify({
      type: 'positive',
      message: `Welcome back, ${authStore.user?.username}!`,
      position: 'top',
    })

    // Redirect to home or return URL
    const returnUrl = router.currentRoute.value.query.redirect as string
    router.push(returnUrl || '/')
  } catch (error) {
    // Error is handled in the store
    console.error('Login failed:', error)
  }
}

function continueAsGuest() {
  $q.notify({
    type: 'info',
    message: 'Continuing as guest - multiplayer features disabled',
    position: 'top',
  })
  router.push('/')
}
</script>

<style scoped lang="scss">
.login-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.login-card {
  width: 100%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
</style>
