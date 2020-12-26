import React, { Component } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Slides from './welcome/Slides';
import { connect } from 'react-redux';
import * as actions from '../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/easy.png'),
        title1: "It's ",
        title2: "EASY!",
        text: "Just tag litter and upload it"
    },
    {
        id: 2,
        image: require('../../assets/rank.png'),
        title1: "It's ",
        title2: "FUN!",
        text: "Climb the leaderboards at the #LitterWorldCup"
    },
    {
        id: 3,
        image: require('../../assets/dove_colour.png'),
        title1: "It's ",
        title2: "OPEN!",
        text: "Open data has unlimited potential"
    }
];

class WelcomeScreen extends Component {

    constructor (props)
    {
        super(props);

        // Check if the user is authenticated
        props.checkForToken();
    }

    componentDidMount ()
    {
        this.props.checkForToken();
    }

    goToAuth (auth)
    {
        this.props.navigation.navigate('auth', { auth });
    };

    /**
     * Welcome on-boarding screen [1,2,3]
     */
    render ()
    {
        return (
            <View style={{ flex: 1 }}>
                <LinearGradient
                    colors={['#2ecc71','#8e44ad', '#c5d119']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}>

                    <Slides data={SLIDE_DATA} />

                    <View style={styles.loginPosition}>
                        <TouchableOpacity onPress={this.goToAuth.bind(this, 'signup')} style={styles.loginButton}>
                            <Text style={styles.signupText}>Continue</Text>
                        </TouchableOpacity>
                        <Text onPress={this.goToAuth.bind(this, 'login')}
                              style={styles.loginText}>Already have an account? Log in.</Text>
                    </View>
                </LinearGradient>
            </View>
        );
    }
}

const styles = {
    activityContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loginButton: {
        alignItems: 'center',
        backgroundColor: '#00a8ff',
        borderWidth: 0.5,
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.07,
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.8
    },
    loginPosition: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.06,
        left: SCREEN_WIDTH * 0.1,
    },
    signupText: {
        fontSize: SCREEN_HEIGHT * 0.02,
        fontWeight: '600'
    },
    loginText: {
        alignItems: 'center',
        alignSelf: 'center',
        padding: SCREEN_HEIGHT * 0.015,
        fontSize: SCREEN_HEIGHT * 0.02,
        justifyContent: 'center',
        marginTop: 10
    }
};

const mapStateToProps = state => {
    return {
        token: state.auth.token,
        appLoading: state.auth.appLoading
    };
};

export default connect(
    mapStateToProps,
    actions
)(WelcomeScreen);
