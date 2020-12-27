import React, { PureComponent } from 'react'
import {
    createAppContainer,
    createSwitchNavigator
} from 'react-navigation'

import { createBottomTabNavigator } from 'react-navigation-tabs'

// import { connect } from 'react-redux'
// import * as actions from '../actions'

import AuthLoadingScreen from './auth/AuthLoadingScreen'
import AuthScreen from './auth/AuthScreen'
import WelcomeScreen from './auth/WelcomeScreen'
import SwipeScreen from './SwipeScreen'
import SettingsScreen from './SettingsScreen'

// change default colour cursor
import { TextInput } from 'react-native'
TextInput.defaultProps.selectionColor = 'white'

const AuthStack = createBottomTabNavigator(
    {
        welcome: { screen: WelcomeScreen },
        auth: { screen: AuthScreen }
    },
    {
        initialRouteName: 'welcome',
        lazy: true,
        defaultNavigationOptions: {
            tabBarVisible: false
        }
    }
);

const AppStack = createBottomTabNavigator(
    {
        swipe: { screen: SwipeScreen },
        settings: { screen: SettingsScreen }
    },
    {
        initialRouteName: 'swipe',
        lazy: true,
        navigationOptions: {
            tabBarVisible: false
        },
        defaultNavigationOptions: {
            tabBarVisible: false
        }
    }
);

const MainNavigator = createSwitchNavigator(
    {
        AuthLoading: AuthLoadingScreen,
        Auth: AuthStack,
        App: AppStack
    },
    {
        initialRouteName: 'AuthLoading',
        lazy: true,
        navigationOptions: {
            tabBarVisible: false
        }
    }
);

const RootContainer = createAppContainer(MainNavigator);

export default createAppContainer(RootContainer);
