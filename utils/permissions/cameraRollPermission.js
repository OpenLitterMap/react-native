import {Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    try {
        if (Platform.OS === 'ios') {
            result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        } else if (Platform.OS === 'android') {
            // Android 13 and above
            // needs to request READ_MEDIA_IMAGES and ACCESS_MEDIA_LOCATION
            if (Platform.Version >= 33) {
                result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
                console.log('READ_MEDIA_IMAGES: ' + result);

                const mediaLocation = await request(PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION);

                console.log('ACCESS_MEDIA_LOCATION: ' + mediaLocation);

                if (result === 'granted' && mediaLocation === 'granted') {
                    return 'granted';
                } else {
                    return 'denied';
                }
            } else {
                // Android 12 and below needs to request READ_EXTERNAL_STORAGE
                result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

                console.log('READ_EXTERNAL_STORAGE: ' + result);
            }
        }
    } catch (error) {
        console.error('Error requesting camera roll permission:', error);
        result = 'denied';
    }

    return result;
};

/**
 *
 * @returns {Promise<"limited"|"denied"|"blocked"|"unavailable"|"granted">}
 */
export const checkCameraRollPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check('ios.permission.PHOTO_LIBRARY');
    }
    if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
            const readMediaImages = await check('android.permission.READ_MEDIA_IMAGES');

            console.log('checkCameraRollPermissions.readMediaImages');

            if (readMediaImages === 'granted') {
                return 'granted';
            } else {
                return 'denied';
            }
        } else {
            return await check('android.permission.READ_EXTERNAL_STORAGE');
        }
    }
};

/**
 * Android 13+ only
 */
export const checkAccessMediaLocation = async () => {
    return await check('android.permission.ACCESS_MEDIA_LOCATION');
};
