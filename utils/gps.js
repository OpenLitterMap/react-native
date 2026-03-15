/**
 * Shared GPS coordinate validation.
 *
 * Returns true if lat/lon are valid numeric coordinates within
 * geographic ranges (lat ∈ [-90, 90], lon ∈ [-180, 180]).
 * Rejects null, undefined, non-numbers, out-of-range, and 0,0 (Null Island).
 */
export const isValidGpsCoords = (lat, lon) => {
    if (typeof lat !== 'number' || typeof lon !== 'number') {
        return false;
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return false;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        return false;
    }
    if (lat === 0 && lon === 0) {
        return false;
    }
    return true;
};
