import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SettingScreen, GalleryScreen, AblumScreen } from '../screens';

const Stack = createStackNavigator();

const GalleryStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="ALBUM" component={AblumScreen} />
            <Stack.Screen name="GALLERY" component={GalleryScreen} />
        </Stack.Navigator>
    );
};

export default GalleryStack;
