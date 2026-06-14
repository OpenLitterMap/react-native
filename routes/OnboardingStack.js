import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
    OnboardingWelcomeScreen,
    OnboardingInstructionsScreen,
    ChoosePathScreen,
    OnboardingPermissionScreen,
    OnboardingPhotoScreen,
    OnboardingCameraScreen,
    OnboardingTagScreen,
    CelebrationScreen
} from '../screens/onboarding';

const Stack = createNativeStackNavigator();

/**
 * Onboarding navigation stack.
 * Shown after authentication when onboarding is not yet complete.
 *
 * Flow: Welcome → Instructions → ChoosePath → Permission → Photo/Camera → Tag → Celebration
 */
const OnboardingStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                gestureEnabled: false,
                animation: 'slide_from_right'
            }}>
            <Stack.Screen name="ONBOARDING_WELCOME" component={OnboardingWelcomeScreen} />
            <Stack.Screen name="ONBOARDING_INSTRUCTIONS" component={OnboardingInstructionsScreen} />
            <Stack.Screen name="CHOOSE_PATH" component={ChoosePathScreen} />
            <Stack.Screen name="ONBOARDING_PERMISSION" component={OnboardingPermissionScreen} />
            <Stack.Screen name="ONBOARDING_PHOTO" component={OnboardingPhotoScreen} />
            <Stack.Screen name="ONBOARDING_CAMERA" component={OnboardingCameraScreen} />
            <Stack.Screen name="ONBOARDING_TAG" component={OnboardingTagScreen} />
            <Stack.Screen name="CELEBRATION" component={CelebrationScreen} />
        </Stack.Navigator>
    );
};

export default OnboardingStack;
