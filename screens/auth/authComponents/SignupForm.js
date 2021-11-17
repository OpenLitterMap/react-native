import React, { Component } from 'react';
import { TextInput, View, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';

import { Body, Colors, SubTitle, CustomTextInput } from '../../components';

const SignupSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'Minimum 3 characters')
        .max(20, 'Maximum 20 characters')
        .required('Required'),
    email: Yup.string()
        .email('Invalid email')
        .required('Required'),
    password: Yup.string()
        .required('Required')
        .matches(/^(?=.*[A-Z])(?=.*[0-9]).{6,}$/, 'Paasword doesnt match')
});

class SignupForm extends Component {
    render() {
        // translation text
        const { lang } = this.props;

        const emailTranslation = getTranslation(`${lang}.auth.email-address`);
        const passwordTranslation = getTranslation(`${lang}.auth.password`);
        const usernameTranslation = getTranslation(
            `${lang}.auth.unique-username`
        );
        return (
            <Formik
                initialValues={{ email: '', password: '', username: '' }}
                validationSchema={SignupSchema}
                onSubmit={values => console.log('wow')}>
                {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    values,
                    errors,
                    touched
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {/* username input */}
                        <View
                            style={[
                                styles.textfieldContainer,
                                touched.username &&
                                    errors?.username &&
                                    styles.errorBorder
                            ]}>
                            <Icon
                                style={styles.textfieldIcon}
                                name="ios-person-circle"
                                size={28}
                                color={
                                    touched.username && errors?.username
                                        ? Colors.error
                                        : Colors.muted
                                }
                            />
                            <TextInput
                                style={[
                                    styles.input,
                                    touched.username &&
                                        errors.username &&
                                        styles.errorText
                                ]}
                                placeholder={usernameTranslation}
                                onChangeText={handleChange('username')}
                                value={values.username}
                                underlineColorAndroid="transparent"
                                name="username"
                            />
                        </View>
                        {touched.username && errors?.username && (
                            <Body>{errors.username}</Body>
                        )}

                        {/* email input */}
                        <CustomTextInput
                            onChangeText={handleChange('email')}
                            value={values.email}
                            name="email"
                            error={errors.email}
                            touched={touched.email}
                            placeholder={emailTranslation}
                            leftIconName="ios-mail"
                        />

                        {/* password input */}
                        <CustomTextInput
                            onChangeText={handleChange('password')}
                            value={values.password}
                            name="password"
                            error={errors.password}
                            touched={touched.password}
                            placeholder={passwordTranslation}
                            leftIconName="ios-key"
                            secureTextEntry
                        />

                        <Pressable
                            onPress={handleSubmit}
                            style={styles.buttonStyle}>
                            <SubTitle
                                color="accentLight"
                                dictionary={`${
                                    this.props.lang
                                }.auth.create-account`}>
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
    inputStyle: {
        height: 60,
        backgroundColor: 'white',
        borderRadius: 8,
        marginVertical: 10
    },
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
    textfieldContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        height: 60,
        borderRadius: 8,
        marginVertical: 10,
        borderWidth: 2,
        borderColor: Colors.white
    },
    textfieldIcon: {
        padding: 10
    },
    input: {
        flex: 1,
        paddingTop: 10,
        paddingRight: 10,
        paddingBottom: 10,
        paddingLeft: 0,
        backgroundColor: '#fff',
        color: '#424242'
    },
    errorBorder: {
        borderColor: Colors.error
    },
    errorText: {
        color: Colors.error
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
    {}
)(SignupForm);
