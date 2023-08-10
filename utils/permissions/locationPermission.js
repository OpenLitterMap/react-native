import { Platform } from 'react-native';
import { check, request, PERMISSIONS } from 'react-native-permissions';

export const requestLocationPermission = async () => {
    let result;
    if (Platform.OS === 'ios') {
        result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    }

    if (Platform.OS === 'android') {
        result = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }

    return result;
};

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
