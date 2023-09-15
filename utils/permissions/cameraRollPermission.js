import {Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    console.log('requestCameraRollPermission');
    try {
        if (Platform.OS === 'ios') {
            result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        } else if (Platform.OS === 'android') {
            console.log('android found version: ' + Platform.Version);
            // Android 13 and above
            // needs to request READ_MEDIA_IMAGES and ACCESS_MEDIA_LOCATION
            if (Platform.Version >= 33) {
                result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
                console.log('READ_MEDIA_IMAGES: ' + result);

                const mediaLocation = await request(
                    PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
                );

                console.log('ACCESS_MEDIA_LOCATION: ' + mediaLocation);

                if (result !== 'granted' || mediaLocation !== 'granted') {
                    return 'denied';
                }
            } else {
                // Android 12 and below needs to request READ_EXTERNAL_STORAGE
                result = await request(
                    PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
                );

                console.log('READ_EXTERNAL_STORAGE: ' + result);
            }
        }
    } catch (error) {
        console.error('Error requesting camera roll permission:', error);
        result = 'denied';
    }

    return result;
};

export const checkCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await check('ios.permission.PHOTO_LIBRARY');
    }
    if (Platform.OS === 'android') {
        result =
            Platform.Version >= 33
                ? (await check('android.permission.READ_MEDIA_IMAGES')) &&
                  (await check('ACCESS_MEDIA_LOCATION'))
                : await check('android.permission.READ_EXTERNAL_STORAGE');
    }

    return result;
};

/**
 * Android 13+ only
 */
export const checkAccessMediaLocation = async () => {
    return await check('android.permission.ACCESS_MEDIA_LOCATION');
};
