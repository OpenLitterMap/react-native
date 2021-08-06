import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { HomeScreen, StatsScreen, TeamScreen, RankingScreen } from '../screens';
import LeftPage from '../screens/pages/LeftPage';
import { Fab } from '../screens/components';

const Tab = createBottomTabNavigator();

const TabRoutes = ({ navigation }) => (
    <>
        <Tab.Navigator
            initialRouteName="HOME"
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'HOME') {
                        iconName = focused ? 'ios-home' : 'ios-home-outline';
                    } else if (route.name === 'STATS') {
                        iconName = focused
                            ? 'ios-trending-up'
                            : 'ios-trending-up-outline';
                    } else if (route.name === 'TEAM') {
                        iconName = focused
                            ? 'ios-people'
                            : 'ios-people-outline';
                    } else if (route.name === 'RANKING') {
                        iconName = focused
                            ? 'ios-trophy'
                            : 'ios-trophy-outline';
                    } else if (route.name === 'UPLOAD') {
                        iconName = focused
                            ? 'ios-cloud-upload'
                            : 'ios-cloud-upload-outline';
                    }

                    return (
                        <View
                            style={{
                                backgroundColor: focused
                                    ? '#396afc11'
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
                activeTintColor: '#396AFC',
                inactiveTintColor: 'gray',
                showLabel: false,
                style: {
                    backgroundColor: 'white',
                    borderTopWidth: 0,
                    height: 80,
                    paddingTop: 10
                }
            }}>
            <Tab.Screen name="HOME" component={HomeScreen} />
            <Tab.Screen name="STATS" component={StatsScreen} />
            <Tab.Screen name="TEAM" component={TeamScreen} />
            <Tab.Screen name="RANKING" component={RankingScreen} />
            <Tab.Screen name="UPLOAD" component={LeftPage} />
        </Tab.Navigator>
        {/* fab will be shown on all screens which shows bottom tabbar */}
        <Fab navigation={navigation} />
    </>
);

export default TabRoutes;
