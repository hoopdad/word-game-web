import { describe, expect, it } from 'vitest';
import { isDisplayNameValid } from '@/utils/validation';
describe('display name validation', () => {
    it('accepts 2-20 letters, numbers, and spaces', () => {
        expect(isDisplayNameValid('AB')).toBe(true);
        expect(isDisplayNameValid('Player 123')).toBe(true);
        expect(isDisplayNameValid('A'.repeat(20))).toBe(true);
    });
    it('rejects disallowed characters and invalid lengths', () => {
        expect(isDisplayNameValid('A')).toBe(false);
        expect(isDisplayNameValid('A'.repeat(21))).toBe(false);
        expect(isDisplayNameValid('Player_123')).toBe(false);
        expect(isDisplayNameValid('Player-123')).toBe(false);
        expect(isDisplayNameValid('Player@123')).toBe(false);
    });
});
