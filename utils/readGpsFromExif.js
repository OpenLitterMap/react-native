import {read as readExif} from '@lodev09/react-native-exify';
import * as Sentry from '@sentry/react-native';
import {isValidGpsCoords} from './gps';

const EXIF_TIMEOUT_MS = 5000;

/**
 * Read GPS coordinates directly from a file's EXIF data.
 *
 * Uses @lodev09/react-native-exify which correctly calls
 * MediaStore.setRequireOriginal() on Android 10+ for unredacted EXIF.
 * Times out after 5 seconds to prevent hangs on corrupted images.
 *
 * @param {string} uri - Photo file URI
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
export const readGpsFromExif = async uri => {
    let timeoutId;
    try {
        const tags = await Promise.race([
            readExif(uri),
            new Promise((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(new Error('EXIF read timed out')),
                    EXIF_TIMEOUT_MS
                );
            })
        ]);
        clearTimeout(timeoutId);
        if (tags?.GPSLatitude != null && tags?.GPSLongitude != null) {
            // EXIF stores lat/lon as absolute values with separate Ref fields
            const lat = tags.GPSLatitudeRef === 'S'
                ? -Math.abs(tags.GPSLatitude)
                : Math.abs(tags.GPSLatitude);
            const lon = tags.GPSLongitudeRef === 'W'
                ? -Math.abs(tags.GPSLongitude)
                : Math.abs(tags.GPSLongitude);
            if (isValidGpsCoords(lat, lon)) {
                return {latitude: lat, longitude: lon};
            }
        }
    } catch (e) {
        clearTimeout(timeoutId);
        if (__DEV__) {
            console.warn(`[GPS Debug] EXIF read failed for ${uri}:`, e.message);
        } else if (
            // Expected failures — don't report to Sentry
            !/timed out/i.test(e.message) &&
            !/ACCESS_MEDIA_LOCATION/i.test(e.message)
        ) {
            Sentry.captureException(e, {
                level: 'warning',
                tags: {section: 'exif_read'}
            });
        }
    }
    return null;
};
