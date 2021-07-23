import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Icon } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import { HomeScreen } from '../screens';

const Tab = createBottomTabNavigator();

const TabRoutes = () => (
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
                    iconName = focused ? 'ios-people' : 'ios-people-outline';
                } else if (route.name === 'RANKING') {
                    iconName = focused ? 'ios-trophy' : 'ios-trophy-outline';
                } else if (route.name === 'UPLOAD') {
                    iconName = focused
                        ? 'ios-cloud-upload'
                        : 'ios-cloud-upload-outline';
                }

                // You can return any component that you like here!

                return (
                    // @ts-ignore
                    <Icon name={iconName} size={24} color={color} />
                );
            }
        })}
        tabBarOptions={{
            activeTintColor: 'black',
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
        <Tab.Screen name="STATS" component={HomeScreen} />
        <Tab.Screen name="TEAM" component={HomeScreen} />
        <Tab.Screen name="RANKING" component={HomeScreen} />
        <Tab.Screen name="UPLOAD" component={HomeScreen} />
    </Tab.Navigator>
);

export default TabRoutes;
