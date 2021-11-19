import React, { Component } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';
import { createAccount } from '../../../actions';

import { Colors, SubTitle, CustomTextInput } from '../../components';
import StatusMessage from './StatusMessage';

/**
 * Form field validation with keys for translation
 * using Yup for validation
 */
const SignupSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'username-min-max')
        .max(20, 'username-min-max')
        .required('enter-username'),
    email: Yup.string()
        .email('email-not-valid')
        .required('enter-email'),
    password: Yup.string()
        .required('enter-password')
        .matches(/^(?=.*[A-Z])(?=.*[0-9]).{6,}$/, 'must-contain')
});

class SignupForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isPasswordVisible: false
        };
        this.usernameRef = React.createRef();
        this.emailRef = React.createRef();
        this.passwordRef = React.createRef();
    }

    render() {
        // translation text
        const { lang, isSubmitting, serverStatusText } = this.props;

        const emailTranslation = getTranslation(`${lang}.auth.email-address`);
        const passwordTranslation = getTranslation(`${lang}.auth.password`);
        const usernameTranslation = getTranslation(
            `${lang}.auth.unique-username`
        );
        return (
            <Formik
                initialValues={{ email: '', password: '', username: '' }}
                validationSchema={SignupSchema}
                onSubmit={({ email, password, username }) => {
                    this.props.createAccount({
                        email: email,
                        username: username,
                        password: password
                    });
                }}>
                {({
                    handleChange,
                    setFieldValue,
                    handleSubmit,
                    values,
                    errors,
                    touched
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {/* username input */}

                        <CustomTextInput
                            ref={this.usernameRef}
                            onSubmitEditing={() =>
                                this.emailRef.current.focus()
                            }
                            onChangeText={handleChange('username')}
                            value={values.username}
                            name="username"
                            error={
                                errors.username &&
                                `${this.props.lang}.auth.${errors.username}`
                            }
                            touched={touched.username}
                            placeholder={usernameTranslation}
                            leftIconName="ios-person-circle"
                            returnKeyType="next"
                        />

                        {/* email input */}
                        <CustomTextInput
                            ref={this.emailRef}
                            onSubmitEditing={() =>
                                this.passwordRef.current.focus()
                            }
                            onChangeText={e =>
                                setFieldValue(
                                    'email',
                                    e.trim().toLocaleLowerCase()
                                )
                            }
                            value={values.email}
                            name="email"
                            error={
                                errors.email &&
                                `${this.props.lang}.auth.${errors.email}`
                            }
                            touched={touched.email}
                            placeholder={emailTranslation}
                            leftIconName="ios-mail"
                            returnKeyType="next"
                            keyboardType="email-address"
                            multiline
                        />

                        {/* password input */}
                        <CustomTextInput
                            ref={this.passwordRef}
                            onChangeText={handleChange('password')}
                            value={values.password}
                            name="password"
                            error={
                                errors.password &&
                                `${this.props.lang}.auth.${errors.password}`
                            }
                            touched={touched.password}
                            placeholder={passwordTranslation}
                            leftIconName="ios-key"
                            secureTextEntry={!this.state.isPasswordVisible}
                            returnKeyType="done"
                            // eye icon --> display/hide
                            rightContent={
                                <Pressable
                                    onPress={() =>
                                        this.setState(prevState => ({
                                            isPasswordVisible: !prevState.isPasswordVisible
                                        }))
                                    }>
                                    <Icon
                                        style={styles.textfieldIcon}
                                        name={
                                            this.state.isPasswordVisible
                                                ? 'ios-eye'
                                                : 'ios-eye-off'
                                        }
                                        size={28}
                                        color={Colors.muted}
                                    />
                                </Pressable>
                            }
                        />
                        <StatusMessage
                            isSubmitting={isSubmitting}
                            serverStatusText={serverStatusText}
                        />

                        <Pressable
                            disabled={isSubmitting}
                            onPress={handleSubmit}
                            style={styles.buttonStyle}>
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <SubTitle
                                    color="accentLight"
                                    dictionary={`${
                                        this.props.lang
                                    }.auth.create-account`}>
                                    Create Account
                                </SubTitle>
                            )}
                        </Pressable>
                    </View>
                )}
            </Formik>
        );
    }
}

const styles = StyleSheet.create({
    buttonStyle: {
        alignItems: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 6,
        height: 60,
        opacity: 1,
        marginBottom: 10,
        justifyContent: 'center',
        width: '100%',
        marginTop: 20
    },
    textfieldIcon: {
        padding: 10
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        serverStatusText: state.auth.serverStatusText,
        success: state.auth.success,
        user: state.auth.user,
        username: state.auth.username,
        isSubmitting: state.auth.isSubmitting
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    { createAccount }
)(SignupForm);
