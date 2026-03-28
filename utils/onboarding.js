import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_PREFIX = '@olm_onboarding_completed_';
const ONBOARDING_STEP_PREFIX = '@olm_onboarding_step_';

/**
 * Get the storage key scoped to a user ID.
 * Falls back to a global key if no userId is provided (shouldn't happen in practice).
 */
const getKey = (userId) => `${ONBOARDING_PREFIX}${userId || 'global'}`;
const getStepKey = (userId) => `${ONBOARDING_STEP_PREFIX}${userId || 'global'}`;

/**
 * Check if onboarding has been completed for a specific user.
 * @param {string|number} userId
 * @returns {Promise<boolean>}
 */
export const isOnboardingComplete = async (userId) => {
    const value = await AsyncStorage.getItem(getKey(userId));
    return value !== null;
};

/**
 * Mark onboarding as complete for a specific user. Stores ISO timestamp.
 * @param {string|number} userId
 */
export const setOnboardingComplete = async (userId) => {
    await AsyncStorage.setItem(getKey(userId), new Date().toISOString());
};

/**
 * Clear onboarding state for a specific user (for testing / re-onboarding).
 * @param {string|number} userId
 */
export const clearOnboardingState = async (userId) => {
    await AsyncStorage.multiRemove([getKey(userId), getStepKey(userId)]);
};

/**
 * Get the current onboarding step for a user (for resume-from-step).
 * @param {string|number} userId
 * @returns {Promise<string|null>}
 */
export const getOnboardingStep = async (userId) => {
    return AsyncStorage.getItem(getStepKey(userId));
};

/**
 * Save current onboarding step for resume-from-step on force-quit.
 * @param {string|number} userId
 * @param {string} step
 */
export const setOnboardingStep = async (userId, step) => {
    await AsyncStorage.setItem(getStepKey(userId), step);
};
