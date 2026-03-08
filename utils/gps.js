/**
 * Shared GPS coordinate validation.
 *
 * Returns true if lat/lon are valid numeric coordinates.
 * Rejects null, undefined, non-numbers, and 0,0 (Null Island).
 */
export const isValidGpsCoords = (lat, lon) => {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return false;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return false;
    }
    if (lat === 0 && lon === 0) {
        return false;
    }
    return true;
};
