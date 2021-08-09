import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import {
    ProfileScreen,
    StatsScreen,
    HomeScreen,
    TeamScreen,
    RankingScreen
} from '../screens';
import { CameraPage } from '../screens/pages';
import { Fab, Colors } from '../screens/components';

const Tab = createBottomTabNavigator();

const TabRoutes = ({ navigation }) => (
    <>
        <Tab.Navigator
            initialRouteName="HOME"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    switch (route.name) {
                        case 'HOME':
                            iconName = focused
                                ? 'ios-home'
                                : 'ios-home-outline';
                            break;
                        case 'STATS':
                            iconName = focused
                                ? 'ios-trending-up'
                                : 'ios-trending-up-outline';
                            break;
                        // case 'TEAM':
                        //     iconName = focused
                        //         ? 'ios-people'
                        //         : 'ios-people-outline';
                        //     break;
                        // case 'RANKING':
                        //     iconName = focused
                        //         ? 'ios-trophy'
                        //         : 'ios-trophy-outline';
                        //     break;
                        case 'CAMERA':
                            iconName = focused
                                ? 'ios-camera'
                                : 'ios-camera-outline';
                            break;
                        case 'PROFILE':
                            iconName = focused
                                ? 'ios-person'
                                : 'ios-person-outline';
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
                                width: 50,
                                height: 50,
                                borderRadius: 100,
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}>
                            <Icon name={iconName} size={24} color={color} />
                        </View>
                    );
                }
            })}
            tabBarOptions={{
                activeTintColor: `${Colors.accent}`,
                inactiveTintColor: 'gray',
                showLabel: false,
                style: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    paddingTop: 10
                }
            }}>
            <Tab.Screen name="HOME" component={HomeScreen} />
            <Tab.Screen name="STATS" component={StatsScreen} />
            <Tab.Screen
                name="CAMERA"
                component={CameraPage}
                options={{ unmountOnBlur: true }}
            />
            {/* <Tab.Screen name="TEAM" component={TeamScreen} /> */}
            {/* <Tab.Screen name="RANKING" component={RankingScreen} /> */}
            <Tab.Screen name="PROFILE" component={ProfileScreen} />
        </Tab.Navigator>

        {/* INFO: fab will be shown on all screens which shows bottom tabbar
        Not used for now
         */}
        {/* <Fab navigation={navigation} /> */}
    </>
);

export default TabRoutes;
