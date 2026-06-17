import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '@/services/apiClient';
describe('apiClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });
    it('should have checkNameAvailability method', () => {
        expect(typeof apiClient.checkNameAvailability).toBe('function');
    });
    it('should have registerUser method', () => {
        expect(typeof apiClient.registerUser).toBe('function');
    });
    it('should have getGameCount method', () => {
        expect(typeof apiClient.getGameCount).toBe('function');
    });
    it('should have getAllTimeLeaderboard method', () => {
        expect(typeof apiClient.getAllTimeLeaderboard).toBe('function');
    });
    it('should have getTodayLeaderboard method', () => {
        expect(typeof apiClient.getTodayLeaderboard).toBe('function');
    });
    it('should have getCategoryConfig method', () => {
        expect(typeof apiClient.getCategoryConfig).toBe('function');
    });
    it('should have updateCategoryConfig method', () => {
        expect(typeof apiClient.updateCategoryConfig).toBe('function');
    });
    it('should have startGame method', () => {
        expect(typeof apiClient.startGame).toBe('function');
    });
    it('should setAuthToken and use it in requests', () => {
        apiClient.setAuthToken('test-token');
        expect(typeof apiClient.setAuthToken).toBe('function');
    });
});
