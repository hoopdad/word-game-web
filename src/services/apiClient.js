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
            return response.data?.available === true;
        }
        catch (error) {
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
    async updateProfile(displayName) {
        await this.client.put('/users/profile', { display_name: displayName });
    }
    async getActiveUsers() {
        const response = await this.client.get('/users/active');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.users.map((u) => u.display_name);
    }
    async getGameCount() {
        const response = await this.client.get('/scores/game-count');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.count;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getAllTimeLeaderboard() {
        const response = await this.client.get('/scores/all-time');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (response.data.scores || []).map((s) => ({
            userId: s.user_id,
            displayName: s.user_id,
            points: s.total_points,
        }));
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getTodayLeaderboard() {
        const response = await this.client.get('/scores/today');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (response.data.scores || []).map((s) => ({
            userId: s.user_id,
            displayName: s.user_id,
            points: s.total_points,
        }));
    }
    async startGame() {
        const response = await this.client.post('/game/start', {});
        const data = response.data;
        if (typeof data.game_id !== 'string') {
            throw new Error('Missing game_id in start game response');
        }
        return data.game_id;
    }
    async getGameStatus() {
        const response = await this.client.get('/game/status');
        return response.data;
    }
    async getCategoryConfig() {
        const response = await this.client.get('/categories/config');
        return response.data;
    }
    async updateCategoryConfig(config) {
        await this.client.put('/categories/config', config);
    }
    async getWebSocketTicket() {
        const response = await this.client.post('/auth/ws-ticket');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return response.data.ticket;
    }
}
const apiClient = new ApiClient('/api');
export default apiClient;
