import { Platform } from 'react-native';
import { check, PERMISSIONS } from 'react-native-permissions';

export const checkLocationPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    }
    if (Platform.OS === 'android') {
        result = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }

    return result;
};
