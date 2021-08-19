import { Platform } from 'react-native';
import { check } from 'react-native-permissions';

export const checkCameraRollPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await check('ios.permission.PHOTO_LIBRARY');
    }
    if (Platform.OS === 'android') {
        result = await check('android.permission.READ_EXTERNAL_STORAGE');
    }

    return result;
};
