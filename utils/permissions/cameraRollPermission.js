import { Platform, PermissionsAndroid } from 'react-native';
import {
    check,
    checkMultiple,
    request,
    requestMultiple,
    PERMISSIONS
} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }

    if (Platform.OS === 'android') {
        result = await requestMultiple([
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE
        ]);
        const mediaLocation = await PermissionsAndroid.request(
            'android.permission.ACCESS_MEDIA_LOCATION'
        );
        if (
            result['android.permission.READ_EXTERNAL_STORAGE'] === 'granted' &&
            result['android.permission.WRITE_EXTERNAL_STORAGE'] === 'granted' &&
            mediaLocation !== PermissionsAndroid.RESULTS.DENIED
        ) {
            result = 'granted';
        } else {
            result = 'denied';
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
        result = await checkMultiple([
            PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
            PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
        ]);
    }

    return result;
};
