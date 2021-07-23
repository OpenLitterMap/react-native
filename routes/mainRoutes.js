import React, { Component } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-community/async-storage';
import * as actions from '../actions';
import AuthStack from './authRoutes';
import AppStack from './appRoutes';
import TabRoutes from './tabRoutes';
import { WelcomeScreen, AuthScreen } from '../screens/auth';
import SwipeScreen from '../screens/SwipeScreen';

const Stack = createStackNavigator();

class MainRoutes extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isLoading: true,
            userToken: null
        };
        // this._bootstrapAsync();
    }

    componentDidMount() {
        this._bootstrapAsync();
    }

    /**
     * Check if we have a token
     *
     * If we do, check if the token is valid
     *
     * If the token is valid, get the user
     *
     * fetch user on every app load.
     * otherwise web and app user data can go out of sync
     */
    _bootstrapAsync = async () => {
        const userToken = await AsyncStorage.getItem('jwt');

        if (userToken) {
            // Check if the token is valid
            await this.props.checkValidToken(userToken);

            // console.log('tokenIsValid', this.props.tokenIsValid);

            if (this.props.tokenIsValid) {
                if (!this.props.user) {
                    await this.props.fetchUser(userToken);
                }
                this.setState({ isLoading: false });
            }
        } else {
            this.setState({ isLoading: false });
        }
    };
    render() {
        // TODO: show splash screen instead of loading
        if (this.state.isLoading) {
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center'
                    }}>
                    <ActivityIndicator />
                </View>
            );
        } else {
            return (
                <Stack.Navigator
                    screenOptions={{
                        headerShown: false
                    }}>
                    {this.props.token === null ? (
                        <Stack.Screen name="AUTH_HOME" component={AuthStack} />
                    ) : (
                        <Stack.Screen name="APP" component={TabRoutes} />
                    )}
                </Stack.Navigator>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        user: state.auth.user,
        token: state.auth.token,
        tokenIsValid: state.auth.tokenIsValid
    };
};

export default connect(
    mapStateToProps,
    actions
)(MainRoutes);
