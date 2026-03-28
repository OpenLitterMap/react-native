import React, {useEffect, useRef, useState} from 'react';
import {
    AppState,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors, Title} from '../components';
import {
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions';

const GalleryPermissionScreen = ({navigation, route}) => {
    const isMounted = useRef(true);

    // When blocked=true, permission was previously denied — native dialog won't
    // appear again. Show the "blocked" UI with a Settings link immediately.
    const blocked = route.params?.blocked;
    const [denied, setDenied] = useState(blocked === true);

    useEffect(() => {
        if (!blocked) {
            // Check if permission was granted while we were navigating here
            checkGalleryPermission();
        }

        const handleAppStateChange = nextAppState => {
            if (
                AppState.currentState?.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                checkGalleryPermission();
            }
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange
        );

        return () => {
            isMounted.current = false;
            subscription.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dismiss the PERMISSION modal, returning to HomeScreen.
    // HomeScreen re-checks permission on mount, so it will pick up the grant.
    const dismissToHome = () => {
        navigation.getParent()?.navigate('APP');
    };

    const checkGalleryPermission = async () => {
        const result = await checkCameraRollPermission();

        if (!isMounted.current) return;

        if (result === 'granted' || result === 'limited') {
            dismissToHome();
        } else if (result === 'blocked') {
            setDenied(true);
        }
    };

    const requestGalleryPermission = async () => {
        const result = await requestCameraRollPermission();

        if (result === 'granted' || result === 'limited') {
            dismissToHome();
        } else if (result === 'blocked') {
            // Native dialog was shown and user denied — now blocked, must use Settings
            setDenied(true);
        }
        // If result is 'denied' (not blocked), stay on this screen —
        // user can tap Continue again to retry the native dialog
    };

    const openSettings = () => {
        Platform.OS === 'ios'
            ? Linking.openURL('app-settings:')
            : Linking.openSettings();
    };

    if (denied) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <View style={styles.iconCircle}>
                        <Icon
                            name="lock-closed-outline"
                            size={64}
                            color={Colors.accent}
                        />
                    </View>

                    <Title
                        style={styles.title}
                        dictionary="Gallery Access Required"
                    />

                    <Body
                        color="muted"
                        style={styles.bodyText}
                        dictionary="Photo access is needed to upload litter photos with location data. You can enable it in Settings."
                    />

                    <Pressable
                        style={({pressed}) => [
                            styles.buttonStyle,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={openSettings}>
                        <Icon
                            name="settings-outline"
                            size={20}
                            color={Colors.white}
                        />
                        <Body
                            color="white"
                            family="semiBold"
                            dictionary="Open Settings"
                            style={styles.buttonText}
                        />
                    </Pressable>

                    <Pressable
                        onPress={dismissToHome}
                        style={styles.secondaryLink}>
                        <Caption
                            color="muted"
                            family="medium"
                            dictionary="Go Back"
                        />
                    </Pressable>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.iconCircle}>
                    <Image
                        source={require('../../assets/illustrations/gallery_permission.png')}
                        style={styles.imageStyle}
                    />
                </View>

                <Title
                    style={styles.title}
                    dictionary="Gallery Access"
                />

                <Body
                    color="muted"
                    style={styles.bodyText}
                    dictionary="We need access to your photo library to find photos with location data. This lets you tag and upload litter you've photographed."
                />

                <Pressable
                    style={({pressed}) => [
                        styles.buttonStyle,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={requestGalleryPermission}>
                    <Icon
                        name="images-outline"
                        size={20}
                        color={Colors.white}
                    />
                    <Body
                        color="white"
                        family="semiBold"
                        dictionary="Continue"
                        style={styles.buttonText}
                    />
                </Pressable>

                <Pressable
                    onPress={dismissToHome}
                    style={styles.secondaryLink}>
                    <Caption
                        color="muted"
                        family="medium"
                        dictionary="Not Now"
                    />
                </Pressable>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: 32
    },
    iconCircle: {
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    imageStyle: {
        width: 180,
        height: 180,
        resizeMode: 'contain'
    },
    title: {
        textAlign: 'center',
        marginBottom: 12
    },
    bodyText: {
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 16
    },
    buttonStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 32,
        height: 52,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        shadowColor: Colors.accent,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonPressed: {
        backgroundColor: '#229954',
        shadowOpacity: 0.15
    },
    buttonText: {
        fontSize: 16
    },
    secondaryLink: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24
    }
});

export default GalleryPermissionScreen;
