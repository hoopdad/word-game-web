import axios from 'axios';
class ApiClient {
    constructor(baseURL) {
        Object.defineProperty(this, "client", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "authToken", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.client = axios.create({
            baseURL,
            timeout: 10000,
        });
        this.client.interceptors.request.use((config) => {
            if (this.authToken) {
                config.headers.Authorization = `Bearer ${this.authToken}`;
            }
            return config;
        });
    }
    setAuthToken(token) {
        this.authToken = token;
    }
    async checkNameAvailability(name) {
        try {
            const response = await this.client.get(`/users/check-name/${encodeURIComponent(name)}`);
            return response.status === 200;
        }
        catch (error) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const axiosError = error;
            if (axiosError.response?.status === 409) {
                return false;
            }
            throw error;
        }
    }
    async registerUser(displayName) {
        await this.client.post('/users/register', { display_name: displayName });
    }
    async getGameCount() {
        const response = await this.client.get('/scores/game-count');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.count;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAllTimeLeaderboard() {
        const response = await this.client.get('/scores/all-time');
        return response.data;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getTodayLeaderboard() {
        const response = await this.client.get('/scores/today');
        return response.data;
    }
    async startGame() {
        const response = await this.client.post('/game/start', {});
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.gameId;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getCategoryConfig() {
        const response = await this.client.get('/categories/config');
        return response.data;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async updateCategoryConfig(config) {
        await this.client.put('/categories/config', config);
    }
    async getWebSocketTicket() {
        const response = await this.client.get('/game/ws-ticket');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.ticket;
    }
}
const apiClient = new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api');
export default apiClient;
