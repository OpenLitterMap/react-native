import React, {useState, useEffect, useCallback} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useSelector, useDispatch} from 'react-redux';
import {checkValidToken, markOnboardingComplete} from '../reducers/auth_reducer';
import {isOnboardingComplete, setOnboardingComplete as setOnboardingCompleteStorage} from '../utils/onboarding';

import AuthStack from './AuthStack';
import OnboardingStack from './OnboardingStack';
import TabRoutes from './TabRoutes';
import PermissionStack from './PermissionStack';
import {NewUpdateScreen, SettingScreen} from '../screens';
import AddTagScreen from '../screens/addTag/AddTagScreen';
import MyUploads from '../screens/userStats/userComponents/MyUploads';
import QuickTagsSettingsScreen from '../screens/setting/QuickTagsSettingsScreen';

const Stack = createNativeStackNavigator();

/**
 * Root navigator — three-way routing:
 *   1. No token → AuthStack
 *   2. Token + onboarding incomplete → OnboardingStack
 *   3. Token + onboarding complete → App (TabRoutes + modals)
 *
 * Onboarding state is scoped per user ID and re-evaluated when auth changes.
 */
const MainRoutes = () => {
    const dispatch = useDispatch();
    const [isValidating, setIsValidating] = useState(true);
    const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const onboardingComplete = useSelector(state => state.auth.onboardingComplete);

    const checkOnboarding = useCallback(async (userId, webOnboardingDone) => {
        if (!userId) {
            setIsCheckingOnboarding(false);
            return;
        }
        const mobileComplete = await isOnboardingComplete(userId);
        if (mobileComplete || webOnboardingDone) {
            if (!mobileComplete) {
                await setOnboardingCompleteStorage(userId);
            }
            dispatch(markOnboardingComplete());
        }
        setIsCheckingOnboarding(false);
    }, [dispatch]);

    // Validate persisted token on mount
    useEffect(() => {
        (async () => {
            if (token) {
                await dispatch(checkValidToken(token));
            }
            setIsValidating(false);
        })();
    }, [dispatch]); // eslint-disable-line react-hooks/exhaustive-deps

    // Re-check onboarding when user changes (login, logout, switch account)
    useEffect(() => {
        if (user?.id) {
            setIsCheckingOnboarding(true);
            checkOnboarding(user.id, user.onboarding_completed_at != null);
        } else if (!token) {
            // No user (logged out) — no onboarding check needed
            setIsCheckingOnboarding(false);
        }
    }, [user?.id, token, checkOnboarding]); // eslint-disable-line react-hooks/exhaustive-deps

    if (isValidating || (token && isCheckingOnboarding)) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <Stack.Navigator
            screenOptions={{headerShown: false, contentStyle: {backgroundColor: 'white'}}}>
            {token === null ? (
                <Stack.Screen name="AUTH_HOME" component={AuthStack} />
            ) : !onboardingComplete ? (
                <Stack.Screen name="ONBOARDING" component={OnboardingStack} />
            ) : (
                <>
                    <Stack.Screen name="APP" component={TabRoutes} />
                    <Stack.Screen name="ADD_TAGS" component={AddTagScreen} options={{headerShown: false}} />
                    <Stack.Screen name="SETTING" component={SettingScreen} options={{headerShown: false}} />
                    <Stack.Screen name="QUICK_TAGS_SETTINGS" component={QuickTagsSettingsScreen} options={{headerShown: false}} />
                    <Stack.Screen name="MY_UPLOADS" component={MyUploads} options={{headerShown: false}} />
                    <Stack.Screen name="PERMISSION" component={PermissionStack} options={{presentation: 'fullScreenModal', gestureEnabled: false}} />
                    <Stack.Screen name="UPDATE" component={NewUpdateScreen} options={{presentation: 'fullScreenModal', gestureEnabled: false}} />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

export default MainRoutes;
