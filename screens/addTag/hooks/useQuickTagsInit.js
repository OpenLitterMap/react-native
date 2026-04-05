import {useEffect} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {setPresets} from '../../../reducers/quick_tags_reducer';
import {resolveDefaultQuickTags} from '../../../utils/defaultQuickTags';

/**
 * One-time initialization of quick tag presets with defaults.
 *
 * Waits for BOTH:
 *   1. Tag catalog fetch to succeed (so we can resolve keys → cloIds)
 *   2. Backend quick tags fetch to complete (succeeded or failed)
 *
 * Only seeds defaults if both are done and presets are still empty.
 * This prevents the race condition where defaults are seeded before
 * the backend response arrives with the user's actual presets.
 */
export default function useQuickTagsInit() {
    const dispatch = useDispatch();
    const catalogFetchStatus = useSelector(state => state.tags.fetchStatus);
    const objectEntries = useSelector(state => state.tags.objectEntries);
    const brandsById = useSelector(state => state.tags.brandsById);
    const presetsCount = useSelector(state => state.quickTags.presets.length);
    const quickTagsFetchStatus = useSelector(state => state.quickTags.fetchStatus);

    useEffect(() => {
        // Wait for catalog to load
        if (catalogFetchStatus !== 'succeeded' || objectEntries.length === 0) return;

        // Wait for backend fetch to complete (succeeded or failed)
        // 'idle' means fetch hasn't started yet — wait for it to start and finish
        // 'loading' means fetch is in progress — wait
        if (quickTagsFetchStatus === 'idle' || quickTagsFetchStatus === 'loading') return;

        // Only seed defaults if presets are empty after both fetches
        if (presetsCount === 0) {
            const defaults = resolveDefaultQuickTags(objectEntries, brandsById);
            if (defaults.length > 0) {
                if (__DEV__) console.log('[QuickTags] seeding defaults:', defaults.length);
                dispatch(setPresets(defaults));
            }
        }
    }, [catalogFetchStatus, quickTagsFetchStatus, presetsCount, objectEntries, brandsById, dispatch]);
}
