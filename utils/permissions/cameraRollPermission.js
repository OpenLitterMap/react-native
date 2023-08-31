import {PermissionsAndroid, Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }

    if (Platform.OS === 'android') {
        result = await request(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);

        console.log('checkCameraRollPermission', result);

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
    }

    return result;
};

export const checkCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await check('ios.permission.PHOTO_LIBRARY');
    }
    if (Platform.OS === 'android') {
        result = await check('android.permission.READ_MEDIA_IMAGES');
    }

    return result;
};
