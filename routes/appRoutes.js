import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import SwipeScreen from '../screens/SwipeScreen';

const Stack = createStackNavigator();

const AppStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="APP" component={SwipeScreen} />
        </Stack.Navigator>
    );
};

export default AppStack;
