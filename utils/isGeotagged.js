/**
 * Check if image is geotagged
 *
 * WEB images dont have lat/long properties but they are geotagged because
 * web app only accepts geotagged images.
 *
 * @param img
 * @returns boolean
 */
export const isGeotagged = img => {
    if (img.type?.toLowerCase() === 'web') return true;

    const hasLat = img.lat !== undefined && img.lat !== null && typeof img.lat === 'number';
    const hasLon = img.lon !== undefined && img.lon !== null && typeof img.lon === 'number';

    if (!hasLat || !hasLon) return false;

    // Reject 0,0 (Null Island) — no real litter is there
    if (img.lat === 0 && img.lon === 0) return false;

    return true;
};
