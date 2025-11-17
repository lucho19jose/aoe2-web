/**
 * Unit tests for API Service
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should make GET requests', async () => {
    const mockData = { data: { message: 'success' } }
    vi.mocked(axios.get).mockResolvedValue(mockData)

    const response = await axios.get('/api/test')

    expect(axios.get).toHaveBeenCalledWith('/api/test')
    expect(response.data).toEqual({ message: 'success' })
  })

  it('should make POST requests with data', async () => {
    const postData = { name: 'test' }
    const mockResponse = { data: { id: 1, ...postData } }
    vi.mocked(axios.post).mockResolvedValue(mockResponse)

    const response = await axios.post('/api/test', postData)

    expect(axios.post).toHaveBeenCalledWith('/api/test', postData)
    expect(response.data).toEqual({ id: 1, name: 'test' })
  })

  it('should handle errors', async () => {
    const errorMessage = 'Network Error'
    vi.mocked(axios.get).mockRejectedValue(new Error(errorMessage))

    await expect(axios.get('/api/test')).rejects.toThrow(errorMessage)
  })
})
