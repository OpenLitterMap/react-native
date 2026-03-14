import React, {useState, useEffect, useRef, FC} from 'react';
import {
    Animated,
    Dimensions,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StatusBar,
    StyleSheet,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch} from 'react-redux';
import {ForgotPasswordForm, SigninForm, SignupForm} from './authComponents';
import {loginOrSignupReset} from '../../reducers/auth_reducer';
import {Body, Caption, Colors} from '../components';

interface AuthScreenProps {
    route: any;
    navigation: any;
}

const AuthScreen: FC<AuthScreenProps> = ({route, navigation}) => {
    const [formMode, setFormMode] = useState(route.params.screen);
    const dispatch = useDispatch();

    // Animated logo height for smooth keyboard transition
    const logoHeight = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const showEvent =
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent =
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        const showListener = Keyboard.addListener(showEvent, () => {
            Animated.timing(logoHeight, {
                toValue: 0,
                duration: Platform.OS === 'ios' ? 250 : 150,
                useNativeDriver: false
            }).start();
        });

        const hideListener = Keyboard.addListener(hideEvent, () => {
            Animated.timing(logoHeight, {
                toValue: 1,
                duration: Platform.OS === 'ios' ? 250 : 150,
                useNativeDriver: false
            }).start();
        });

        const focusListener = navigation.addListener('focus', () => {
            dispatch(loginOrSignupReset());
        });

        return () => {
            showListener.remove();
            hideListener.remove();
            focusListener();
        };
    }, [navigation, dispatch, logoHeight]);

    const changeFormType = (screenType: 'login' | 'signup' | 'reset') => {
        dispatch(loginOrSignupReset());
        const modes = {
            login: 'LOGIN',
            signup: 'CREATE_ACCOUNT',
            reset: 'FORGOT_PASSWORD'
        };
        setFormMode(modes[screenType] || 'LOGIN');
    };

    const toggleFormMode = () => {
        if (formMode === 'LOGIN') {
            changeFormType('signup');
        } else {
            changeFormType('login');
        }
    };

    const toggleTexts: Record<string, string> = {
        CREATE_ACCOUNT: 'Already have an account?',
        LOGIN: 'Create Account',
        FORGOT_PASSWORD: 'Back to Login'
    };

    const formTitles: Record<string, string> = {
        CREATE_ACCOUNT: 'Create Account',
        LOGIN: 'Log In',
        FORGOT_PASSWORD: 'Forgot password?'
    };

    const renderForm = () => {
        if (formMode === 'LOGIN') {
            return <SigninForm changeFormType={changeFormType} />;
        }
        if (formMode === 'FORGOT_PASSWORD') {
            return <ForgotPasswordForm />;
        }
        return <SignupForm />;
    };

    const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

    const logoMaxHeight = screenHeight * 0.18;

    const animatedLogoHeight = logoHeight.interpolate({
        inputRange: [0, 1],
        outputRange: [0, logoMaxHeight]
    });

    const animatedLogoOpacity = logoHeight.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 0, 1]
    });

    return (
        <LinearGradient
            colors={['#1a6b3c', '#1b8a4a', '#27ae60', '#2ecc71']}
            locations={[0, 0.3, 0.7, 1]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradient}>
            <StatusBar
                barStyle="light-content"
                backgroundColor="transparent"
                translucent
            />
            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={0}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    bounces={false}>
                    <View style={styles.content}>
                        {/* Back button */}
                        <View style={styles.topBar}>
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={styles.backButton}
                                hitSlop={8}>
                                <Icon
                                    name="arrow-back"
                                    size={22}
                                    color={Colors.white}
                                />
                            </Pressable>
                        </View>

                        {/* Animated logo */}
                        <Animated.View
                            style={[
                                styles.logoContainer,
                                {
                                    height: animatedLogoHeight,
                                    opacity: animatedLogoOpacity
                                }
                            ]}>
                            <Image
                                source={require('../../assets/logo/logo.png')}
                                style={[
                                    styles.logo,
                                    {width: screenWidth * 0.55}
                                ]}
                            />
                        </Animated.View>

                        {/* Form card */}
                        <View style={styles.formCard}>
                            <Caption
                                color="muted"
                                family="semiBold"
                                style={styles.formLabel}
                                dictionary={formTitles[formMode] || ''}
                            />

                            {renderForm()}
                        </View>

                        {/* Divider + toggle */}
                        <View style={styles.dividerRow}>
                            <View style={styles.dividerLine} />
                            <Body
                                color="white"
                                style={styles.dividerText}
                                dictionary="or"
                            />
                            <View style={styles.dividerLine} />
                        </View>

                        <Pressable
                            onPress={toggleFormMode}
                            style={styles.toggleButton}>
                            <Body
                                color="white"
                                family="medium"
                                style={styles.toggleText}
                                dictionary={toggleTexts[formMode] || ''}
                            />
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    flex: {
        flex: 1
    },
    scrollContent: {
        flexGrow: 1
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 24,
        paddingBottom: Platform.OS === 'android' ? 32 : 16
    },
    topBar: {
        paddingTop: 8,
        paddingBottom: 8
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    logo: {
        resizeMode: 'contain',
        height: '100%'
    },
    formCard: {
        backgroundColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)'
    },
    formLabel: {
        fontSize: 12,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 16,
        textAlign: 'center'
    },
    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        paddingHorizontal: 8
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.25)'
    },
    dividerText: {
        paddingHorizontal: 12,
        fontSize: 14,
        opacity: 0.8
    },
    toggleButton: {
        alignItems: 'center',
        paddingVertical: 16
    },
    toggleText: {
        fontSize: 15
    }
});

export default AuthScreen;
