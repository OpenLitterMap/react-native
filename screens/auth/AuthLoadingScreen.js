import React, { Component } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import StyleSheet from 'react-native-extended-stylesheet';

class AuthLoadingScreen extends Component {
    constructor(props) {
        super(props);

        this._bootstrapAsync();
    }

    /**
     * Check if we have a token
     *
     * If we do, check if the token is valid
     *
     * If the token is valid, check if we already have a user
     *
     * If not, make a request to get the user
     *
     * @return redirect to main App or Auth
     */
    _bootstrapAsync = async () => {
        let redirect = '';

        const userToken = await AsyncStorage.getItem('jwt');

        if (!userToken) redirect = 'Auth';
        else {
            // Check if the token is valid
            await this.props.checkValidToken(userToken);

            console.log('tokenIsValid', this.props.tokenIsValid);

            if (!this.props.tokenIsValid) redirect = 'Auth';
            else {
                redirect = 'App';

                if (!this.props.user) {
                    console.log(
                        'User does not exist on props. Checking AsyncStorage'
                    );
                    const user = await AsyncStorage.getItem('user');

                    if (user) {
                        console.log(
                            'User object found in AsyncStorage. Updating state props.'
                        );
                        this.props.userFound(user);
                    } else {
                        console.log(
                            'User does not exist in AsyncStorage. Making API request with token.'
                        );
                        this.props.fetchUser(userToken);
                    }
                }
            }
        }

        this.props.navigation.navigate(redirect);
    };

    /**
     * Render function
     */
    render() {
        return (
            <View style={styles.container}>
                <ActivityIndicator />
                <StatusBar barStyle="default" />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});

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
)(AuthLoadingScreen);
