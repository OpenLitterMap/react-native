import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GalleryScreen, AlbumScreen } from '../screens';

const Stack = createStackNavigator();

const GalleryStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="GALLERY" component={GalleryScreen} />
            <Stack.Screen name="ALBUM" component={AlbumScreen} />
        </Stack.Navigator>
    );
};

export default GalleryStack;
