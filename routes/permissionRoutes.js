import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GalleryPermissionScreen, CameraPermissionScreen } from '../screens';

const Stack = createStackNavigator();

const PermissionStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="GALLERY_PERMISSION"
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen
                name="GALLERY_PERMISSION"
                component={GalleryPermissionScreen}
            />

            <Stack.Screen
                name="CAMERA_PERMISSION"
                component={CameraPermissionScreen}
            />
        </Stack.Navigator>
    );
};

export default PermissionStack;
