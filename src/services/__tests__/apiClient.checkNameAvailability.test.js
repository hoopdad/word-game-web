import { beforeEach, describe, expect, it, vi } from 'vitest';
const { mockGet, mockPost, mockPut, mockRequestUse } = vi.hoisted(() => ({
    mockGet: vi.fn(),
    mockPost: vi.fn(),
    mockPut: vi.fn(),
    mockRequestUse: vi.fn(),
}));
vi.mock('axios', () => ({
    default: {
        create: vi.fn(() => ({
            get: mockGet,
            post: mockPost,
            put: mockPut,
            interceptors: {
                request: {
                    use: mockRequestUse,
                },
            },
        })),
    },
}));
import apiClient from '@/services/apiClient';
describe('apiClient.checkNameAvailability', () => {
    beforeEach(() => {
        mockGet.mockReset();
        mockPost.mockReset();
        mockPut.mockReset();
        mockRequestUse.mockReset();
    });
    it('returns true when API responds with available=true', async () => {
        mockGet.mockResolvedValueOnce({ status: 200, data: { available: true } });
        await expect(apiClient.checkNameAvailability('Alice')).resolves.toBe(true);
        expect(mockGet).toHaveBeenCalledWith('/users/check-name/Alice');
    });
    it('returns false when API responds with available=false', async () => {
        mockGet.mockResolvedValueOnce({ status: 200, data: { available: false } });
        await expect(apiClient.checkNameAvailability('Alice')).resolves.toBe(false);
    });
    it('encodes path parameter when checking names', async () => {
        mockGet.mockResolvedValueOnce({ status: 200, data: { available: true } });
        await expect(apiClient.checkNameAvailability('Alice Bob')).resolves.toBe(true);
        expect(mockGet).toHaveBeenCalledWith('/users/check-name/Alice%20Bob');
    });
    it('returns false for 409 conflict response', async () => {
        mockGet.mockRejectedValueOnce({ response: { status: 409 } });
        await expect(apiClient.checkNameAvailability('TakenName')).resolves.toBe(false);
    });
    it('rethrows non-409 errors', async () => {
        const networkError = new Error('network failure');
        mockGet.mockRejectedValueOnce(networkError);
        await expect(apiClient.checkNameAvailability('Alice')).rejects.toBe(networkError);
    });
});
