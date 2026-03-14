import {Platform} from 'react-native';
import {check, openPhotoPicker, PERMISSIONS, request} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    try {
        if (Platform.OS === 'ios') {
            result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        } else if (Platform.OS === 'android') {
            if (Platform.Version >= 33) {
                result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);

                if (result !== 'granted') {
                    return 'denied';
                }

                const mediaLocation = await request(
                    PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
                );

                // Photos accessible; GPS may or may not be available
                return mediaLocation === 'granted' ? 'granted' : 'limited';
            } else {
                result = await request(
                    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
                );
            }
        }
    } catch (error) {
        if (__DEV__)
            console.error('Error requesting camera roll permission:', error);
        result = 'denied';
    }

    return result;
};

/**
 * Opens the iOS limited photo picker so the user can add/remove photos.
 * No-op on Android or if full access is already granted.
 */
export const openLimitedPhotoPicker = async () => {
    if (Platform.OS === 'ios') {
        const status = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
        if (status === 'limited') {
            await openPhotoPicker();
        }
    }
};

/**
 * @returns {Promise<"limited"|"denied"|"blocked"|"unavailable"|"granted">}
 */
export const checkCameraRollPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }
    if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
            const readMediaImages = await check(
                PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            );

            if (readMediaImages !== 'granted') {
                return 'denied';
            }

            // READ_MEDIA_IMAGES is granted — check ACCESS_MEDIA_LOCATION.
            // Only check here, never re-request. The initial request happens
            // in requestCameraRollPermission(). Re-requesting on every check
            // is poor UX and fires on every HomeScreen mount.
            const mediaLocation = await check(
                PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
            );

            // Photos accessible; GPS depends on media location permission
            return mediaLocation === 'granted' ? 'granted' : 'limited';
        } else {
            return await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        }
    }
};
