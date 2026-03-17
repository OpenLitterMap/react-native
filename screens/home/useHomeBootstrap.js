import {useEffect} from 'react';
import {Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {setDeviceModel} from '../../reducers/settings_reducer';
import {checkAppVersion} from '../../reducers/shared_reducer';
import {fetchUntaggedCount} from '../../reducers/server_photos_reducer';
import {getPhotosFromCameraroll} from '../../reducers/gallery_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {checkCameraRollPermission} from '../../utils/permissions';

/**
 * Boot logic for HomeScreen — device model, permissions, data fetching, version check.
 * Extracted to keep HomeScreen focused on UI orchestration.
 */
export default function useHomeBootstrap(navigation) {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const appVersion = useSelector(state => state.shared?.appVersion);

    // On mount + auth change: fetch data, check permissions, check version
    useEffect(() => {
        dispatch(setDeviceModel(DeviceInfo.getModel()));

        if (!user?.enable_admin_tagging && token) {
            dispatch(fetchUntaggedCount());
        }

        dispatch(fetchAllTags());

        if (!__DEV__) {
            if (appVersion === null) {
                dispatch(checkAppVersion());
            }
        }

        (async () => {
            const result = await checkCameraRollPermission();
            if (result === 'granted' || result === 'limited') {
                const fetchType = result === 'limited' ? 'REFRESH' : undefined;
                await dispatch(getPhotosFromCameraroll(fetchType));
            } else {
                navigation.navigate('PERMISSION', {screen: 'GALLERY_PERMISSION'});
            }
        })();
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
}
