import React, { Component } from 'react';
import { Dimensions, SafeAreaView, TouchableOpacity, View } from 'react-native';
import { TransText } from 'react-native-translation';
import LinearGradient from 'react-native-linear-gradient';
import LanguageFlags from './welcome/LanguageFlags';
import Slides from './welcome/Slides';
import { Colors, Body, SubTitle } from '../components';

import { connect } from 'react-redux';
import * as actions from '../../actions';
import { Pressable } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/easy.png'),
        title: 'welcome.easy',
        text: 'welcome.just-tag-and-upload'
    },
    {
        id: 2,
        image: require('../../assets/rank.png'),
        title: 'welcome.fun',
        text: 'welcome.climb-leaderboards'
    },
    {
        id: 3,
        image: require('../../assets/dove_colour.png'),
        title: 'welcome.open',
        text: 'welcome.unlimited-potential'
    }
];

class WelcomeScreen extends Component {
    constructor(props) {
        super(props);
    }

    goToAuth(auth) {
        this.props.navigation.navigate('AUTH', {
            screen: auth
        });
    }

    /**
     * Welcome on-boarding screen [1,2,3]
     */
    render() {
        const lang = this.props.lang;

        return (
            <View style={{ flex: 1, position: 'relative', zIndex: 1 }}>
                <LanguageFlags lang={lang} />

                <LinearGradient
                    colors={[Colors.accent, Colors.accentLight]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1 }}>
                    <Slides data={SLIDE_DATA} lang={lang} />

                    <View style={styles.loginPosition}>
                        <Pressable
                            onPress={this.goToAuth.bind(this, 'signup')}
                            style={styles.loginButton}>
                            <TransText
                                style={styles.signupText}
                                dictionary={`${lang}.welcome.continue`}
                            />
                        </Pressable>
                        <Pressable
                            onPress={this.goToAuth.bind(this, 'login')}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'center'
                            }}>
                            <Body
                                style={styles.loginText}
                                dictionary={`${lang}.auth.already-have`}
                            />
                            <Body
                                color="accent"
                                family="semiBold"
                                style={[styles.loginText, { marginLeft: 10 }]}
                                dictionary={`${lang}.auth.login`}
                            />
                        </Pressable>
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
        backgroundColor: Colors.accent,
        // borderWidth: 0.5,
        borderRadius: 100,
        height: SCREEN_HEIGHT * 0.07,
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.8
    },
    loginPosition: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.06,
        left: SCREEN_WIDTH * 0.1
    },
    signupText: {
        fontSize: SCREEN_HEIGHT * 0.02,
        fontWeight: '600'
    },
    loginText: {
        marginTop: 10,
        paddingVertical: 10
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
