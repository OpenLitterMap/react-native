/**
 * partitionByGps: splits picked assets into {imported, skipped} by whether they
 * carry valid GPS. Geotagged-only is the queue invariant; non-geotagged picks go
 * to the no-GPS card. Reuses isValidGpsCoords so (0,0)/null/out-of-range are rejected.
 */
import {partitionByGps} from '../../utils/partitionByGps';

const asset = (latitude, longitude, extra = {}) => ({
    uri: 'file://a.jpg',
    fileName: 'a.jpg',
    latitude,
    longitude,
    ...extra
});

describe('partitionByGps', () => {
    it('routes valid-GPS assets to imported and the rest to skipped', () => {
        const good = asset(53.349, -6.26);
        const noGps = asset(null, null);

        const {imported, skipped} = partitionByGps([good, noGps]);

        expect(imported).toEqual([good]);
        expect(skipped).toEqual([noGps]);
    });

    it('skips Null Island (0,0) and out-of-range coordinates', () => {
        const nullIsland = asset(0, 0);
        const outOfRange = asset(91, 200);

        const {imported, skipped} = partitionByGps([nullIsland, outOfRange]);

        expect(imported).toEqual([]);
        expect(skipped).toEqual([nullIsland, outOfRange]);
    });

    it('returns the asset objects untouched (no GPS re-shaping)', () => {
        const good = asset(51.888, -8.485, {takenAt: 1693559013, source: 'mediastore'});

        const {imported} = partitionByGps([good]);

        expect(imported[0]).toBe(good);
    });

    it('handles an empty selection', () => {
        expect(partitionByGps([])).toEqual({imported: [], skipped: []});
    });
});
