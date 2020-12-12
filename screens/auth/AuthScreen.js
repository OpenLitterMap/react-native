import React, { Component } from 'react'
import {
    ActivityIndicator,
    Dimensions,
    KeyboardAvoidingView,
    Keyboard,
    Platform,
    TouchableOpacity,
    ScrollView,
    Text,
    TextInput,
    Image,
    View
} from 'react-native'
import StyleSheet from 'react-native-extended-stylesheet'
import { Icon } from 'react-native-elements'

import { connect } from 'react-redux'
import Lodash from 'lodash'

import * as actions from '../../actions'
import COLORS from '../../utils/Colors'
import VALUES from '../../utils/Values'

let SCREEN_WIDTH = Dimensions.get('window').width
let SCREEN_HEIGHT = Dimensions.get('window').height
let IS_PORTRAIT = SCREEN_WIDTH <= SCREEN_HEIGHT

const formModes = {
    CREATE_ACCOUNT: 1,
    LOGIN: 2,
    FORGOT_PASSWORD: 3
}

// TODO need to refactor screen sizing variables to global
// TODO need to refactor validation regex functions to utils
// TODO encapsulate form inputs into a seperate ValidatedInput Component
class AuthScreen extends Component {

    constructor(props)
    {
        super(props);

        // using eslint disable for state that is used in getDerivedStateFromProps
        // https://github.com/yannickcr/eslint-plugin-react/issues/1759
        this.state = {
            email: '',
            password: '',
            username: '',
            formMode: formModes.CREATE_ACCOUNT,
            isFormReady: true,
            isShowingPassword: false,
            emailErrorMessage: null,
            passwordErrorMessage: null,
            usernameErrorMessage: null,
            buttonPressed: false,
            resetPwProcessing: false,
            serverStatusText: '',
            isLogoDisplayed: true
        };
    }

    /**
     *
     */
    componentDidUpdate (prevProps, prevState)
    {
        // if formMode changed, recheck validity
        if (prevState.formMode !== this.state.formMode)
        {
            // clear last server message
            this.setState({
                serverStatusText: ''
            });

            this.recheckFormValidity();

            // must revalidate password as rules are different for login vs creation
            if (
                this.state.buttonPressed &&
                (this.state.formMode === formModes.CREATE_ACCOUNT ||
                    this.state.formMode === formModes.LOGIN)
            ) {
                this.validatePassword(this.state.password);
            }
        }

        // if field error state has been updated, recheck validity of other fields
        if (
            prevState.emailErrorMessage !== this.state.emailErrorMessage ||
            prevState.passwordErrorMessage !== this.state.passwordErrorMessage ||
            prevState.usernameErrorMessage !== this.state.usernameErrorMessage
        ) {
            this.recheckFormValidity();
        }

        if (!Lodash.isEqual(prevProps.user, this.props.user)) {
            this.navigationToDashboard();
        }

        if (!Lodash.isEqual(prevProps.success, this.props.success)) {
            this.setState({ email: '', password: '' });
        }

        // if server status text changed
        if (prevProps.serverStatus !== this.props.serverStatus) {
            this.setState({
                serverStatusText: this.props.serverStatus
            });
        }

        // if just finished submitting, set server response messages
        if (
            prevProps.isSubmitting !== this.props.isSubmitting &&
            !this.props.isSubmitting
        ) {
            this.setState({
                formReady: true
            });
        }
    }

    updateSizeVariables = () => {
        SCREEN_WIDTH = Dimensions.get('window').width;
        SCREEN_HEIGHT = Dimensions.get('window').height;
        IS_PORTRAIT = SCREEN_WIDTH <= SCREEN_HEIGHT;

        StyleSheet.build({ $rem: SCREEN_WIDTH / VALUES.remDivisionFactor });
    };

