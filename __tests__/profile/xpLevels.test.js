/**
 * normalizeLevels must read the backend's shape — an object keyed by XP threshold
 * ({ "0": { title }, "100": { title }, ... }) — not just arrays. The old parser
 * only handled arrays, so it silently fell back to the hardcoded list and ignored
 * backend changes.
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(), setItem: jest.fn(), multiRemove: jest.fn()
}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {get: jest.fn()}}));

import FALLBACK_LEVELS, {normalizeLevels} from '../../screens/profile/helpers/xpLevels';

describe('normalizeLevels', () => {
    it('parses the backend XP-keyed object shape', () => {
        const r = normalizeLevels({
            '100': {title: 'Litter Picker'},
            '0': {title: 'Noob'},
            '1000': {title: 'Litter Wizard'}
        });
        expect(r).toEqual([
            {xp: 0, name: 'Noob'},
            {xp: 100, name: 'Litter Picker'},
            {xp: 1000, name: 'Litter Wizard'}
        ]);
    });

    it('still parses an array shape (and { data: [...] })', () => {
        const arr = [{xp: 0, name: 'A'}, {xp: 50, name: 'B'}];
        expect(normalizeLevels(arr)).toEqual(arr);
        expect(normalizeLevels({data: arr})).toEqual(arr);
    });

    it('falls back when the payload is empty or unusable', () => {
        expect(normalizeLevels({})).toEqual(FALLBACK_LEVELS);
        expect(normalizeLevels(null)).toEqual(FALLBACK_LEVELS);
    });
});
