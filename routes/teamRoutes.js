import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
    TeamScreen,
    TeamDetailsScreen,
    TopTeamsScreen,
    TeamLeaderboardScreen
} from '../screens';

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
            <Stack.Screen
                name="TEAM_LEADERBOARD"
                component={TeamLeaderboardScreen}
            />
        </Stack.Navigator>
    );
};

export default TeamStack;
