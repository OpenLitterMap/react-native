import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GalleryScreen, AlbumScreen } from '../screens';

const Stack = createStackNavigator();

const GalleryStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="ALBUM"
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="ALBUM" component={AlbumScreen} />
            <Stack.Screen name="GALLERY" component={GalleryScreen} />
        </Stack.Navigator>
    );
};

export default GalleryStack;
