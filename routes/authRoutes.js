import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthScreen, WelcomeScreen} from '../screens/auth';

const Stack = createStackNavigator();

const AuthStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="WELCOME" component={WelcomeScreen} />
            <Stack.Screen name="AUTH" component={AuthScreen} />
        </Stack.Navigator>
    );
};

export default AuthStack;
