import {Platform} from 'react-native';
import {PERMISSIONS, RESULTS, request} from 'react-native-permissions';

const {ANDROID} = PERMISSIONS;

/**
 * Request the Android media permissions needed to import geotagged photos from
 * MediaStore, scaled to the device API level (spec §4c):
 *
 *   33+   READ_MEDIA_IMAGES + ACCESS_MEDIA_LOCATION
 *   29-32 READ_EXTERNAL_STORAGE + ACCESS_MEDIA_LOCATION
 *   <=28  READ_EXTERNAL_STORAGE
 *
 * Holding the read permission is what lets the app read unredacted GPS EXIF from a
 * picked MediaStore URI (ACCESS_MEDIA_LOCATION is the belt-and-suspenders companion).
 * iOS needs nothing — its picker is permission-free.
 *
 * @returns {Promise<boolean>} true when photos are readable (granted, or — Android 14
 *   "Select photos" partial access — limited).
 */
export const ensurePhotoPermission = async () => {
    if (Platform.OS !== 'android') return true;

    const api = Platform.Version;
    let readResult;

    if (api >= 33) {
        readResult = await request(ANDROID.READ_MEDIA_IMAGES);
        await request(ANDROID.ACCESS_MEDIA_LOCATION);
    } else if (api >= 29) {
        readResult = await request(ANDROID.READ_EXTERNAL_STORAGE);
        await request(ANDROID.ACCESS_MEDIA_LOCATION);
    } else {
        readResult = await request(ANDROID.READ_EXTERNAL_STORAGE);
    }

    return readResult === RESULTS.GRANTED || readResult === RESULTS.LIMITED;
};
