import {isGeotagged} from '../../utils/isGeotagged';

describe('isGeotagged', () => {
    it('returns true for uploaded images regardless of coordinates', () => {
        expect(isGeotagged({uploaded: true, lat: null, lon: null})).toBe(true);
        expect(isGeotagged({uploaded: true})).toBe(true);
    });

    it('returns true for valid GPS coordinates', () => {
        expect(isGeotagged({lat: 51.5, lon: -0.1})).toBe(true);
        expect(isGeotagged({lat: -33.8, lon: 151.2})).toBe(true);
    });

    it('returns false for null/undefined coordinates', () => {
        expect(isGeotagged({lat: null, lon: null})).toBe(false);
        expect(isGeotagged({lat: undefined, lon: undefined})).toBe(false);
        expect(isGeotagged({})).toBe(false);
    });

    it('returns false for 0,0 (Null Island)', () => {
        expect(isGeotagged({lat: 0, lon: 0})).toBe(false);
    });

    it('returns false for out-of-range coordinates', () => {
        expect(isGeotagged({lat: 91, lon: 0})).toBe(false);
        expect(isGeotagged({lat: 0, lon: 181})).toBe(false);
    });
});
