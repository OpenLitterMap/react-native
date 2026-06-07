/**
 * normalizeLevels must read the backend's real shape — an object keyed by XP
 * threshold whose VALUE is the title string ({ "0": "Noob", "100": "Litter
 * Picker", ... }). An earlier parser only handled arrays (fell back to the
 * hardcoded list); the next expected object VALUES and produced "Unknown".
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(), setItem: jest.fn(), multiRemove: jest.fn()
}));
jest.mock('../../utils/apiClient', () => ({__esModule: true, default: {get: jest.fn()}}));

import FALLBACK_LEVELS, {normalizeLevels} from '../../screens/profile/helpers/xpLevels';

describe('normalizeLevels', () => {
    it('parses the backend XP-keyed string-value shape', () => {
        const r = normalizeLevels({
            '100': 'Litter Picker',
            '0': 'Noob',
            '1000': 'Litter Wizard'
        });
        expect(r).toEqual([
            {xp: 0, name: 'Noob'},
            {xp: 100, name: 'Litter Picker'},
            {xp: 1000, name: 'Litter Wizard'}
        ]);
    });

    it('also tolerates object values ({ title }/{ name })', () => {
        const r = normalizeLevels({
            '0': {title: 'Noob'},
            '100': {name: 'Litter Picker'}
        });
        expect(r).toEqual([
            {xp: 0, name: 'Noob'},
            {xp: 100, name: 'Litter Picker'}
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
