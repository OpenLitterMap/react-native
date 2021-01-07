import React, { Component } from 'react';
import {
    Dimensions,
    TouchableOpacity,
    View
} from 'react-native';
import { TransText } from "react-native-translation";
import LinearGradient from 'react-native-linear-gradient';
import LanguageFlags from './welcome/LanguageFlags';
import Slides from './welcome/Slides';

import { connect } from 'react-redux';
import * as actions from '../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/easy.png'),
        title: "welcome.easy",
        text: "welcome.just-tag-and-upload"
    },
    {
        id: 2,
        image: require('../../assets/rank.png'),
        title: "welcome.fun",
        text: "welcome.climb-leaderboards"
    },
    {
        id: 3,
        image: require('../../assets/dove_colour.png'),
        title: "welcome.open",
        text: "welcome.unlimited-potential"
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
        const lang = this.props.lang;

        return (
            <View style={{ flex: 1, position: 'relative' }}>

                <LanguageFlags lang={lang} />

                <LinearGradient
                    colors={['#2ecc71','#8e44ad', '#c5d119']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}
                >
                    <Slides data={SLIDE_DATA} lang={lang} />

                    <View style={styles.loginPosition}>
                        <TouchableOpacity onPress={this.goToAuth.bind(this, 'signup')} style={styles.loginButton}>
                            <TransText style={styles.signupText} dictionary={`${lang}.welcome.continue`} />
                        </TouchableOpacity>
                        <TransText
                            onPress={this.goToAuth.bind(this, 'login')}
                            style={styles.loginText}
                            dictionary={`${lang}.welcome.already-have-account`}
                        />
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
        lang: state.auth.lang,
        token: state.auth.token,
        appLoading: state.auth.appLoading
    };
};

export default connect(
    mapStateToProps,
    actions
)(WelcomeScreen);
