import React, { Component } from 'react';
import {
    Dimensions,
    SafeAreaView,
    StyleSheet,
    View,
    StatusBar
} from 'react-native';
import { TransText } from 'react-native-translation';
import LinearGradient from 'react-native-linear-gradient';
import LanguageFlags from './welcome/LanguageFlags';
import Slides from './welcome/Slides';
import { Colors, Body, Title } from '../components';

import { connect } from 'react-redux';
import * as actions from '../../actions';
import { Pressable } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

const SLIDE_DATA = [
    {
        id: 1,
        image: require('../../assets/illustrations/click_image.png'),
        title: 'welcome.easy',
        text: 'welcome.just-tag-and-upload'
    },
    {
        id: 2,
        image: require('../../assets/illustrations/rankup.png'),
        title: 'welcome.fun',
        text: 'welcome.climb-leaderboards'
    },
    {
        id: 3,
        image: require('../../assets/illustrations/open_data.png'),
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
            <>
                <StatusBar
                    translucent
                    // hidden
                    barStyle="dark-content"
                    backgroundColor={`${Colors.accentLight}`}
                />
                <SafeAreaView
                    style={{ flex: 1, backgroundColor: Colors.accentLight }}>
                    <LanguageFlags lang={lang} />

                    <View
                        style={{
                            flex: 1,
                            backgroundColor: Colors.accentLight
                        }}>
                        <Slides data={SLIDE_DATA} lang={lang} />

                        <View style={styles.loginPosition}>
                            <Pressable
                                onPress={this.goToAuth.bind(this, 'signup')}
                                style={styles.loginButton}>
                                <Body
                                    family="medium"
                                    style={styles.signupText}
                                    color="white"
                                    dictionary={`${lang}.welcome.continue`}
                                />
                            </Pressable>
                            <Pressable
                                onPress={this.goToAuth.bind(this, 'login')}
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    // backgroundColor: 'red',
                                    alignSelf: 'center',
                                    alignContent: 'center'
                                }}>
                                <Body
                                    style={styles.loginText}
                                    dictionary={`${lang}.auth.already-have`}
                                />
                                <Body
                                    color="accent"
                                    family="semiBold"
                                    style={[styles.loginText]}
                                    dictionary={`${lang}.auth.login`}
                                />
                            </Pressable>
                        </View>
                    </View>
                </SafeAreaView>
            </>
        );
    }
}

const styles = StyleSheet.create({
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
        height: SCREEN_HEIGHT * 0.08,
        justifyContent: 'center',
        width: SCREEN_WIDTH - 40
    },
    loginPosition: {
        position: 'absolute',
        bottom: SCREEN_HEIGHT * 0.06,
        left: 20
    },
    signupText: {
        // fontSize: SCREEN_HEIGHT * 0.02,
        // fontWeight: '600',
        // color: 'white'
    },
    loginText: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 5
    }
});

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
