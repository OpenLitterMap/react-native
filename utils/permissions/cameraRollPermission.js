import {PermissionsAndroid, Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }

    // Check android version
    if (Platform.OS === 'android') {
        // Android 13 and above
        // needs to request READ_MEDIA_IMAGES and ACCESS_MEDIA_LOCAITON
        if (Platform.Version >= 33) {
            result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);

            const mediaLocation = await PermissionsAndroid.request(
                'android.permission.ACCESS_MEDIA_LOCATION'
            );
            if (
                result === 'granted' &&
                mediaLocation !== PermissionsAndroid.RESULTS.DENIED
            ) {
                result = 'granted';
            } else {
                result = 'denied';
            }
        } else {
            // Android 12 and below needs to request READ_EXTERNAL_STORAGE
            result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);

            if (result === 'granted') {
                result = 'granted';
            } else {
                result = 'denied';
            }
        }
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
                ? await check('android.permission.READ_MEDIA_IMAGES')
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
