import { Platform } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';

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
