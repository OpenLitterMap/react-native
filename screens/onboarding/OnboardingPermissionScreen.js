import React, {useEffect, useRef, useState} from 'react';
import {
    ActivityIndicator,
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
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import {
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions/cameraRollPermission';
import {
    checkCameraWithLocation,
    requestCameraWithLocation
} from '../../utils/permissions/cameraPermission';

/**
 * Onboarding permission screen — camera or gallery variant.
 *
 * Camera path requests location FIRST, then camera. Without location, camera
 * photos have no GPS and are useless for mapping. If location is denied,
 * we show a recovery screen before ever asking for camera.
 *
 * Gallery path requests photo library access as before.
 *
 * Both paths include cross-path fallback.
 */
const OnboardingPermissionScreen = ({navigation, route}) => {
    const {t} = useTranslation();
    const path = route.params?.path; // 'camera' | 'gallery'
    const isCamera = path === 'camera';
    const isMounted = useRef(true);

    // 'request' = show pre-permission screen
    // 'location_denied' = location denied, can't use camera
    // 'camera_denied' = camera denied (location was OK)
    // 'blocked' = one or both permissions blocked (need Settings)
    const [screenState, setScreenState] = useState('checking');

    useEffect(() => {
        (async () => {
            if (isCamera) {
                const {location, camera} = await checkCameraWithLocation();
                if (!isMounted.current) return;
                if (location === 'granted' && camera === 'granted') {
                    navigation.replace('ONBOARDING_CAMERA', {path});
                    return;
                } else if (location === 'blocked' || camera === 'blocked') {
                    setScreenState('blocked');
                    return;
                }
            } else {
                const status = await checkCameraRollPermission();
                if (!isMounted.current) return;
                if (status === 'granted' || status === 'limited') {
                    navigation.replace('ONBOARDING_PHOTO', {path});
                    return;
                } else if (status === 'blocked') {
                    setScreenState('blocked');
                    return;
                }
            }
            setScreenState('request');
        })();

        const handleAppState = (nextState) => {
            if (nextState === 'active') recheckPermission();
        };
        const sub = AppState.addEventListener('change', handleAppState);

        return () => {
            isMounted.current = false;
            sub.remove();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const recheckPermission = async () => {
        if (isCamera) {
            const {location, camera} = await checkCameraWithLocation();
            if (!isMounted.current) return;
            if (location === 'granted' && camera === 'granted') {
                navigation.replace('ONBOARDING_CAMERA', {path});
            } else if (location === 'blocked' || camera === 'blocked') {
                setScreenState('blocked');
            }
        } else {
            const status = await checkCameraRollPermission();
            if (!isMounted.current) return;
            if (status === 'granted' || status === 'limited') {
                navigation.replace('ONBOARDING_PHOTO', {path});
            } else if (status === 'blocked') {
                setScreenState('blocked');
            }
        }
    };

    const handleRequestPermission = async () => {
        if (isCamera) {
            const {location, camera} = await requestCameraWithLocation();
            if (!isMounted.current) return;

            if (location !== 'granted') {
                // Location denied — can't proceed with camera
                setScreenState(location === 'blocked' ? 'blocked' : 'location_denied');
                return;
            }
            if (camera === 'granted') {
                navigation.replace('ONBOARDING_CAMERA', {path});
            } else {
                setScreenState(camera === 'blocked' ? 'blocked' : 'camera_denied');
            }
        } else {
            const status = await requestCameraRollPermission();
            if (!isMounted.current) return;
            if (status === 'granted' || status === 'limited') {
                navigation.replace('ONBOARDING_PHOTO', {path});
            } else {
                setScreenState(status === 'blocked' ? 'blocked' : 'gallery_denied');
            }
        }
    };

    const openSettings = () => {
        Platform.OS === 'ios'
            ? Linking.openURL('app-settings:')
            : Linking.openSettings();
    };

    const switchPath = () => {
        const otherPath = isCamera ? 'gallery' : 'camera';
        navigation.replace('ONBOARDING_PERMISSION', {path: otherPath});
    };

    // --- Loading while checking permissions ---
    if (screenState === 'checking') {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} completedSteps={[]} />
                    <View style={styles.body}>
                        <ActivityIndicator size="large" color={Colors.accent} />
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // --- Denied / Blocked states ---
    if (screenState === 'blocked') {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} completedSteps={[]} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="lock-closed-outline" size={64} color={Colors.accent} />
                        </View>
                        <Title style={styles.title}>
                            {isCamera ? t('Camera & Location Access Required') : t('Gallery Access Required')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {isCamera
                                ? t('Camera and location access are needed to take GPS-tagged photos of litter. You can enable them in Settings.')
                                : t('Photo access is needed to upload litter photos with location data. You can enable it in Settings.')}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={openSettings}>
                            <Icon name="settings-outline" size={20} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Open Settings')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={switchPath} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {isCamera ? t('Choose from photos instead') : t('Take a photo instead')}
                            </Caption>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (screenState === 'location_denied') {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} completedSteps={[]} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="location-outline" size={64} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {t('Location Access Needed')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {t("Without location access, your photos won't have map coordinates. GPS data is what makes your contribution scientifically valuable.")}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={handleRequestPermission}>
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Try again')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={switchPath} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {t('Choose from photos instead')}
                            </Caption>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (screenState === 'camera_denied') {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} completedSteps={[]} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="camera-outline" size={64} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {t('Camera Access Needed')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {t('Camera access is needed to take photos of litter. You can try again or choose from your existing photos.')}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={handleRequestPermission}>
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Try again')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={switchPath} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {t('Choose from photos instead')}
                            </Caption>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    if (screenState === 'gallery_denied') {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} completedSteps={[]} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="images-outline" size={64} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {t('Gallery Access Needed')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {t('Photo access is needed to select litter photos. You can try again or take a new photo instead.')}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={handleRequestPermission}>
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Try again')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={switchPath} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {t('Take a photo instead')}
                            </Caption>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // --- Pre-permission request screen ---
    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StepIndicator currentStep={1} completedSteps={[]} />
                <View style={styles.body}>
                    <View style={styles.iconCircle}>
                        <Image
                            source={isCamera
                                ? require('../../assets/illustrations/camera_permission.png')
                                : require('../../assets/illustrations/gallery_permission.png')}
                            style={styles.imageStyle}
                        />
                    </View>
                    <Title style={styles.title}>
                        {isCamera
                            ? t('Camera & Location Access')
                            : t('Gallery Access')}
                    </Title>
                    <Body color="muted" style={styles.bodyText}>
                        {isCamera
                            ? t('Your photo will include GPS coordinates \u2014 this is what makes your data scientifically valuable. Only photos you take and choose to submit will be uploaded.')
                            : t('Your photos contain GPS data that tells us exactly where litter was found. Only photos you select will be uploaded \u2014 we never access your library without you choosing.')}
                    </Body>
                    <Pressable
                        style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                        onPress={handleRequestPermission}>
                        <Icon
                            name={isCamera ? 'camera-outline' : 'images-outline'}
                            size={20}
                            color={Colors.white}
                        />
                        <Body color="white" family="semiBold" style={styles.buttonText}>
                            {isCamera ? t('Allow camera & location') : t('Allow access')}
                        </Body>
                    </Pressable>
                    <Pressable onPress={switchPath} style={styles.secondaryLink}>
                        <Caption color="accent" family="medium">
                            {isCamera ? 'Choose from photos instead' : 'Take a photo instead'}
                        </Caption>
                    </Pressable>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    container: {
        flex: 1
    },
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    iconCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    imageStyle: {
        width: 150,
        height: 150,
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
        paddingHorizontal: 8
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

export default OnboardingPermissionScreen;
