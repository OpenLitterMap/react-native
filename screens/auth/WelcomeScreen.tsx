import React, {Component} from 'react';
import {
    Dimensions,
    Pressable,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import {LanguageFlags, Slides} from './authComponents';
import {Body, Colors} from '../components';

import {connect} from 'react-redux';
import * as actions from '../../actions';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface WelcomeScreenProps {
    navigation: any;
    lang: string;
}

interface WelcomeScreenState {}

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
        text: 'welcome.open-database'
    }
];

class WelcomeScreen extends Component<WelcomeScreenProps, WelcomeScreenState> {
    constructor(props: any) {
        super(props);
    }

    goToAuth(auth: string) {
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
                    style={{flex: 1, backgroundColor: Colors.accentLight}}>
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
                        <LanguageFlags lang={lang} />
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

const mapStateToProps = (state: any) => {
    return {
        lang: state.auth.lang,
        token: state.auth.token
    };
};

export default connect(mapStateToProps, actions)(WelcomeScreen);
