import React, {useState, useRef, useEffect} from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {Formik} from 'formik';
import * as Yup from 'yup';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {clearStatusText, userLogin} from '../../../reducers/auth_reducer';
import {Colors, CustomTextInput, Body} from '../../components';

const SigninSchema = Yup.object().shape({
    login: Yup.string().required('Please enter your email or username'),
    password: Yup.string().required('Please enter a password')
});

const SigninFormInner = ({
    setFieldValue,
    handleSubmit,
    values,
    errors,
    touched,
    changeFormType,
    isPasswordVisible,
    handlePasswordVisibility,
    hasSubmitted,
    setHasSubmitted
}) => {
    const dispatch = useDispatch();
    const {serverStatusText, submitStatus} = useSelector(state => state.auth);
    const isSubmitting = submitStatus === 'loading';

    const loginRef = useRef(null);
    const passwordRef = useRef(null);

    const {t} = useTranslation();
    const loginTranslation = t('Email or Username');
    const passwordTranslation = t('Password');

    // Clear server error when user starts editing after a failed submit
    const prevSubmittedRef = useRef(false);
    useEffect(() => {
        if (prevSubmittedRef.current && serverStatusText) {
            dispatch(clearStatusText());
        }
    }, [values.login, values.password]); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        prevSubmittedRef.current = hasSubmitted;
    }, [hasSubmitted]);

    const handleFormSubmit = () => {
        setHasSubmitted(true);
        handleSubmit();
    };

    const showLoginError = hasSubmitted && touched?.login && errors?.login;
    const showPasswordError =
        hasSubmitted && touched?.password && errors?.password;

    const isCredentialError = /credential|incorrect|invalid|unauthorized/i.test(
        serverStatusText
    );
    let serverMessage = '';
    if (serverStatusText !== '') {
        serverMessage = isCredentialError
            ? t('The login details are incorrect')
            : serverStatusText;
    }

    return (
        <View>
            <CustomTextInput
                ref={loginRef}
                style={styles.inputSpacing}
                onSubmitEditing={() => passwordRef?.current?.focus()}
                onChangeText={e => setFieldValue('login', e.trim())}
                value={values.login}
                name="login"
                error={showLoginError ? errors.login : undefined}
                errorText={
                    showLoginError ? t(errors.login) : undefined
                }
                touched={hasSubmitted ? touched?.login : false}
                placeholder={loginTranslation}
                leftIconName="person-outline"
                returnKeyType="next"
                variant="dark"
            />

            <CustomTextInput
                ref={passwordRef}
                style={styles.inputSpacing}
                onChangeText={e => setFieldValue('password', e)}
                value={values.password}
                name="password"
                error={showPasswordError ? errors.password : undefined}
                errorText={
                    showPasswordError ? t(errors.password) : undefined
                }
                touched={hasSubmitted ? touched?.password : false}
                placeholder={passwordTranslation}
                leftIconName="lock-closed-outline"
                secureTextEntry={!isPasswordVisible}
                returnKeyType="done"
                variant="dark"
                rightContent={
                    <Pressable
                        onPress={handlePasswordVisibility}
                        style={styles.eyeButton}>
                        <Icon
                            name={isPasswordVisible ? 'eye' : 'eye-off'}
                            size={22}
                            color="rgba(255,255,255,0.5)"
                        />
                    </Pressable>
                }
            />

            <Pressable
                style={styles.forgotRow}
                onPress={() => changeFormType('reset')}>
                <Body
                    color="white"
                    family="medium"
                    dictionary="Forgot password?"
                    style={styles.forgotText}
                />
            </Pressable>

            {serverMessage !== '' && (
                <View style={styles.serverError}>
                    <Icon
                        name="alert-circle-outline"
                        size={16}
                        color="#ff8a80"
                    />
                    <Text style={styles.serverErrorText}>{serverMessage}</Text>
                </View>
            )}

            <Pressable
                disabled={isSubmitting}
                onPress={handleFormSubmit}
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
                        dictionary="Log In"
                        style={styles.buttonText}
                    />
                )}
            </Pressable>
        </View>
    );
};

const SigninForm = ({changeFormType}) => {
    const dispatch = useDispatch();

    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const handlePasswordVisibility = () => setIsPasswordVisible(prev => !prev);

    return (
        <Formik
            initialValues={{login: '', password: ''}}
            validationSchema={SigninSchema}
            onSubmit={({login, password}) => {
                dispatch(userLogin({login, password}));
            }}>
            {formikProps => (
                <SigninFormInner
                    {...formikProps}
                    changeFormType={changeFormType}
                    isPasswordVisible={isPasswordVisible}
                    handlePasswordVisibility={handlePasswordVisibility}
                    hasSubmitted={hasSubmitted}
                    setHasSubmitted={setHasSubmitted}
                />
            )}
        </Formik>
    );
};

const styles = StyleSheet.create({
    inputSpacing: {
        marginBottom: 12
    },
    eyeButton: {
        paddingHorizontal: 12,
        paddingVertical: 8
    },
    forgotRow: {
        alignItems: 'flex-end',
        marginBottom: 4
    },
    forgotText: {
        fontSize: 14,
        opacity: 0.8
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

export default SigninForm;
