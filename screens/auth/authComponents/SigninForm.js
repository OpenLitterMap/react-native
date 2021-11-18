import React, { Component } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';
import { serverLogin } from '../../../actions';
import { Body, Colors, SubTitle, CustomTextInput } from '../../components';

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
    state = {
        isPasswordVisible: false
    };
    render() {
        // translation text
        const { lang } = this.props;

        const emailTranslation = getTranslation(`${lang}.auth.email-address`);
        const passwordTranslation = getTranslation(`${lang}.auth.password`);

        return (
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={SigninSchema}
                onSubmit={({ email, password }) => {
                    console.log(email, password);
                    const data = serverLogin({
                        email,
                        password
                    });
                }}>
                {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {/* email input */}
                        <CustomTextInput
                            onChangeText={handleChange('email')}
                            value={values.email}
                            name="email"
                            error={
                                errors.email &&
                                `${this.props.lang}.auth.${errors.email}`
                            }
                            touched={touched.email}
                            placeholder={emailTranslation}
                            leftIconName="ios-mail"
                        />

                        {/* password input */}
                        <CustomTextInput
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

                        <Pressable
                            onPress={handleSubmit}
                            style={styles.buttonStyle}>
                            <SubTitle
                                color="accentLight"
                                dictionary={`${this.props.lang}.auth.login`}>
                                Create Account
                            </SubTitle>
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
        isSubmitting: state.auth.isSubmitting
    };
};

// bind all action creators to AuthScreen
export default connect(
    mapStateToProps,
    {}
)(SigninForm);
