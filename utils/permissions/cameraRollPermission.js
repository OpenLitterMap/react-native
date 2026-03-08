import {Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

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

            // READ_MEDIA_IMAGES is granted — now check ACCESS_MEDIA_LOCATION
            const mediaLocation = await check(
                PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
            );

            if (mediaLocation === 'granted') {
                return 'granted';
            }

            // Try requesting ACCESS_MEDIA_LOCATION
            const requestResult = await request(
                PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
            );

            if (requestResult === 'granted') {
                return 'granted';
            }

            // Photos accessible but no GPS — return 'limited'
            return 'limited';
        } else {
            return await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
        }
    }
};
