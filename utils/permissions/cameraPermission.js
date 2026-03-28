import {Platform} from 'react-native';
import {check, PERMISSIONS, request} from 'react-native-permissions';

/**
 * Request location permission (needed before camera for GPS-tagged photos).
 * @returns {Promise<"granted"|"denied"|"blocked"|"unavailable"|"limited">}
 */
export const requestLocationPermission = async () => {
    try {
        if (Platform.OS === 'ios') {
            return await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        }
        if (Platform.OS === 'android') {
            return await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        }
    } catch (error) {
        if (__DEV__) console.error('Error requesting location permission:', error);
        return 'denied';
    }
};

/**
 * Check location permission status without prompting.
 * @returns {Promise<"granted"|"denied"|"blocked"|"unavailable"|"limited">}
 */
export const checkLocationPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    }
    if (Platform.OS === 'android') {
        return await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }
};

/**
 * Request camera permission.
 * @returns {Promise<"granted"|"denied"|"blocked"|"unavailable"|"limited">}
 */
export const requestCameraPermission = async () => {
    try {
        if (Platform.OS === 'ios') {
            return await request(PERMISSIONS.IOS.CAMERA);
        }
        if (Platform.OS === 'android') {
            return await request(PERMISSIONS.ANDROID.CAMERA);
        }
    } catch (error) {
        if (__DEV__) console.error('Error requesting camera permission:', error);
        return 'denied';
    }
};

/**
 * Check camera permission status without prompting.
 * @returns {Promise<"granted"|"denied"|"blocked"|"unavailable"|"limited">}
 */
export const checkCameraPermission = async () => {
    if (Platform.OS === 'ios') {
        return await check(PERMISSIONS.IOS.CAMERA);
    }
    if (Platform.OS === 'android') {
        return await check(PERMISSIONS.ANDROID.CAMERA);
    }
};

/**
 * Request both location and camera permissions in sequence.
 * Location is requested first — without it, camera photos have no GPS.
 *
 * @returns {Promise<{location: string, camera: string}>}
 *   Each value is "granted"|"denied"|"blocked"|"unavailable"|"limited"
 */
export const requestCameraWithLocation = async () => {
    const location = await requestLocationPermission();
    if (location !== 'granted') {
        return {location, camera: 'denied'};
    }
    const camera = await requestCameraPermission();
    return {location, camera};
};

/**
 * Check both location and camera permission status.
 * @returns {Promise<{location: string, camera: string}>}
 */
export const checkCameraWithLocation = async () => {
    const location = await checkLocationPermission();
    const camera = await checkCameraPermission();
    return {location, camera};
};
