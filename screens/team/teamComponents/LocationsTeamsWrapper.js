import React from 'react';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {Colors} from '../../components';
import LeaderboardsTab from './LeaderboardsTab';
import TeamsHomeTab from './TeamsHomeTab';
import LocationsLeaderboardTab from './LocationsLeaderboardTab';

const Tab = createMaterialTopTabNavigator();

const LocationsTeamsWrapper = ({onTabChange, onCreateTeam, onJoinTeam}) => {
    return (
        <Tab.Navigator
            screenListeners={{
                state: e => {
                    const routes = e.data?.state?.routes;
                    const index = e.data?.state?.index;
                    if (routes && index != null && onTabChange) {
                        onTabChange(routes[index].name);
                    }
                }
            }}
            screenOptions={{
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.muted,
                tabBarIndicatorStyle: {
                    backgroundColor: Colors.accent,
                    height: 3
                },
                tabBarLabelStyle: {
                    fontFamily: 'Poppins-SemiBold',
                    fontSize: 14,
                    textTransform: 'none'
                },
                tabBarStyle: {
                    backgroundColor: 'white',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0'
                }
            }}>
            <Tab.Screen name="Leaderboards" component={LeaderboardsTab} />
            <Tab.Screen name="Locations" component={LocationsLeaderboardTab} />
            <Tab.Screen name="Teams">
                {() => (
                    <TeamsHomeTab
                        onCreateTeam={onCreateTeam}
                        onJoinTeam={onJoinTeam}
                    />
                )}
            </Tab.Screen>
        </Tab.Navigator>
    );
};

export default LocationsTeamsWrapper;
