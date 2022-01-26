import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TeamScreen, TeamDetailsScreen, TopTeamsScreen } from '../screens';

const Stack = createStackNavigator();

const TeamStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false
            }}>
            <Stack.Screen name="TEAM_HOME" component={TeamScreen} />
            <Stack.Screen name="TEAM_DETAILS" component={TeamDetailsScreen} />
            <Stack.Screen name="TOP_TEAMS" component={TopTeamsScreen} />
        </Stack.Navigator>
    );
};

export default TeamStack;
