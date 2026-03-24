// @ts-ignore

import React from 'react';
import {StyleSheet, View} from 'react-native';
import {createMaterialTopTabNavigator} from '@react-navigation/material-top-tabs';
import {HomeScreen, ProfileScreen} from '../screens';
import TeamStack from './TeamStack';
import Icon from 'react-native-vector-icons/Ionicons';
import {Colors} from '../screens/components';

const Tab = createMaterialTopTabNavigator();

const ICONS: Record<string, [string, string]> = {
    HOME: ['home', 'home-outline'],
    TEAM: ['people', 'people-outline'],
    USER_STATS: ['person', 'person-outline']
};

const TabIcon = ({routeName, focused, color}: {routeName: string; focused: boolean; color: string}) => {
    const [active, inactive] = ICONS[routeName] ?? ['help', 'help-outline'];
    return (
        <View
            style={[
                styles.iconWrap,
                {backgroundColor: focused ? Colors.accentLight : 'white'}
            ]}>
            <Icon name={focused ? active : inactive} size={26} color={color} />
        </View>
    );
};

const TabRoutes = () => (
    <Tab.Navigator
        id="MainTabs"
        tabBarPosition="bottom"
        initialRouteName="HOME"
        screenOptions={({route}) => ({
            lazy: true,
            tabBarIcon: ({focused, color}: {focused: boolean; color: string}) => (
                <TabIcon routeName={route.name} focused={focused} color={color} />
            ),
            tabBarActiveTintColor: Colors.accent,
            tabBarInactiveTintColor: 'gray',
            tabBarShowIcon: true,
            tabBarShowLabel: false,
            tabBarIconStyle: styles.tabBarIcon,
            tabBarPressColor: 'white',
            tabBarPressOpacity: 0,
            tabBarIndicatorStyle: styles.tabBarIndicator,
            tabBarStyle: styles.tabBar
        })}>
        <Tab.Screen name="HOME" component={HomeScreen} />
        <Tab.Screen name="TEAM" component={TeamStack} />
        <Tab.Screen name="USER_STATS" component={ProfileScreen} />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    iconWrap: {
        width: 56,
        height: 56,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: -4
    },
    tabBarIcon: {
        height: 56,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tabBarIndicator: {
        display: 'none',
        backgroundColor: 'white'
    },
    tabBar: {
        backgroundColor: 'white',
        borderTopWidth: 0,
        height: 84,
        margin: 0,
        paddingBottom: 12,
        padding: 0
    }
});

export default TabRoutes;
