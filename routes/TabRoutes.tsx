import React from 'react';
import {StyleSheet, Text} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {HomeScreen, ProfileScreen} from '../screens';
import {Colors} from '../screens/components/theme';
import TeamStack from './TeamStack';

const Tab = createBottomTabNavigator();

const TAB_CONFIG: Record<string, {emoji: string; label: string}> = {
    HOME: {emoji: '🌍', label: 'Home'},
    TEAM: {emoji: '🧗', label: 'Teams'},
    USER_STATS: {emoji: '📱', label: 'Profile'}
};

const TabIcon = ({routeName, focused}: {routeName: string; focused: boolean}) => (
    <Text style={[styles.emoji, !focused && styles.emojiInactive]}>
        {TAB_CONFIG[routeName]?.emoji ?? '❓'}
    </Text>
);

const makeTabBarIcon = (routeName: string) =>
    ({focused}: {focused: boolean}) => <TabIcon routeName={routeName} focused={focused} />;

const homeIcon = makeTabBarIcon('HOME');
const teamIcon = makeTabBarIcon('TEAM');
const profileIcon = makeTabBarIcon('USER_STATS');

const TabRoutes = () => (
    <Tab.Navigator
        id="MainTabs"
        initialRouteName="HOME"
        screenOptions={{
            headerShown: false,
            lazy: true,
            tabBarLabelStyle: styles.label,
            tabBarActiveTintColor: Colors.accent,
            tabBarInactiveTintColor: Colors.muted,
            tabBarStyle: styles.tabBar
        }}>
        <Tab.Screen
            name="HOME"
            component={HomeScreen}
            options={{tabBarIcon: homeIcon, tabBarLabel: 'Home'}}
        />
        <Tab.Screen
            name="TEAM"
            component={TeamStack}
            options={{tabBarIcon: teamIcon, tabBarLabel: 'Leaderboards'}}
        />
        <Tab.Screen
            name="USER_STATS"
            component={ProfileScreen}
            options={{tabBarIcon: profileIcon, tabBarLabel: 'Account'}}
        />
    </Tab.Navigator>
);

const styles = StyleSheet.create({
    emoji: {
        fontSize: 32
    },
    emojiInactive: {
        opacity: 0.5
    },
    label: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 11
    },
    tabBar: {
        backgroundColor: Colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e0e0e0',
        height: 88,
        paddingTop: 8
    }
});

export default TabRoutes;
