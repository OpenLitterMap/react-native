import {useEffect, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {syncQuickTags} from '../../../reducers/quick_tags_reducer';

const SYNC_DEBOUNCE_MS = 3000;

/**
 * Debounced sync of quick tags to backend.
 * Watches presets for changes and pushes to server after 3s of inactivity.
 * Only syncs when authenticated and after initial fetch has completed.
 */
export default function useQuickTagsSync() {
    const dispatch = useDispatch();
    const presets = useSelector(state => state.quickTags.presets);
    const fetchStatus = useSelector(state => state.quickTags.fetchStatus);
    const token = useSelector(state => state.auth.token);
    const timerRef = useRef(null);
    const initialRef = useRef(true);

    useEffect(() => {
        // Skip the initial render (redux-persist rehydration)
        if (initialRef.current) {
            initialRef.current = false;
            return;
        }

        // Only sync after initial fetch has completed and user is authenticated
        if (!token || fetchStatus !== 'succeeded') return;

        // Clear any pending sync
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        // Debounce: wait 3s after last change before syncing
        timerRef.current = setTimeout(() => {
            if (__DEV__) console.log('[QuickTags] syncing to backend, presets:', presets.length);
            dispatch(syncQuickTags());
        }, SYNC_DEBOUNCE_MS);

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [presets, token, fetchStatus, dispatch]);
}
