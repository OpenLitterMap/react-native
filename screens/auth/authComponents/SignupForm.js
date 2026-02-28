import React, {useRef, useState} from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {createAccount} from '../../../reducers/auth_reducer';
import {useDispatch, useSelector} from 'react-redux';
import {Colors, CustomTextInput, Body} from '../../components';

const SignupSchema = Yup.object().shape({
    email: Yup.string().email('email-not-valid').required('enter-email'),
    password: Yup.string().required('enter-password').min(6, 'must-contain')
});

const PasswordStrength = ({password}) => {
    if (!password) {
        return null;
    }

    let strength = 0;
    if (password.length >= 3) {
        strength++;
    }
    if (password.length >= 6) {
        strength++;
    }
    if (/[A-Z]/.test(password) || /[0-9]/.test(password)) {
        strength++;
    }
    if (password.length >= 10) {
        strength++;
    }

    const colors = ['#ff8800', '#ffbb00', Colors.accent, Colors.accent];
    const labels = ['Short', 'OK', 'Good', 'Strong'];
    const color = colors[strength - 1] || colors[0];
    const label = labels[strength - 1] || labels[0];

    return (
        <View style={strengthStyles.container}>
            <View style={strengthStyles.barTrack}>
                {[0, 1, 2, 3].map(i => (
                    <View
                        key={i}
                        style={[
                            strengthStyles.barSegment,
                            {
                                backgroundColor:
                                    i < strength
                                        ? color
                                        : 'rgba(255,255,255,0.15)'
                            }
                        ]}
                    />
                ))}
            </View>
            <Text style={[strengthStyles.label, {color}]}>{label}</Text>
        </View>
    );
};

const SignupForm = () => {
    const dispatch = useDispatch();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const {serverStatusText, isSubmitting} = useSelector(state => state.auth);

    const {t} = useTranslation();
    const emailTranslation = t('auth.email-address');
    const passwordTranslation = t('auth.password');

    return (
        <Formik
            initialValues={{email: '', password: ''}}
            validationSchema={SignupSchema}
            onSubmit={({email, password}) => {
                dispatch(
                    createAccount({
                        email: email.trim().toLowerCase(),
                        password
                    })
                );
            }}>
            {({setFieldValue, handleSubmit, values, errors, touched}) => (
                <View>
                    <CustomTextInput
                        ref={emailRef}
                        style={styles.inputSpacing}
                        onSubmitEditing={() => passwordRef?.current?.focus()}
                        onChangeText={e => setFieldValue('email', e.trim())}
                        value={values.email}
                        name="email"
                        error={errors?.email}
                        errorText={
                            errors?.email
                                ? t(`auth.${errors.email}`)
                                : undefined
                        }
                        touched={touched?.email}
                        placeholder={emailTranslation}
                        leftIconName="mail-outline"
                        returnKeyType="next"
                        keyboardType="email-address"
                        variant="dark"
                    />

                    <CustomTextInput
                        ref={passwordRef}
                        style={styles.inputSpacing}
                        onChangeText={e => setFieldValue('password', e)}
                        value={values.password}
                        name="password"
                        error={errors?.password}
                        errorText={
                            errors?.password
                                ? t(`auth.${errors.password}`)
                                : undefined
                        }
                        touched={touched?.password}
                        placeholder={passwordTranslation}
                        leftIconName="lock-closed-outline"
                        secureTextEntry={!isPasswordVisible}
                        returnKeyType="done"
                        variant="dark"
                        rightContent={
                            <Pressable
                                onPress={() =>
                                    setIsPasswordVisible(prev => !prev)
                                }
                                style={styles.eyeButton}>
                                <Icon
                                    name={isPasswordVisible ? 'eye' : 'eye-off'}
                                    size={22}
                                    color="rgba(255,255,255,0.5)"
                                />
                            </Pressable>
                        }
                    />

                    <PasswordStrength password={values.password} />

                    {serverStatusText !== '' && (
                        <View style={styles.serverError}>
                            <Icon
                                name="alert-circle-outline"
                                size={16}
                                color="#ff8a80"
                            />
                            <Text style={styles.serverErrorText}>
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
                                dictionary="auth.create-account"
                                style={styles.buttonText}
                            />
                        )}
                    </Pressable>
                </View>
            )}
        </Formik>
    );
};

const strengthStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
    },
    barTrack: {
        flex: 1,
        flexDirection: 'row',
        gap: 4
    },
    barSegment: {
        flex: 1,
        height: 3,
        borderRadius: 2
    },
    label: {
        fontSize: 11,
        fontFamily: 'Poppins-Medium',
        letterSpacing: 0.3
    }
});

const styles = StyleSheet.create({
    inputSpacing: {
        marginBottom: 12
    },
    eyeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    serverError: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 4,
        marginTop: 8,
        marginBottom: 4
    },
    serverErrorText: {
        color: '#ff8a80',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        marginLeft: 6,
        letterSpacing: 0.3
    },
    buttonStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.white,
        borderRadius: 100,
        height: 52,
        marginTop: 16
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
    }
});

export default SignupForm;
