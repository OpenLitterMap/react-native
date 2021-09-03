import React from 'react';
import { View, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { WelcomeScreen, AuthScreen } from '../screens/auth';

const Stack = createStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator
            initialRouteName="WELCOME"
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="WELCOME" component={WelcomeScreen} />
            <Stack.Screen name="AUTH" component={AuthScreen} />
        </Stack.Navigator>
    );
};

export default AuthStack;
