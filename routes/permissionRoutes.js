import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { GalleryPermissionScreen } from '../screens';

const Stack = createStackNavigator();

const PermissionStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen
                name="GALLERY_PERMISSION"
                component={GalleryPermissionScreen}
            />
        </Stack.Navigator>
    );
};

export default PermissionStack;
