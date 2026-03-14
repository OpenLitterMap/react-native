import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthScreen, WelcomeScreen } from '../screens/auth';

const Stack = createNativeStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="WELCOME" component={WelcomeScreen} />
            <Stack.Screen name="AUTH" component={AuthScreen} />
        </Stack.Navigator>
    );
};

export default AuthStack;
