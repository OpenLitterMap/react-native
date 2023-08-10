import React, {Component} from 'react';
import {
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
// import StyleSheet from 'react-native-extended-stylesheet';
import {connect} from 'react-redux';

import * as actions from '../../actions';

import {Body, Colors} from '../components';
import {ForgotPasswordForm, SigninForm, SignupForm} from './authComponents';

let SCREEN_WIDTH = Dimensions.get('window').width;
let SCREEN_HEIGHT = Dimensions.get('window').height;
let IS_PORTRAIT = SCREEN_WIDTH <= SCREEN_HEIGHT;

class AuthScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            formMode: 'CREATE_ACCOUNT',
            isLogoDisplayed: true
        };
    }

    updateSizeVariables = () => {
        SCREEN_WIDTH = Dimensions.get('window').width;
        SCREEN_HEIGHT = Dimensions.get('window').height;
        IS_PORTRAIT = SCREEN_WIDTH <= SCREEN_HEIGHT;
    };

    keyboardWillShow = event => {
        this.setState({
            isLogoDisplayed: false
        });
    };

    keyboardWillHide = event => {
        this.setState({
            isLogoDisplayed: true
        });
    };

    _keyboardDidShow = () => {
        this.setState({
            isLogoDisplayed: false
        });
    };

    _keyboardDidHide = () => {
        this.setState({
            isLogoDisplayed: true
        });
    };

    /**
     *
     */
    componentDidMount() {
        const {screen} = this.props.route.params;
        this.changeFormType(screen);
        this.updateSizeVariables();

        if (Platform.OS === 'ios') {
            this.keyboardWillShowSub = Keyboard.addListener(
                'keyboardWillShow',
                this.keyboardWillShow
            );
            this.keyboardWillHideSub = Keyboard.addListener(
                'keyboardWillHide',
                this.keyboardWillHide
            );
        } else {
            this.keyboardWillShowSub = Keyboard.addListener(
                'keyboardDidShow',
                this._keyboardDidShow
            );
            this.keyboardWillHideSub = Keyboard.addListener(
                'keyboardDidHide',
                this._keyboardDidHide
            );
        }

        this.focusListner = this.props.navigation.addListener('focus', () => {
            this.props.loginOrSignupReset();
        });
    }

    componentWillUnmount() {
        this.focusListner();
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    changeFormType = screenType => {
        this.props.loginOrSignupReset();
        switch (screenType) {
            case 'login':
                this.setState({
                    formMode: 'LOGIN'
                });
                break;
            case 'signup':
                this.setState({
                    formMode: 'CREATE_ACCOUNT'
                });
                break;
            case 'reset':
                this.setState({
                    formMode: 'FORGOT_PASSWORD'
                });
                break;
            default:
                this.setState({
                    formMode: 'LOGIN'
                });
                break;
        }
    };

    /**
     * Change the type of Form we are submitting
     */
    toggleFormMode = () => {
        // determine what the toggle button does depending on the form mode
        if (this.state.formMode === 'LOGIN') {
            this.changeFormType('signup');
        } else {
            this.changeFormType('login');
        }
    };

    /**
     * Return text for the option below the main button
     *
     * @return string
     */
    getModeSwitchText = () => {
        switch (this.state.formMode) {
            case 'CREATE_ACCOUNT':
                return `${this.props.lang}.auth.already-have`; // Already have an account?

            case 'LOGIN':
                return `${this.props.lang}.auth.create-account`; // Create Account'

            case 'FORGOT_PASSWORD':
                return `${this.props.lang}.auth.back-to-login`; // Back to Login
        }
    };

    renderForm = () => {
        switch (this.state.formMode) {
            case 'LOGIN':
                return <SigninForm changeFormType={this.changeFormType} />;

            case 'CREATE_ACCOUNT':
                return <SignupForm />;

            case 'FORGOT_PASSWORD':
                return <ForgotPasswordForm />;

            default:
                return <SigninForm />;
        }
    };

    /**
     * Render the component
     *
     * @return jsx
     */
    render() {
        const {isLogoDisplayed} = this.state;

        const {lang} = this.props;

        return (
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.outerContainer}
                    behaviour={Platform.select({
                        android: 'height',
                        ios: 'height'
                    })}
                    onLayout={this.onLayout}>
                    <ScrollView
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps={'handled'}>
                        <View style={styles.authContainer}>
                            {IS_PORTRAIT && isLogoDisplayed && (
                                <Image
                                    source={require('../../assets/logo/logo.png')}
                                    style={styles.logo}
                                />
                            )}
                            <View style={styles.contentContainer}>
                                {this.renderForm()}

                                {/* Main action button shared between all form types */}
                                <View style={styles.buttonContainer}>
                                    <View style={{flexDirection: 'row'}}>
                                        <View
                                            style={{
                                                backgroundColor: Colors.white,
                                                height: 1,
                                                flex: 1,
                                                alignSelf: 'center'
                                            }}
                                        />
                                        {/* ---- OR ---- */}
                                        <Body
                                            style={styles.divider}
                                            dictionary={`${lang}.auth.or`}
                                        />
                                        <View
                                            style={{
                                                backgroundColor: Colors.white,
                                                height: 1,
                                                flex: 1,
                                                alignSelf: 'center'
                                            }}
                                        />
                                    </View>
                                    <Pressable onPress={this.toggleFormMode}>
                                        <Body
                                            color="white"
                                            dictionary={this.getModeSwitchText()}
                                        />
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        );
    }
}

/**
 * #styles
 * Authentication Styles
 */
const styles = StyleSheet.create({
    outerContainer: {
        flex: 1
    },
    scrollContainer: {
        flexGrow: 1,
        flexDirection: 'column'
    },
    container: {
        flex: 1,
        backgroundColor: Colors.info
    },
    authContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    contentContainer: {
        flexDirection: 'column',
        padding: 20
    },

    logo: {
        height: SCREEN_HEIGHT / 4,
        resizeMode: 'contain',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH * 0.8,
        left: SCREEN_WIDTH * 0.1
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },

    divider: {
        color: Colors.white,
        alignSelf: 'center',
        paddingHorizontal: 5
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang
    };
};

// bind all action creators to AuthScreen
export default connect(mapStateToProps, actions)(AuthScreen);
