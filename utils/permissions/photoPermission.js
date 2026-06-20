import {Platform} from 'react-native';
import {PERMISSIONS, RESULTS, requestMultiple} from 'react-native-permissions';

const {ANDROID} = PERMISSIONS;

/** Status returned by ensurePhotoPermission. */
export const PHOTO_PERMISSION = {
    GRANTED: 'granted', // media readable AND location-EXIF readable (GPS survives)
    LOCATION_DENIED: 'location-denied', // media readable, but ACCESS_MEDIA_LOCATION denied
    DENIED: 'denied' // can't read media at all
};

const isUsable = status => status === RESULTS.GRANTED || status === RESULTS.LIMITED;

/**
 * Request the Android media permissions needed to import geotagged photos from
 * MediaStore, and report an **AML-aware** status (spec §4c + P1 fix).
 *
 * `ACCESS_MEDIA_LOCATION` (AML) is what un-redacts GPS EXIF under scoped storage
 * (API 29+). Holding the read permission alone is NOT enough: without AML the
 * MediaStore read returns location-stripped bytes, so a genuinely geotagged photo
 * would wrongly look location-less. We therefore request the read + visual-selected
 * + AML permissions together (Android 14 guidance) and surface AML denial as a
 * distinct `location-denied` status so the caller can tell the user to enable photo
 * location instead of showing the misleading "No location found" card.
 *
 * iOS needs nothing — its picker is permission-free.
 *
 * @returns {Promise<'granted'|'location-denied'|'denied'>}
 */
export const ensurePhotoPermission = async () => {
    if (Platform.OS !== 'android') return PHOTO_PERMISSION.GRANTED;

    const api = Platform.Version;

    // Android 9 and below: no scoped-storage redaction, so a storage read already
    // includes GPS — there is no AML to request.
    if (api < 29) {
        const res = await requestMultiple([ANDROID.READ_EXTERNAL_STORAGE]);
        return isUsable(res[ANDROID.READ_EXTERNAL_STORAGE])
            ? PHOTO_PERMISSION.GRANTED
            : PHOTO_PERMISSION.DENIED;
    }

    // API 33+ uses READ_MEDIA_IMAGES (+ the "Select photos" partial-access permission);
    // 29-32 uses READ_EXTERNAL_STORAGE. Both pair with ACCESS_MEDIA_LOCATION, requested
    // together in one operation.
    const perms = api >= 33
        ? [ANDROID.READ_MEDIA_IMAGES, ANDROID.READ_MEDIA_VISUAL_USER_SELECTED, ANDROID.ACCESS_MEDIA_LOCATION]
        : [ANDROID.READ_EXTERNAL_STORAGE, ANDROID.ACCESS_MEDIA_LOCATION];
    const readKeys = api >= 33
        ? [ANDROID.READ_MEDIA_IMAGES, ANDROID.READ_MEDIA_VISUAL_USER_SELECTED]
        : [ANDROID.READ_EXTERNAL_STORAGE];

    const res = await requestMultiple(perms);

    const canRead = readKeys.some(key => isUsable(res[key]));
    if (!canRead) return PHOTO_PERMISSION.DENIED;

    const amlGranted = res[ANDROID.ACCESS_MEDIA_LOCATION] === RESULTS.GRANTED;
    return amlGranted ? PHOTO_PERMISSION.GRANTED : PHOTO_PERMISSION.LOCATION_DENIED;
};
