<template>
  <q-page class="flex flex-center register-page">
    <q-card class="register-card q-pa-md">
      <q-card-section class="text-center">
        <div class="text-h4 text-weight-bold text-primary q-mb-sm">
          Create Account
        </div>
        <div class="text-subtitle2 text-grey-7">Join the Age of Empires II community</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleRegister" class="q-gutter-md">
          <q-input
            v-model="form.username"
            label="Username"
            outlined
            dense
            :rules="[
              val => !!val || 'Username is required',
              val => val.length >= 3 || 'Username must be at least 3 characters',
              val => /^[a-zA-Z0-9_]+$/.test(val) || 'Username can only contain letters, numbers, and underscores'
            ]"
            autofocus
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            dense
            :rules="[
              val => !!val || 'Email is required',
              val => /.+@.+\..+/.test(val) || 'Please enter a valid email'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>

          <q-input
            v-model="form.password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[
              val => !!val || 'Password is required',
              val => val.length >= 8 || 'Password must be at least 8 characters',
              val => /[A-Z]/.test(val) || 'Password must contain at least one uppercase letter',
              val => /[a-z]/.test(val) || 'Password must contain at least one lowercase letter',
              val => /[0-9]/.test(val) || 'Password must contain at least one number'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-input
            v-model="form.confirmPassword"
            label="Confirm Password"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :rules="[
              val => !!val || 'Please confirm your password',
              val => val === form.password || 'Passwords do not match'
            ]"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
          </q-input>

          <q-checkbox
            v-model="form.acceptTerms"
            dense
          >
            <template v-slot:default>
              <span class="text-caption">
                I agree to the
                <a href="#" class="text-primary">Terms of Service</a>
                and
                <a href="#" class="text-primary">Privacy Policy</a>
              </span>
            </template>
          </q-checkbox>

          <div v-if="authStore.error" class="text-negative text-center text-caption">
            {{ authStore.error }}
          </div>

          <q-btn
            type="submit"
            label="Create Account"
            color="primary"
            class="full-width"
            :loading="authStore.loading"
            :disable="!isFormValid"
          />

          <div class="text-center q-mt-md">
            <q-btn
              flat
              label="Already have an account? Login"
              color="primary"
              @click="$router.push('/login')"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useQuasar } from 'quasar'

const router = useRouter()
const authStore = useAuthStore()
const $q = useQuasar()

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
})

const showPassword = ref(false)

const isFormValid = computed(() => {
  return (
    form.value.username.length >= 3 &&
    /.+@.+\..+/.test(form.value.email) &&
    form.value.password.length >= 8 &&
    form.value.password === form.value.confirmPassword &&
    form.value.acceptTerms
  )
})

async function handleRegister() {
  try {
    await authStore.register(
      form.value.username,
      form.value.email,
      form.value.password
    )

    $q.notify({
      type: 'positive',
      message: `Welcome to Age of Empires II, ${authStore.user?.username}!`,
      position: 'top',
    })

    // Redirect to home
    router.push('/')
  } catch (error) {
    // Error is handled in the store
    console.error('Registration failed:', error)
  }
}
</script>

<style scoped lang="scss">
.register-page {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.register-card {
  width: 100%;
  max-width: 450px;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
</style>
