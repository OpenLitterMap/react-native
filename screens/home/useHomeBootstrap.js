import {useEffect, useRef, useState, useCallback} from 'react';
import {AppState, Platform} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {setDeviceModel} from '../../reducers/settings_reducer';
import {checkAppVersion} from '../../reducers/shared_reducer';
import {fetchUntaggedCount} from '../../reducers/server_photos_reducer';
import {getPhotosFromCameraroll, resetGallery} from '../../reducers/gallery_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {getStats} from '../../reducers/stats_reducer';
import {checkCameraRollPermission, requestCameraRollPermission} from '../../utils/permissions/cameraRollPermission';

/**
 * Boot logic for HomeScreen — device model, data fetching, camera roll, version check.
 * Returns permission status for the dashboard to render appropriate UI.
 */
export default function useHomeBootstrap(navigation) {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const appVersion = useSelector(state => state.shared?.appVersion);
    const [permissionStatus, setPermissionStatus] = useState(null);

    const lastPermission = useRef(null);

    const loadCameraRoll = useCallback(async () => {
        const status = await checkCameraRollPermission();
        lastPermission.current = status;
        setPermissionStatus(status);
        if (status === 'granted' || status === 'limited') {
            return dispatch(getPhotosFromCameraroll('INITIAL'));
        }
        if (status === 'denied' || status === 'blocked') {
            navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION',
                params: {blocked: status === 'blocked'}
            });
        }
    }, [dispatch, navigation]);

    const refreshCameraRoll = useCallback(async () => {
        const status = await checkCameraRollPermission();
        lastPermission.current = status;
        setPermissionStatus(status);
        if (status === 'granted' || status === 'limited') {
            return dispatch(getPhotosFromCameraroll('REFRESH'));
        }
    }, [dispatch]);

    const requestPermission = useCallback(async () => {
        const status = await requestCameraRollPermission();
        lastPermission.current = status;
        setPermissionStatus(status);
        if (status === 'granted' || status === 'limited') {
            dispatch(getPhotosFromCameraroll('INITIAL'));
        }
    }, [dispatch]);

    const recheckPermission = useCallback(async () => {
        const status = await checkCameraRollPermission();
        const changed = status !== lastPermission.current;
        lastPermission.current = status;
        if (changed) {
            setPermissionStatus(status);
        }

        if (status === 'denied' || status === 'blocked') {
            // Permission revoked — clear stale gallery data
            dispatch(resetGallery());
        } else if (status === 'limited') {
            // Always refresh — user may have changed which photos are shared
            dispatch(getPhotosFromCameraroll('REFRESH'));
        } else if (status === 'granted') {
            // Refresh to pick up newly taken photos
            dispatch(getPhotosFromCameraroll('REFRESH'));
        }
    }, [dispatch]);

    // On mount + auth change: fetch data, check version
    useEffect(() => {
        dispatch(setDeviceModel(DeviceInfo.getModel()));

        if (token) {
            dispatch(getStats());

            if (!user?.enable_admin_tagging) {
                dispatch(fetchUntaggedCount());
            }
        }

        dispatch(fetchAllTags());

        // Load camera roll photos for the inbox section
        loadCameraRoll();

        if (!__DEV__) {
            if (appVersion === null) {
                dispatch(checkAppVersion());
            }
        }
        // Mount + auth-change only
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Navigate to update screen if new version available
    useEffect(() => {
        if (!appVersion) return;
        const platform = Platform.OS;
        const currentVersion = DeviceInfo.getVersion();
        const latestVersion = appVersion[platform]?.version;

        if (latestVersion) {
            const latest = latestVersion.split('.');
            const current = currentVersion.split('.');
            const max = Math.max(latest.length, current.length);
            for (let i = 0; i < max; i++) {
                const l = parseInt(latest[i], 10) || 0;
                const c = parseInt(current[i], 10) || 0;
                if (l > c) {
                    navigation.navigate('UPDATE');
                    return;
                } else if (l < c) {
                    return;
                }
            }
        }
    }, [appVersion, navigation]);

    // Re-check permission when app returns from background (user may have changed in Settings)
    useEffect(() => {
        const handleAppState = (nextState) => {
            if (nextState === 'active') {
                recheckPermission();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppState);
        return () => subscription.remove();
    }, [recheckPermission]);

    // Re-check permission on screen focus (e.g. returning from Settings or permission modal)
    useFocusEffect(
        useCallback(() => {
            recheckPermission();
        }, [recheckPermission])
    );

    return {permissionStatus, refreshCameraRoll, requestPermission};
}
