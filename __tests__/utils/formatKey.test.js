import {formatKey} from '../../utils/formatKey';

describe('formatKey', () => {
    it('converts snake_case to Title Case', () => {
        expect(formatKey('broken_glass')).toBe('Broken Glass');
        expect(formatKey('coffee_pod')).toBe('Coffee Pod');
    });

    it('capitalizes single word', () => {
        expect(formatKey('butts')).toBe('Butts');
    });

    it('returns empty string for null/undefined', () => {
        expect(formatKey(null)).toBe('');
        expect(formatKey(undefined)).toBe('');
        expect(formatKey('')).toBe('');
    });

    it('handles Unicode characters', () => {
        expect(formatKey('café')).toBe('Café');
    });
});
