import axios, { AxiosInstance } from 'axios'

class ApiClient {
  private client: AxiosInstance
  private authToken?: string

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
    })

    this.client.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      return config
    })
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  async checkNameAvailability(name: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/users/check-name/${encodeURIComponent(name)}`)
      return response.status === 200
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const axiosError = error as any
      if (axiosError.response?.status === 409) {
        return false
      }
      throw error
    }
  }

  async registerUser(displayName: string): Promise<void> {
    await this.client.post('/users/register', { displayName })
  }

  async getGameCount(): Promise<number> {
    const response = await this.client.get('/scores/game-count')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).count
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllTimeLeaderboard(): Promise<any[]> {
    const response = await this.client.get('/scores/all-time')
    return response.data
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTodayLeaderboard(): Promise<any[]> {
    const response = await this.client.get('/scores/today')
    return response.data
  }

  async startGame(): Promise<string> {
    const response = await this.client.post('/game/start', {})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).gameId
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCategoryConfig(): Promise<any> {
    const response = await this.client.get('/categories/config')
    return response.data
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateCategoryConfig(config: any): Promise<void> {
    await this.client.put('/categories/config', config)
  }

  async getWebSocketTicket(): Promise<string> {
    const response = await this.client.post('/auth/ws-ticket')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).ticket
  }
}

const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api')

export default apiClient
