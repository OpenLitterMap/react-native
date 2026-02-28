import React, {useEffect} from 'react';
import {
    AppState,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors, Title} from '../components';
import {
    checkAccessMediaLocation,
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions';
import * as Sentry from '@sentry/react-native';

const GalleryPermissionScreen = ({navigation}) => {
    useEffect(() => {
        const handleAppStateChange = nextAppState => {
            if (
                AppState.currentState.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                checkGalleryPermission();
            }
        };

        const subscription = AppState.addEventListener(
            'change',
            handleAppStateChange
        );

        return () => subscription.remove();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkGalleryPermission = async () => {
        const result = await checkCameraRollPermission();

        if (result.toLowerCase() === 'granted') {
            navigation.navigate('HOME');
        } else {
            Sentry.captureException(
                new Error(`Gallery Permission Error ${result}`),
                {
                    level: 'error',
                    tags: {
                        section: 'checkGalleryPermission',
                        result
                    }
                }
            );
        }
    };

    const requestGalleryPermission = async () => {
        const result = await requestCameraRollPermission();

        if (result === 'granted' || result === 'limited') {
            if (Platform.OS === 'android' && Platform.Version >= 33) {
                const accessMediaLocation = await checkAccessMediaLocation();
                if (__DEV__) {
                    console.log(
                        'GalleryPermissionScreen.accessMediaLocation',
                        accessMediaLocation
                    );
                }
            }

            navigation.navigate('HOME');
        } else {
            Sentry.captureException(
                new Error(`Gallery Permission Error ${result}`),
                {
                    level: 'error',
                    tags: {
                        section: 'requestGalleryPermission',
                        platform: Platform.OS
                    }
                }
            );

            Platform.OS === 'ios'
                ? await Linking.openURL('app-settings:')
                : await Linking.openSettings();
        }
    };

    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}>
            <View style={styles.container}>
                <View style={styles.iconCircle}>
                    <Image
                        source={require('../../assets/illustrations/gallery_permission.png')}
                        style={styles.imageStyle}
                    />
                </View>

                <Title
                    style={styles.title}
                    dictionary="permission.allow-gallery-access"
                />

                <Body
                    color="muted"
                    style={styles.bodyText}
                    dictionary="permission.gallery-body">
                    Please provide us access to your gallery, which is required
                    if you want to upload geotagged images from gallery.
                </Body>

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
                        dictionary="permission.allow-gallery-access"
                        style={styles.buttonText}
                    />
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate('HOME')}
                    style={styles.skipButton}>
                    <Caption
                        color="muted"
                        family="medium"
                        dictionary="permission.not-now"
                    />
                </Pressable>
            </View>
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
    skipButton: {
        marginTop: 20,
        paddingVertical: 12,
        paddingHorizontal: 24
    }
});

export default GalleryPermissionScreen;
