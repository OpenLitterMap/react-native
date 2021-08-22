import { Platform, PermissionsAndroid } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';

export const requestCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
    }

    if (Platform.OS === 'android') {
        result = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
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