    navigationToDashboard = () => {
        this.props.navigation.navigate('App');
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
    componentDidMount ()
    {
        this.updateSizeVariables();

        if (this.props.navigation.getParam('auth') === 'login') {
            this.setState({
                formMode: formModes.LOGIN
            });
        }

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

        this.focusListner = this.props.navigation.addListener('didFocus', () => {
            this.props.loginOrSignupReset();
        });
    }

    componentWillUnmount ()
    {
        this.focusListner.remove();
        this.keyboardWillShowSub.remove();
        this.keyboardWillHideSub.remove();
    }

    // Auth.js
    _resetPassword = async () => {
        // disable button & change text to spinner
        this.setState({
            resetPwProcessing: true,
            isFormReady: false
        });

        // send password request and respond
        let resp = await this.props.sendResetPasswordRequest(this.state.email);

        // respond if success, else show error message
        if (resp === true) {
            this.setState({
                resetPwProcessing: false,
                serverStatusText: 'Success! Check your email'
            });
        } else if (resp === 'user') {
            this.setState({
                resetPwProcessing: false,
                serverStatusText: 'This user does not exist'
            });
        } else {
            this.setState({
                resetPwProcessing: false,
                serverStatusText: 'Sorry, please try again'
            });
        }

        this.setState({
            isFormReady: true
        });
    };

    /**
     * Submit button execute..
     */
    submitButtonClick = () => {
        // the button has been pressed - first, we validate the inputs
        // if pass, send api request to create an account or log-in.
        // if fail, return error and disable the button until errors are cleared.
        // if fail, validate error on every text change.
        // re-enable button when no errors exist
        this.setState({
            buttonPressed: true,
            formReady: false,
            serverStatusText: ''
        });

        // Client side validation..
        let isValidClientSide = this.validateFields();

        if (isValidClientSide) {
            switch (this.state.formMode) {
                case formModes.CREATE_ACCOUNT: {
                    this.props.createAccount({
                        email: this.state.email,
                        username: this.state.username,
                        password: this.state.password
                    });
                    break;
                }
                case formModes.LOGIN: {
                    this.props.serverLogin({
                        email: this.state.email,
                        password: this.state.password
                    });
                    break;
                }
                case formModes.FORGOT_PASSWORD: {
                    this._resetPassword();
                    break;
                }
            }
        } else {
            // input is invalid, don't send anything to the server and disable the submit button
            this.setState({
                isFormReady: false
            });
        }
    };

    /**
     * Validate all showing input fields
     * @returns {boolean}
     */
    validateFields = () => {
        let isEveryFieldValid;

        // check email validity in every form mode
        isEveryFieldValid = this.validateEmail(this.state.email);

        // don't validate password if on forgot password mode
        if (this.state.formMode !== formModes.FORGOT_PASSWORD) {
            isEveryFieldValid =
                this.validatePassword(this.state.password) && isEveryFieldValid;
        }

        // only validate the username if on create account mode..
        if (this.state.formMode === formModes.CREATE_ACCOUNT) {
            isEveryFieldValid =
                this.validateUsername(this.state.username) && isEveryFieldValid;
        }

        return isEveryFieldValid;
    };

    /**
     * sets the error messages for invalid email
     * @returns {boolean}
     */
    validateEmail = email => {
        if (this.isEmailValid(email)) {
            this.setState({
                emailErrorMessage: null
            });
        } else {
            this.setState({
                emailErrorMessage:
                    email.trim() === ''
                        ? 'Please enter your email address!'
                        : 'This is not a valid email address!'
            });
            return false;
        }
        return true;
    };

    /**
     * sets the error messages for invalid password
     * @returns {boolean}
     */
    validatePassword = password => {
        let isEmpty = password.trim() === '';

        // check pw requirements in create acc mode, but only check if a pw was provided in login mode
        if (this.state.formMode === formModes.CREATE_ACCOUNT) {
            if (this.isPasswordValid(password)) {
                this.setState({
                    passwordErrorMessage: null
                });

                return true;
            } else {
                this.setState({
                    passwordErrorMessage: isEmpty
                        ? 'Please enter a password!'
                        : 'Must contain 1 uppercase, 1 digit, 6+ characters'
                });

                return false;
            }
        } else {
            this.setState({
                passwordErrorMessage: isEmpty ? 'Please enter a password!' : null
            });

            return !isEmpty;
        }
    };

    /**
     * sets the error messages for invalid username
     * @returns {boolean}
     */
    validateUsername = username => {
        if (this.isUsernameValid(username)) {
            this.setState({
                usernameErrorMessage: null
            });
        } else {
            this.setState({
                usernameErrorMessage:
                    username.trim() === ''
                        ? 'Please enter a username!'
                        : 'Must be alphanumeric, 8-20 characters, no spaces'
            });
            return false;
        }
        return true;
    };

    /**
     * Validate an Email
     */
    isEmailValid = email => {
        /*
          source: https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
        */
        let regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/;
        return regex.test(email);
    };

    /**
     * Validate a Password
     */
    isPasswordValid = password => {
        /*
          ^                         Start anchor
          (?=.*[A-Z])               Ensure string has 1 uppercase letters.
          (?=.*[0-9])               Ensure string has 1 digit.
          .{8,}                     Ensure string is of length 6 or more
          $                         End anchor.
          source: https://stackoverflow.com/questions/5142103/regex-to-validate-password-strength
         */
        let regex = /^(?=.*[A-Z])(?=.*[0-9]).{6,}$/;
        return regex.test(password);
    };

    /**
     * Validate a Username
     */
    isUsernameValid = username => {
        /*
          ^                         Start anchor
          \w+                       Alphanumeric including underscores and foreign language characters
          {8,20}                    Ensure string is between 8 and 20 chars long
          $                         End anchor.
          source: https://stackoverflow.com/questions/336210/regular-expression-for-alphanumeric-and-underscores
         */
        return username.length > 0 ? true : false;
        // let regex = /^\w{4,20}$/;
        // return regex.test(username);
    };

    /**
     * for confirming all validation issues have been fixed
     */
    recheckFormValidity() {
        const {
            emailErrorMessage,
            passwordErrorMessage,
            usernameErrorMessage
        } = this.state;

        let isValid = emailErrorMessage === null;

        if (isValid && this.state.formMode !== formModes.FORGOT_PASSWORD) {
            isValid = passwordErrorMessage === null;
        }

        if (isValid && this.state.formMode === formModes.CREATE_ACCOUNT) {
            isValid = usernameErrorMessage === null;
        }

        if (isValid) {
            this.setState({
                isFormReady: true
            });
        } else {
            this.setState({
                isFormReady: false
            });
        }
    }

    updateEmail = email => {
        email = email.trim().toLocaleLowerCase();
        this.setState({ email: email });

        // only check for errors if the login/signup button has been pressed
        if (this.state.buttonPressed) {
            this.validateEmail(email);
        }
    };

    updatePassword = password => {
        this.setState({ password: password });

        // only check for errors if the login/signup button has been pressed
        if (this.state.buttonPressed) {
            this.validatePassword(password);
        }
    };

    updateUsername = username => {
        username = username.trim();
        this.setState({ username: username });

        // only check for errors if the login/signup button has been pressed
        if (this.state.buttonPressed) {
            this.validateUsername(username);
        }
    };

    toggleFormMode = () => {
        this.props.loginOrSignupReset();

        let newMode;

        // determine what the toggle button does depending on the form mode
        if (this.state.formMode === formModes.LOGIN) {
            newMode = formModes.CREATE_ACCOUNT;
        } else {
            newMode = formModes.LOGIN;
        }

        this.setState({
            formMode: newMode
        });
    };

    forgotPassword = () => {
        this.setState({
            formMode: formModes.FORGOT_PASSWORD
        });
    };

    onLayout = () => {
        this.updateSizeVariables();

        this.forceUpdate();
    };

    getSubmitButtonText = () => {
        switch (this.state.formMode) {
            case formModes.CREATE_ACCOUNT:
                return 'Create Account';
            case formModes.LOGIN:
                return 'Log In';
            case formModes.FORGOT_PASSWORD:
                return 'Reset Password';
        }
    };

    getModeSwitchText = () => {
        switch (this.state.formMode) {
            case formModes.CREATE_ACCOUNT:
                return 'Already have an account?';
            case formModes.LOGIN:
                return 'Create Account';
            case formModes.FORGOT_PASSWORD:
                return 'Back to Login';
        }
    };

    /**
     * Render JSX
     */
    render() {
        const { isSubmitting } = this.props;

        const {
            email,
            password,
            username,
            formMode,
            isFormReady,
            isShowingPassword,
            emailErrorMessage,
            passwordErrorMessage,
            usernameErrorMessage,
            buttonPressed,
            resetPwProcessing,
            serverStatusText,
            isLogoDisplayed
        } = this.state;

        return (
            <View style={styles.container}>
                <KeyboardAvoidingView
                    style={styles.outerContainer}
                    behaviour={Platform.select({ android: 'height', ios: 'height' })}
                    onLayout={this.onLayout}>
                    <ScrollView
                        style={styles.scroll}
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
                                <View
                                    style={[
                                        styles.inputWrap,
                                        emailErrorMessage && styles.errorBorder
                                    ]}>
                                    <Icon
                                        iconStyle={styles.inputIcon}
                                        name="email"
                                        type="material"
                                        color={COLORS.iconGreyDisabled}
                                    />
                                    <TextInput
                                        autoFocus={false}
                                        autoCorrect={false}
                                        autoCapitalize={'none'}
                                        autoCompleteType={'off'}
                                        containerStyle={styles.formContainer}
                                        selectionColor={'#2c3e50'}
                                        onChangeText={this.updateEmail}
                                        placeholder="Email Address"
                                        placeholderTextColor="#ccc"
                                        style={styles.inputStyle}
                                        value={email}
                                    />
                                </View>
                                {emailErrorMessage !== null && emailErrorMessage !== undefined && (
                                    <View style={styles.errorWrap}>
                                        <Text style={styles.error}>
                                            {emailErrorMessage.toString()}
                                        </Text>
                                    </View>
                                )}

                                {formMode !== formModes.FORGOT_PASSWORD && (
                                    <>
                                        <View
                                            style={[
                                                styles.inputWrap,
                                                passwordErrorMessage && styles.errorBorder
                                            ]}>
                                            <Icon
                                                iconStyle={styles.inputIcon}
                                                type="material"
                                                name="vpn-key"
                                                color={COLORS.iconGreyDisabled}
                                            />
                                            <TextInput
                                                autoCorrect={false}
                                                autoCapitalize={'none'}
                                                containerStyle={styles.formContainer}
                                                onChangeText={this.updatePassword}
                                                placeholder="Password"
                                                placeholderTextColor="#ccc"
                                                selectionColor={'#2c3e50'}
                                                secureTextEntry={!isShowingPassword}
                                                style={styles.inputStyle}
                                                value={password}
                                            />
                                            <Icon
                                                iconStyle={styles.inputIcon}
                                                name={
                                                    isShowingPassword ? 'visibility' : 'visibility-off'
                                                }
                                                type="material"
                                                onPress={() => {
                                                    this.setState({
                                                        isShowingPassword: !isShowingPassword
                                                    });
                                                }}
                                                color={COLORS.iconGrey}
                                            />
                                        </View>
                                        {passwordErrorMessage !== null &&
                                        passwordErrorMessage !== undefined && (
                                            <View style={styles.errorWrap}>
                                                <Text style={styles.error}>
                                                    {passwordErrorMessage.toString()}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}

                                {formMode === formModes.LOGIN && (
                                    <Text style={styles.forgotPw} onPress={this.forgotPassword}>
                                        Forgot Password?
                                    </Text>
                                )}

                                {formMode === formModes.CREATE_ACCOUNT && (
                                    <>
                                        <View
                                            style={[
                                                styles.inputWrap,
                                                usernameErrorMessage && styles.errorBorder
                                            ]}>
                                            <Icon
                                                iconStyle={styles.inputIconAt}
                                                name="account-circle"
                                                type="material"
                                                size={22}
                                                color={COLORS.iconGreyDisabled}
                                            />
                                            <TextInput
                                                autoFocus={false}
                                                autoCorrect={false}
                                                autoCapitalize={'none'}
                                                containerStyle={styles.formContainer}
                                                placeholder="Unique Username"
                                                placeholderTextColor="#ccc"
                                                selectionColor={'#2c3e50'}
                                                style={styles.inputStyle}
                                                onChangeText={this.updateUsername}
                                                value={username}
                                            />
                                        </View>
                                        {usernameErrorMessage !== null &&
                                        usernameErrorMessage !== undefined && (
                                            <View style={styles.errorWrap}>
                                                <Text style={styles.error}>
                                                    {usernameErrorMessage}
                                                </Text>
                                            </View>
                                        )}
                                    </>
                                )}

                                {buttonPressed && (serverStatusText || isSubmitting) && (
                                    <View style={{ paddingTop: 5 }}>
                                        {isSubmitting ? (
                                            <ActivityIndicator color={COLORS.whiteText} />
                                        ) : (
                                            <Text
                                                style={{
                                                    textAlign: 'center',
                                                    color: COLORS.whiteText
                                                }}>
                                                {serverStatusText}
                                            </Text>
                                        )}
                                    </View>
                                )}

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        disabled={!isFormReady}
                                        onPress={this.submitButtonClick}
                                        style={[
                                            styles.submitButton,
                                            !isFormReady && styles.buttonDisabled,
                                            formMode === formModes.FORGOT_PASSWORD &&
                                            styles.resetButton
                                        ]}>
                                        {isSubmitting ? (
                                            <ActivityIndicator color={COLORS.whiteText} />
                                        ) : (
                                            <Text
                                                style={[
                                                    styles.authButtonText,
                                                    formMode === formModes.FORGOT_PASSWORD &&
                                                    styles.resetText
                                                ]}>
                                                {this.getSubmitButtonText()}
                                            </Text>
                                        )}
                                    </TouchableOpacity>

                                    <View style={{ flexDirection: 'row' }}>
                                        <View
                                            style={{
                                                backgroundColor: COLORS.whiteText,
                                                height: 1,
                                                flex: 1,
                                                alignSelf: 'center'
                                            }}
                                        />
                                        <Text style={styles.divider}>or</Text>
                                        <View
                                            style={{
                                                backgroundColor: COLORS.whiteText,
                                                height: 1,
                                                flex: 1,
                                                alignSelf: 'center'
                                            }}
                                        />
                                    </View>

                                    <Text style={styles.switch} onPress={this.toggleFormMode}>
                                        {this.getModeSwitchText()}
                                    </Text>
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
        flex: 1,
        alignItems: 'stretch'
    },
    scroll: {
        flex: 1,
        flexDirection: 'column'
    },
    scrollContainer: {
        flexGrow: 1,
        flexDirection: 'column'
    },
    authButtonText: {
        fontSize: SCREEN_HEIGHT * 0.025,
        fontWeight: 'bold',
        color: COLORS.positiveText
    },
    button: {
        backgroundColor: COLORS.neutralButton
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.authBackground
    },
    authContainer: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },
    contentContainer: {
        flexDirection: 'column',
        padding: SCREEN_WIDTH * 0.05
    },
    createAccountButton: {
        borderRadius: 6,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: SCREEN_HEIGHT * 0.02,
        width: SCREEN_WIDTH * 0.3
    },
    errorWrap: {
        flexDirection: 'row',
        justifyContent: 'center'
    },
    errorBorder: {
        borderWidth: 3,
        borderColor: COLORS.errorBackground
    },
    error: {
        color: COLORS.errorText,
        fontSize: '12rem',
        padding: '2rem',
        paddingLeft: '20rem',
        paddingRight: '20rem',
        backgroundColor: COLORS.errorBackground,
        borderBottomRightRadius: '10rem',
        borderBottomLeftRadius: '10rem',
        textAlign: 'center'
    },
    formContainer: {
        marginBottom: SCREEN_HEIGHT * 0.01,
        borderRadius: 6
    },
    forgotPw: {
        fontSize: '12rem',
        alignSelf: 'flex-end',
        marginRight: '8rem',
        marginTop: '8rem',
        color: COLORS.whiteText
    },
    submitButton: {
        alignItems: 'center',
        backgroundColor: COLORS.positiveButton,
        borderRadius: 6,
        height: SCREEN_HEIGHT * 0.075,
        opacity: 1,
        marginBottom: 10,
        justifyContent: 'center',
        width: '100%'
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold'
    },
    buttonDisabled: {
        opacity: 0.5
    },
    resetButton: {
        backgroundColor: COLORS.utilButton
    },
    resetText: {
        color: COLORS.utilText
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
        justifyContent: 'center',
        marginTop: '16rem'
    },
    inputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: '4rem',
        paddingBottom: '4rem',
        backgroundColor: 'white',
        borderRadius: 4,
        marginTop: '8rem'
    },
    inputStyle: {
        flex: 1,
        color: 'black',
        fontSize: '14rem',
        padding: 0,
        marginTop: '4rem',
        marginBottom: '4rem'
    },
    inputIcon: {
        padding: '8rem'
    },
    inputIconAt: {
        padding: '10rem'
    },
    divider: {
        fontSize: '16rem',
        color: COLORS.whiteText,
        alignSelf: 'center',
        paddingHorizontal: 5
    },
    switch: {
        fontSize: '16rem',
        padding: '8rem',
        color: COLORS.whiteText
    }
});

const mapStateToProps = state => {
    return {
        serverStatus: state.auth.serverStatus,
        success: state.auth.success,
        user: state.auth.user,
        username: state.auth.username,
        isSubmitting: state.auth.isSubmitting
    };
};

// bind all action creators to AuthScreen
export default connect(mapStateToProps, actions)(AuthScreen);
