import {read as readExif} from '@lodev09/react-native-exify';
import * as Sentry from '@sentry/react-native';
import {isValidGpsCoords} from './gps';

const EXIF_TIMEOUT_MS = 5000;

/**
 * Parse an EXIF capture timestamp to epoch SECONDS. EXIF carries no timezone, so
 * the value is interpreted as local time. Prefers DateTimeOriginal (capture), then
 * DateTimeDigitized, then DateTime. Returns null if absent/unparseable so callers
 * fall back to import time.
 *
 * @param {object} tags
 * @returns {number | null}
 */
const parseExifCaptureTime = tags => {
    const raw = tags?.DateTimeOriginal || tags?.DateTimeDigitized || tags?.DateTime;
    if (typeof raw !== 'string') return null;
    // EXIF datetime format: "YYYY:MM:DD HH:MM:SS"
    const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
    if (!m) return null;
    // No timezone in EXIF → interpreted as DEVICE-LOCAL time
    const ms = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime();
    return Number.isNaN(ms) ? null : Math.floor(ms / 1000);
};

/**
 * Read GPS coordinates + capture time directly from a file's EXIF data.
 *
 * Uses @lodev09/react-native-exify which correctly calls
 * MediaStore.setRequireOriginal() on Android 10+ for unredacted EXIF.
 * Times out after 5 seconds to prevent hangs on corrupted images.
 *
 * @param {string} uri - Photo file URI
 * @returns {Promise<{latitude: number, longitude: number, takenAt: number | null} | null>}
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
                return {latitude: lat, longitude: lon, takenAt: parseExifCaptureTime(tags)};
            }
        }
    } catch (e) {
        clearTimeout(timeoutId);
        // Expected failures (timeout, media-location redaction) aren't reported.
        // Sentry runs in production only.
        if (
            !__DEV__ &&
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
