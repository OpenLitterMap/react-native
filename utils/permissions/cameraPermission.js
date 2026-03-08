import {Platform} from 'react-native';
import {check, request, PERMISSIONS} from 'react-native-permissions';

export const requestCameraPermission = async () => {
    if (Platform.OS === 'ios') {
        return await request(PERMISSIONS.IOS.CAMERA);
    } else if (Platform.OS === 'android') {
        return await request(PERMISSIONS.ANDROID.CAMERA);
    }
};

export const checkCameraPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check(PERMISSIONS.IOS.CAMERA);
    } else if (Platform.OS === 'android') {
        return await check(PERMISSIONS.ANDROID.CAMERA);
    }
};
