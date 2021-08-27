import { Platform } from 'react-native';
import { check, request, PERMISSIONS } from 'react-native-permissions';

export const requestCameraPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.CAMERA);
    }

    if (Platform.OS === 'android') {
        result = await request(PERMISSIONS.ANDROID.CAMERA);
    }

    return result;
};

export const checkCameraPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await check(PERMISSIONS.IOS.CAMERA);
    }
    if (Platform.OS === 'android') {
        result = await check(PERMISSIONS.ANDROID.CAMERA);
    }

    return result;
};
