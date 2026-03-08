import React from 'react';
import {
    View,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Text
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import {Colors, Body, CustomTextInput} from '../../components';
import {sendResetPasswordRequest} from '../../../reducers/auth_reducer';

const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string().email('This is not a valid email address').required('Please enter an email address')
});

const ForgotPasswordForm = () => {
    const dispatch = useDispatch();

    const {serverStatusText, isSubmitting} = useSelector(state => state.auth);

    const {t} = useTranslation();
    const emailTranslation = t('Email Address');

    return (
        <Formik
            initialValues={{email: ''}}
            validationSchema={ForgotPasswordSchema}
            onSubmit={values => {
                dispatch(
                    sendResetPasswordRequest(values.email.trim().toLowerCase())
                );
            }}>
            {({handleSubmit, setFieldValue, values, errors, touched}) => (
                <View>
                    <CustomTextInput
                        onChangeText={e => setFieldValue('email', e.trim())}
                        value={values.email}
                        name="email"
                        error={errors?.email}
                        errorText={
                            errors?.email
                                ? t(errors.email)
                                : undefined
                        }
                        touched={touched?.email}
                        placeholder={emailTranslation}
                        leftIconName="mail-outline"
                        keyboardType="email-address"
                        returnKeyType="done"
                        variant="dark"
                    />

                    {serverStatusText !== '' && (
                        <View style={styles.serverMessage}>
                            <Icon
                                name="checkmark-circle-outline"
                                size={16}
                                color={Colors.accentLight}
                            />
                            <Text style={styles.serverMessageText}>
                                {serverStatusText}
                            </Text>
                        </View>
                    )}

                    <Pressable
                        disabled={isSubmitting}
                        onPress={handleSubmit}
                        style={({pressed}) => [
                            styles.buttonStyle,
                            isSubmitting && styles.buttonDisabled,
                            pressed && !isSubmitting && styles.buttonPressed
                        ]}>
                        {isSubmitting ? (
                            <ActivityIndicator color={Colors.accent} />
                        ) : (
                            <Body
                                color="accent"
                                family="semiBold"
                                style={styles.buttonText}
                                dictionary="Send Reset Link"
                            />
                        )}
                    </Pressable>
                </View>
            )}
        </Formik>
    );
};

const styles = StyleSheet.create({
    buttonStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: 100,
        height: 52,
        marginTop: 20
    },
    buttonPressed: {
        backgroundColor: '#f0f0f0'
    },
    buttonDisabled: {
        opacity: 0.7
    },
    buttonText: {
        fontSize: 16,
        letterSpacing: 0.3
    },
    serverMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        marginTop: 12
    },
    serverMessageText: {
        color: Colors.accentLight,
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        marginLeft: 6,
        letterSpacing: 0.3
    }
});

export default ForgotPasswordForm;
