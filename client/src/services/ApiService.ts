import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * API Service for communicating with the backend REST API
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              const response = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
                refresh: refreshToken,
              })

              const { access } = response.data
              localStorage.setItem('access_token', access)

              originalRequest.headers.Authorization = `Bearer ${access}`
              return this.client(originalRequest)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }

        return Promise.reject(error)
      }
    )
  }

  // Generic request methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config)
    return response.data
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config)
    return response.data
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config)
    return response.data
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config)
    return response.data
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config)
    return response.data
  }

  // Auth endpoints
  public async login(username: string, password: string) {
    const response = await this.post('/auth/login/', { username, password })
    if (response.access && response.refresh) {
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
    }
    return response
  }

  public async logout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  public async register(username: string, email: string, password: string) {
    return await this.post('/auth/register/', { username, email, password })
  }

  // Game endpoints
  public async getGames() {
    return await this.get('/games/')
  }

  public async getGame(gameId: string | number) {
    return await this.get(`/games/${gameId}/`)
  }

  public async createGame(data: {
    name: string
    max_players?: number
    map_size?: string
  }) {
    return await this.post('/games/', data)
  }

  public async joinGame(gameId: string | number) {
    return await this.post(`/games/${gameId}/join/`)
  }

  public async leaveGame(gameId: string | number) {
    return await this.post(`/games/${gameId}/leave/`)
  }

  public async startGame(gameId: string | number) {
    return await this.post(`/games/${gameId}/start/`)
  }

  public async getAvailableGames() {
    return await this.get('/games/available/')
  }

  // Player endpoints
  public async getPlayers() {
    return await this.get('/players/')
  }

  public async getPlayer(playerId: string | number) {
    return await this.get(`/players/${playerId}/`)
  }

  public async markPlayerReady(playerId: string | number) {
    return await this.post(`/players/${playerId}/ready/`)
  }

  // User profile
  public async getCurrentUser() {
    return await this.get('/auth/me/')
  }

  public async updateProfile(data: any) {
    return await this.patch('/auth/me/', data)
  }

  // Statistics
  public async getGameStats(gameId: string | number) {
    return await this.get(`/games/${gameId}/stats/`)
  }

  public async getPlayerStats(playerId: string | number) {
    return await this.get(`/players/${playerId}/stats/`)
  }

  // Leaderboard
  public async getLeaderboard(params?: { limit?: number; offset?: number }) {
    return await this.get('/leaderboard/', { params })
  }
}

// Export singleton instance
export const api = new ApiService()
export default api
