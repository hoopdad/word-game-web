import { describe, it, expect } from 'vitest';
describe('Name Validation', () => {
    const validateDisplayName = (name) => {
        return name.length >= 2 && name.length <= 20 && /^[a-zA-Z0-9_-]+$/.test(name);
    };
    it('should accept valid names', () => {
        expect(validateDisplayName('Player1')).toBe(true);
        expect(validateDisplayName('John-Doe')).toBe(true);
        expect(validateDisplayName('user_123')).toBe(true);
    });
    it('should reject names too short', () => {
        expect(validateDisplayName('A')).toBe(false);
    });
    it('should reject names too long', () => {
        expect(validateDisplayName('ThisNameIsWayTooLongForTheGame')).toBe(false);
    });
    it('should reject names with invalid characters', () => {
        expect(validateDisplayName('Player@123')).toBe(false);
        expect(validateDisplayName('Player 123')).toBe(false);
    });
});
describe('Score Calculation', () => {
    const calculateScore = (correct, time) => {
        if (!correct)
            return 0;
        // More points for faster guesses
        return Math.max(100 - Math.floor(time / 10), 10);
    };
    it('should award points for correct guesses', () => {
        expect(calculateScore(true, 30)).toBeGreaterThan(0);
        expect(calculateScore(true, 0)).toBeGreaterThan(50);
    });
    it('should award more points for faster guesses', () => {
        expect(calculateScore(true, 10)).toBeGreaterThan(calculateScore(true, 100));
    });
    it('should award zero points for incorrect guesses', () => {
        expect(calculateScore(false, 0)).toBe(0);
    });
    it('should have minimum score', () => {
        const score = calculateScore(true, 10000);
        expect(score).toBeGreaterThanOrEqual(10);
    });
});
describe('URL Validation', () => {
    const validateUrl = (url) => {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    };
    it('should accept valid URLs', () => {
        expect(validateUrl('https://example.com')).toBe(true);
        expect(validateUrl('http://example.com/category')).toBe(true);
    });
    it('should reject invalid URLs', () => {
        expect(validateUrl('not a url')).toBe(false);
        expect(validateUrl('example.com')).toBe(false);
    });
});
