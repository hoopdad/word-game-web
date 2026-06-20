import axios, { AxiosInstance } from 'axios'

interface CategoryConfigResponse {
  urls: string[]
  generated_categories: string[]
  source: string
}

interface CategoryConfigUpdateRequest {
  urls: string[]
}

interface GameStatusResponse {
  status: string
  game_id: string | null
  current_category: string | null
  current_guesser: string | null
  current_guesser_name: string | null
  your_user_id: string | null
  your_role: 'guesser' | 'cluegiver' | null
  round_remaining: number
  countdown_remaining: number
  scores: Record<string, number>
}

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
      const response = await this.client.get<{ available?: boolean }>(
        `/users/check-name/${encodeURIComponent(name)}`,
      )
      return response.data?.available === true
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } }
      if (axiosError.response?.status === 409) {
        return false
      }
      throw error
    }
  }

  async registerUser(displayName: string): Promise<void> {
    await this.client.post('/users/register', { display_name: displayName })
  }

  async updateProfile(displayName: string): Promise<void> {
    await this.client.put('/users/profile', { display_name: displayName })
  }

  async getActiveUsers(): Promise<string[]> {
    const response = await this.client.get('/users/active')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).users.map((u: any) => u.display_name)
  }

  async getGameCount(): Promise<number> {
    const response = await this.client.get('/scores/game-count')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).count
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getAllTimeLeaderboard(): Promise<any[]> {
    const response = await this.client.get('/scores/all-time')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((response.data as any).scores || []).map((s: any) => ({
      userId: s.user_id,
      displayName: s.user_id,
      points: s.total_points,
    }))
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getTodayLeaderboard(): Promise<any[]> {
    const response = await this.client.get('/scores/today')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((response.data as any).scores || []).map((s: any) => ({
      userId: s.user_id,
      displayName: s.user_id,
      points: s.total_points,
    }))
  }

  async startGame(): Promise<string> {
    const response = await this.client.post('/game/start', {})
    const data = response.data as { game_id?: string }
    if (typeof data.game_id !== 'string') {
      throw new Error('Missing game_id in start game response')
    }
    return data.game_id
  }

  async getGameStatus(): Promise<GameStatusResponse> {
    const response = await this.client.get('/game/status')
    return response.data as GameStatusResponse
  }

  async getCategoryConfig(): Promise<CategoryConfigResponse> {
    const response = await this.client.get('/categories/config')
    return response.data as CategoryConfigResponse
  }

  async updateCategoryConfig(config: CategoryConfigUpdateRequest): Promise<void> {
    await this.client.put('/categories/config', config)
  }

  async getWebSocketTicket(): Promise<string> {
    const response = await this.client.post('/auth/ws-ticket')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (response.data as any).ticket
  }
}

const apiClient = new ApiClient('/api')

export default apiClient
