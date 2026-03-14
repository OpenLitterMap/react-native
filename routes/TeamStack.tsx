import React, { FC } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
    TeamScreen,
    TeamDetailsScreen,
    TopTeamsScreen,
    TeamLeaderboardScreen
} from '../screens';

const Stack = createNativeStackNavigator();

const TeamStack: FC = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="TEAM_HOME" component={TeamScreen} />
            <Stack.Screen name="TEAM_DETAILS" component={TeamDetailsScreen} />
            <Stack.Screen name="TOP_TEAMS" component={TopTeamsScreen} />
            <Stack.Screen name="TEAM_LEADERBOARD" component={TeamLeaderboardScreen} />
        </Stack.Navigator>
    );
};

export default TeamStack;
