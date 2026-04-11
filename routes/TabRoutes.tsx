import React from 'react';
import {StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {HomeScreen, ProfileScreen} from '../screens';
import {Colors} from '../screens/components/theme';
import TeamStack from './TeamStack';
import useQuickTagsSync from '../screens/addTag/hooks/useQuickTagsSync';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, {active: string; inactive: string}> = {
    HOME: {active: 'earth', inactive: 'earth-outline'},
    TEAM: {active: 'trophy', inactive: 'trophy-outline'},
    USER_STATS: {active: 'person-circle', inactive: 'person-circle-outline'}
};

const TabIcon = ({routeName, focused, color}: {routeName: string; focused: boolean; color: string}) => {
    const name = focused ? TAB_ICONS[routeName].active : TAB_ICONS[routeName].inactive;
    return <Icon name={name} size={26} color={color} />;
};

const makeTabBarIcon = (routeName: string) =>
    ({focused, color}: {focused: boolean; color: string}) => (
        <TabIcon routeName={routeName} focused={focused} color={color} />
    );

const homeIcon = makeTabBarIcon('HOME');
const teamIcon = makeTabBarIcon('TEAM');
const profileIcon = makeTabBarIcon('USER_STATS');

const TabRoutes = () => {
    // Sync quick tags to backend when presets change (debounced 3s)
    useQuickTagsSync();

    const insets = useSafeAreaInsets();
    const tabBarStyle = [
        styles.tabBar,
        {height: 56 + insets.bottom, paddingBottom: insets.bottom + 4}
    ];

    return (
        <Tab.Navigator
            id="MainTabs"
            initialRouteName="HOME"
            screenOptions={{
                headerShown: false,
                lazy: true,
                tabBarLabelStyle: styles.label,
                tabBarActiveTintColor: Colors.accent,
                tabBarInactiveTintColor: Colors.muted,
                tabBarStyle: tabBarStyle
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
};

const styles = StyleSheet.create({
    label: {
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        fontSize: 11,
        marginTop: 2
    },
    tabBar: {
        backgroundColor: Colors.white,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e0e0e0',
        paddingTop: 6
    }
});

export default TabRoutes;
