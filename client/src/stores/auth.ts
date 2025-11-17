import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/ApiService'

export interface User {
  id: number
  username: string
  email: string
  avatar?: string
  created_at?: string
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed
  const isAuthenticated = computed(() => !!user.value)
  const accessToken = computed(() => localStorage.getItem('access_token'))

  // Actions
  async function login(username: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.login(username, password)

      // Fetch user profile after successful login
      await fetchCurrentUser()

      return response
    } catch (err: any) {
      error.value = err.response?.data?.detail || 'Login failed. Please check your credentials.'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const response = await api.register(username, email, password)

      // Auto-login after registration
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access)
        localStorage.setItem('refresh_token', response.refresh)
        await fetchCurrentUser()
      }

      return response
    } catch (err: any) {
      const errorData = err.response?.data
      if (errorData) {
        // Handle field-specific errors
        const errors: string[] = []
        for (const field in errorData) {
          if (Array.isArray(errorData[field])) {
            errors.push(`${field}: ${errorData[field].join(', ')}`)
          } else {
            errors.push(`${field}: ${errorData[field]}`)
          }
        }
        error.value = errors.join('; ')
      } else {
        error.value = 'Registration failed. Please try again.'
      }
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true

    try {
      await api.logout()
      user.value = null
      // Clear local storage
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      loading.value = false
    }
  }

  async function fetchCurrentUser() {
    if (!accessToken.value) {
      user.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      const userData = await api.getCurrentUser()
      user.value = userData
      return userData
    } catch (err: any) {
      error.value = 'Failed to fetch user data'
      user.value = null
      // Clear invalid tokens
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(data: Partial<User>) {
    loading.value = true
    error.value = null

    try {
      const updated = await api.updateProfile(data)
      user.value = { ...user.value, ...updated }
      return updated
    } catch (err: any) {
      error.value = 'Failed to update profile'
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  // Initialize auth state on app load
  async function initialize() {
    if (accessToken.value) {
      try {
        await fetchCurrentUser()
      } catch (err) {
        // Silent fail - user will be logged out
        console.warn('Failed to initialize auth:', err)
      }
    }
  }

  return {
    // State
    user,
    loading,
    error,

    // Getters
    isAuthenticated,
    accessToken,

    // Actions
    login,
    register,
    logout,
    fetchCurrentUser,
    updateProfile,
    clearError,
    initialize,
  }
})
