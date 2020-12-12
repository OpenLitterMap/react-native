import React, { Component } from 'react';
import {
    ActivityIndicator,
    StatusBar,
    View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import StyleSheet from 'react-native-extended-stylesheet';

class AuthLoadingScreen extends Component {

    constructor (props)
    {
        super(props);

        this._bootstrapAsync();
    }

    _bootstrapAsync = async () => {
        // console.log("checking if jwt exists...");
        const userToken = await AsyncStorage.getItem('jwt');

        if (userToken)
        {
            if (this.props.user)
            {
                console.log('User found @ this.props.user');
                // next
            }

            else
            {
                console.log('User does not exist on props. Checking AsyncStorage');
                const user = await AsyncStorage.getItem('user');

                if (user)
                {
                    console.log('User object found in AsyncStorage. Updating state props.');
                    this.props.userFound(user);
                    // next
                }

                else
                {
                    console.log('User does not exist in AsyncStorage. Making API request with token.');
                    this.props.fetchUser(userToken);
                }
            }
        }

        else
        {
            console.log('JWT authentication token not found. Navigating to Auth Stack.');
        }

        this.props.navigation.navigate(userToken ? 'App' : 'Auth');
    };

    /**
     * Render function
     */
    render ()
    {
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
        token: state.auth.token
    };
};

export default connect(mapStateToProps, actions)(AuthLoadingScreen);
