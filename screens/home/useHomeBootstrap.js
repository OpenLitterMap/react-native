import {useEffect, useCallback} from 'react';
import {Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {setDeviceModel} from '../../reducers/settings_reducer';
import {checkAppVersion} from '../../reducers/shared_reducer';
import {fetchUntaggedCount} from '../../reducers/server_photos_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {getStats} from '../../reducers/stats_reducer';

/**
 * Boot logic for HomeScreen — device model, data fetching, version check.
 * (Photos enter via the system picker, so there is no camera-roll permission
 * or scan to manage here.)
 */
export default function useHomeBootstrap(navigation) {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const appVersion = useSelector(state => state.shared?.appVersion);

    const refreshAll = useCallback(async () => {
        const fetches = [dispatch(getStats())];
        if (!user?.enable_admin_tagging) {
            fetches.push(dispatch(fetchUntaggedCount()));
        }
        await Promise.allSettled(fetches);
    }, [dispatch, user?.enable_admin_tagging]);

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
        if (!__DEV__ && appVersion === null) {
            dispatch(checkAppVersion());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Navigate to update screen if a newer version is available
    useEffect(() => {
        if (!appVersion) return;
        const currentVersion = DeviceInfo.getVersion();
        const latestVersion = appVersion[Platform.OS]?.version;
        if (latestVersion) {
            const latest = latestVersion.split('.');
            const current = currentVersion.split('.');
            const max = Math.max(latest.length, current.length);
            for (let i = 0; i < max; i++) {
                const l = parseInt(latest[i], 10) || 0;
                const c = parseInt(current[i], 10) || 0;
                if (l > c) { navigation.navigate('UPDATE'); return; }
                if (l < c) return;
            }
        }
    }, [appVersion, navigation]);

    return {refreshAll};
}
