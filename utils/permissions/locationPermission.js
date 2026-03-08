import {Platform} from 'react-native';
import {check, request, PERMISSIONS} from 'react-native-permissions';

export const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') {
        return await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else if (Platform.OS === 'android') {
        return await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }
};

export const checkLocationPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else if (Platform.OS === 'android') {
        return await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }
};
