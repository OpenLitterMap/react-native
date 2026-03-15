import React from 'react';
import { View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
    HomeScreen,
    ProfileScreen
} from '../screens';
import TeamStack from './TeamStack';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { Colors } from '../screens/components';

const Tab = createMaterialTopTabNavigator();

const TabRoutes: React.FC = () => (
    <>
        <Tab.Navigator
            tabBarPosition="bottom"
            initialRouteName="HOME"
            lazy
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color }) => {
                    let iconName;

                    switch (route.name) {
                        case 'HOME':
                            iconName = focused ? 'home' : 'home-outline';
                            break;

                        case 'TEAM':
                            iconName = focused ? 'people' : 'people-outline';
                            break;

                        case 'USER_STATS':
                            iconName = focused ? 'person' : 'person-outline';
                            break;

                        default:
                            break;
                    }

                    return (
                        <View
                            style={{
                                backgroundColor: focused
                                    ? `${Colors.accentLight}`
                                    : 'white',
                                width: 56,
                                height: 56,
                                borderRadius: 100,
                                justifyContent: 'center',
                                alignItems: 'center',
                                alignContent: 'center',
                                padding: 0,
                                marginTop: -4
                            }}>
                            <Icon name={iconName} size={26} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: `${Colors.accent}`,
                tabBarInactiveTintColor: 'gray',
                tabBarShowIcon: true,
                tabBarShowLabel: false,
                tabBarIconStyle: {
                    height: 56,
                    justifyContent: 'center',
                    alignItems: 'center'
                },
                tabBarPressColor: 'white',
                tabBarPressOpacity: 0,
                tabBarIndicatorStyle: {display: 'none', backgroundColor: 'white'},
                tabBarStyle: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    height: 84,
                    margin: 0,
                    paddingBottom: 12,
                    padding: 0
                },
            })}
        >
            <Tab.Screen name="HOME" component={HomeScreen} />
            <Tab.Screen name="TEAM" component={TeamStack} />
            <Tab.Screen name="USER_STATS" component={ProfileScreen} />
        </Tab.Navigator>
    </>
);

export default TabRoutes;
