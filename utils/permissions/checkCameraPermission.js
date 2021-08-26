import { Platform } from 'react-native';
import { check, PERMISSIONS } from 'react-native-permissions';

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
