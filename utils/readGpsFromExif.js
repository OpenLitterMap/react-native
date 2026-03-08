import {read as readExif} from '@lodev09/react-native-exify';
import {isValidGpsCoords} from './gps';

/**
 * Read GPS coordinates directly from a file's EXIF data.
 *
 * Uses @lodev09/react-native-exify which correctly calls
 * MediaStore.setRequireOriginal() on Android 10+ for unredacted EXIF.
 *
 * @param {string} uri - Photo file URI
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const readGpsFromExif = async uri => {
    try {
        const tags = await readExif(uri);
        if (
            tags?.GPSLatitude != null &&
            tags?.GPSLongitude != null &&
            isValidGpsCoords(tags.GPSLatitude, tags.GPSLongitude)
        ) {
            return {latitude: tags.GPSLatitude, longitude: tags.GPSLongitude};
        }
    } catch (e) {
        if (__DEV__) {
            console.warn(`[GPS Debug] EXIF read failed for ${uri}:`, e.message);
        }
    }
    return null;
};
