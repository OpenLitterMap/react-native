import React from 'react';
import {SafeAreaView, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';

import Icon from 'react-native-vector-icons/Ionicons';
import {GlobalDataScreen, HomeScreen, UserStatsScreen} from '../screens';
import TeamStack from './teamRoutes';
import {Colors} from '../screens/components';

const Tab = createMaterialTopTabNavigator();

const TabRoutes = ({navigation}) => (
    <>
        <Tab.Navigator
            tabBarPosition="bottom"
            initialRouteName="HOME"
            showIcon={true}
            tabStyle={{backgroundColor: '#000'}}
            screenOptions={({route}) => ({
                tabBarIcon: ({focused, color, size}) => {
                    let iconName;

                    switch (route.name) {
                        case 'HOME':
                            iconName = focused
                                ? 'ios-home'
                                : 'ios-home-outline';
                            break;
                        case 'GLOBAL_DATA':
                            iconName = focused
                                ? 'ios-trending-up'
                                : 'ios-trending-up-outline';
                            break;
                        case 'TEAM':
                            iconName = focused
                                ? 'ios-people'
                                : 'ios-people-outline';
                            break;
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
                        case 'USER_STATS':
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
                                alignItems: 'center',
                                alignContent: 'center',
                                padding: 0,
                                marginTop: -5,
                            }}>
                            <Icon name={iconName} size={24} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: `${Colors.accent}`,
                tabBarInactiveTintColor: 'gray',
                tabBarShowIcon: true,
                tabBarShowLabel: false,
                tabBarIconStyle: {
                    height: 50,
                },
                pressColor: 'white',
                pressOpacity: 0,
                indicatorStyle: {display: 'none', backgroundColor: 'white'},
                style: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    height: 60,
                    margin: 0,
                    padding: 0,
                },
                lazy: true,
            })}>
            <Tab.Screen name="HOME" component={HomeScreen} />
            {/*<Tab.Screen*/}
            {/*    name="CAMERA"*/}
            {/*    component={CameraScreen}*/}
            {/*    options={{ unmountOnBlur: true }}*/}
            {/*/>*/}
            <Tab.Screen name="TEAM" component={TeamStack} />
            <Tab.Screen name="GLOBAL_DATA" component={GlobalDataScreen} />

            {/* <Tab.Screen name="RANKING" component={RankingScreen} /> */}
            <Tab.Screen name="USER_STATS" component={UserStatsScreen} />
        </Tab.Navigator>
        <SafeAreaView backgroundColor="#ffffff" />
    </>
);

export default TabRoutes;
