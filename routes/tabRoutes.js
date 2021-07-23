import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Icon } from 'react-native-elements';
import { HomeScreen } from '../screens';

const Tab = createBottomTabNavigator();

const TabRoutes = () => (
    <Tab.Navigator
        initialRouteName="HOME"
        // screenOptions={({ route }) => ({
        //     tabBarIcon: ({ focused, color, size }) => {
        //         let iconName;

        //         if (route.name === 'HOME') {
        //             iconName = 'home';
        //         } else if (route.name === 'SEARCH') {
        //             iconName = 'insights';
        //         } else if (route.name === 'NEW') {
        //             iconName = 'people-outline';
        //         } else if (route.name === 'NOTIFICATION') {
        //             iconName = 'trophy-outline';
        //         } else if (route.name === 'PROFILE') {
        //             iconName = 'cloud-upload-outline';
        //         }

        //         // You can return any component that you like here!

        //         return (
        //             // @ts-ignore
        //             <Icon name={iconName} size={24} color={color} />
        //         );
        //     }
        // })}
        tabBarOptions={{
            activeTintColor: 'black',
            inactiveTintColor: 'gray',
            // showLabel: false,
            style: {
                backgroundColor: 'white',
                borderTopWidth: 0,
                height: 80,
                paddingTop: 10
            }
        }}>
        <Tab.Screen name="HOME" component={HomeScreen} />
        <Tab.Screen name="SEARCH" component={HomeScreen} />
        <Tab.Screen name="NOTIFICATION" component={HomeScreen} />
        <Tab.Screen name="PROFILE" component={HomeScreen} />
    </Tab.Navigator>
);

export default TabRoutes;
