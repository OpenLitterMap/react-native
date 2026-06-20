import {isValidGpsCoords} from './gps';

/**
 * Split picked assets into geotagged (imported) and non-geotagged (skipped).
 *
 * The "Your Photos" queue is geotagged-only; non-geotagged picks surface in the
 * dismissible no-GPS card instead. Validation is delegated to isValidGpsCoords so
 * null/NaN/out-of-range and the (0,0) Null Island pair are rejected consistently.
 *
 * @param {Array<{latitude: number|null, longitude: number|null}>} assets
 * @returns {{imported: Array, skipped: Array}}
 */
export const partitionByGps = assets => {
    const imported = [];
    const skipped = [];
    for (const a of assets) {
        if (a && isValidGpsCoords(a.latitude, a.longitude)) {
            imported.push(a);
        } else {
            skipped.push(a);
        }
    }
    return {imported, skipped};
};
