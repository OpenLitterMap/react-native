import React, { Component } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { connect } from 'react-redux';
import { getTranslation } from 'react-native-translation';
import * as actions from '../../../actions';
import { Colors, SubTitle, CustomTextInput, Caption } from '../../components';
import { StatusMessage } from '.';

/**
 * Form field validation with keys for translation
 * using Yup for validation
 */
const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('email-not-valid')
        .required('enter-email')
});

class ForgotPasswordForm extends Component {
    state = {
        isPasswordVisible: false
    };
    render() {
        // translation text
        const { lang, serverStatusText, isSubmitting } = this.props;
        const emailTranslation = getTranslation(`${lang}.auth.email-address`);

        return (
            <Formik
                initialValues={{ email: '' }}
                validationSchema={ForgotPasswordSchema}
                onSubmit={values => {
                    this.props.sendResetPasswordRequest(values.email);
                }}>
                {({
                    handleSubmit,
                    setFieldValue,
                    values,
                    errors,
                    touched,
                    handleChange
                }) => (
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {/* email input */}
                        <CustomTextInput
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
                            keyboardType="email-address"
                            returnKeyType="done"
                            multiline
                        />
                        <StatusMessage
                            isSubmitting={isSubmitting}
                            serverStatusText={serverStatusText}
                        />

                        <Pressable
                            onPress={handleSubmit}
                            style={[styles.buttonStyle]}>
                            {isSubmitting ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <SubTitle
                                    color="accentLight"
                                    dictionary={`${
                                        this.props.lang
                                    }.auth.forgot-password`}>
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
    },
    buttonDisabled: {
        opacity: 0.5
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
    actions
)(ForgotPasswordForm);
