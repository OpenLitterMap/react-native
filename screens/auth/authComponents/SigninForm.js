import React, { Component } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';
import { userLogin } from '../../../actions';
import {
    Body,
    Caption,
    Colors,
    SubTitle,
    CustomTextInput
} from '../../components';
import StatusMessage from './StatusMessage';

/**
 * Form field validation with keys for translation
 * using Yup for validation
 */
const SigninSchema = Yup.object().shape({
    email: Yup.string()
        .email('email-not-valid')
        .required('enter-email'),
    password: Yup.string().required('enter-password')
});

class SigninForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isPasswordVisible: false
        };

        this.emailRef = React.createRef();
        this.passwordRef = React.createRef();
    }

    render() {
        // translation text
        const { lang, serverStatusText, isSubmitting } = this.props;

        const emailTranslation = getTranslation(`${lang}.auth.email-address`);
        const passwordTranslation = getTranslation(`${lang}.auth.password`);

        return (
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={SigninSchema}
                onSubmit={({ email, password }) => {
                    this.props.userLogin({
                        email,
                        password
                    });
                }}>
                {({
                    handleChange,
                    handleBlur,
                    setFieldValue,
                    handleSubmit,
                    values,
                    errors,
                    touched
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
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
                            // returnKeyType="next"
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
                        <Pressable
                            style={{ alignItems: 'flex-end' }}
                            onPress={() => this.props.changeFormType('reset')}>
                            <Body
                                color="white"
                                dictionary={`${lang}.auth.forgot-password`}
                            />
                        </Pressable>
                        <StatusMessage
                            isSubmitting={isSubmitting}
                            serverStatusText={serverStatusText}
                        />

                        <Pressable
                            disabled={isSubmitting}
                            onPress={handleSubmit}
                            style={[
                                styles.buttonStyle,
                                isSubmitting && styles.buttonDisabled
                            ]}>
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <SubTitle
                                    color="accentLight"
                                    dictionary={`${
                                        this.props.lang
                                    }.auth.login`}>
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
    },
    buttonDisabled: {
        opacity: 0.8
    }
});

const mapStateToProps = state => {
    return {
        lang: state.auth.lang,
        isSubmitting: state.auth.isSubmitting,
        serverStatusText: state.auth.serverStatusText
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    { userLogin }
)(SigninForm);
