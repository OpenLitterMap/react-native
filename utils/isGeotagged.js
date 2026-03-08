import {isValidGpsCoords} from './gps';

/**
 * Check if image is geotagged.
 *
 * Uploaded images are always geotagged (server rejects non-geotagged uploads).
 * Local images must have valid numeric lat/lon that isn't 0,0 (Null Island).
 */
export const isGeotagged = img => {
    if (img.uploaded) return true;
    return isValidGpsCoords(img.lat, img.lon);
};
