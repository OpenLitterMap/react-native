import React, { Component } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';

import { Colors, SubTitle, CustomTextInput } from '../../components';

/**
 * Form field validation with keys for translation
 * using Yup for validation
 */
const ResetPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('email-not-valid')
        .required('enter-email')
});

class ResetPasswordForm extends Component {
    state = {
        isPasswordVisible: false
    };
    render() {
        // translation text
        const { lang } = this.props;
        const emailTranslation = getTranslation(`${lang}.auth.email-address`);

        return (
            <Formik
                initialValues={{ email: '' }}
                validationSchema={ResetPasswordSchema}
                onSubmit={values => console.log(values)}>
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

                        <Pressable
                            onPress={handleSubmit}
                            style={styles.buttonStyle}>
                            <SubTitle
                                color="accentLight"
                                dictionary={`${
                                    this.props.lang
                                }.auth.forgot-password`}>
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
        backgroundColor: Colors.warn,
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
    {}
)(ResetPasswordForm);
