import {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {resetOnboarding} from '../reducers/auth_reducer';
import {clearOnboardingState} from '../utils/onboarding';

/**
 * Returns a callback that restarts the onboarding tutorial from the beginning.
 *
 * Flips the Redux gate (`onboardingComplete = false`) so `MainRoutes` swaps the
 * app stack for the OnboardingStack (mounts at `ONBOARDING_WELCOME`), and clears
 * the per-user AsyncStorage completion flag. Normal completion or "Skip"
 * re-marks onboarding complete and returns the user to the app.
 */
export const useRepeatTutorial = () => {
    const dispatch = useDispatch();
    const userId = useSelector(state => state.auth.user?.id);

    return useCallback(() => {
        if (__DEV__ && typeof resetOnboarding !== 'function') {
            // If this fires, the running JS bundle predates this action —
            // do a full Metro restart (kill Metro + --reset-cache), not just a reload.
            console.error(
                '[useRepeatTutorial] resetOnboarding is',
                typeof resetOnboarding,
                '— stale bundle; restart Metro with --reset-cache'
            );
            return;
        }

        // Flip the gate first so the UI swaps to the OnboardingStack immediately.
        dispatch(resetOnboarding());

        // Clearing the persisted flag is best-effort and non-blocking — a failure
        // here only affects next-launch state, so it must never crash the handler
        // (this guard is what an unhandled `await` was missing before).
        Promise.resolve()
            .then(() => clearOnboardingState(userId))
            .catch(err => {
                if (__DEV__) {
                    console.warn('[useRepeatTutorial] clearOnboardingState failed:', err?.message);
                }
            });
    }, [dispatch, userId]);
};

export default useRepeatTutorial;
