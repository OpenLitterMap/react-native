import React, {useCallback, useState} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {SafeAreaView, useSafeAreaInsets} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import CameraCapture from '../camera/CameraCapture';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import {isValidGpsCoords} from '../../utils/gps';
import {addOnboardingPhoto} from '../../reducers/photos_reducer';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {setOnboardingComplete} from '../../utils/onboarding';

/**
 * Onboarding camera screen — thin wrapper around CameraCapture.
 * Rejects photos without GPS. Shows fallback if GPS is missing.
 */
const OnboardingCameraScreen = ({navigation}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const insets = useSafeAreaInsets();
    const userId = useSelector(state => state.auth.user?.id);
    const [noGps, setNoGps] = useState(false);

    const handleSkip = useCallback(async () => {
        await setOnboardingComplete(userId);
        dispatch(markOnboardingComplete());
    }, [dispatch, userId]);

    const handlePhotoAccepted = useCallback((preview) => {
        if (!isValidGpsCoords(preview.lat, preview.lon)) {
            setNoGps(true);
            return;
        }

        dispatch(addOnboardingPhoto({
            uri: preview.uri,
            filename: `onboarding_${Date.now()}.jpg`,
            lat: preview.lat,
            lon: preview.lon,
            width: preview.width,
            height: preview.height,
            type: 'image/jpeg'
        }));
        navigation.replace('ONBOARDING_TAG');
    }, [dispatch, navigation]);

    const handleCancel = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    const handleRetryCamera = useCallback(() => {
        setNoGps(false);
    }, []);

    const switchToGallery = () => {
        navigation.replace('ONBOARDING_PERMISSION', {path: 'gallery'});
    };

    if (noGps) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} step1Label="Take photo" />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="location-outline" size={56} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {t('Photo captured without GPS')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {t('Make sure location services are enabled for OpenLitterMap, then try again.')}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={handleRetryCamera}>
                            <Icon name="camera-outline" size={20} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Try again')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={switchToGallery} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {t('Choose from photos instead')}
                            </Caption>
                        </Pressable>
                        <Pressable onPress={handleSkip} style={styles.skipLink}>
                            <Caption color="muted">
                                {t('Skip for now')}
                            </Caption>
                        </Pressable>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    const topOverlay = (
        <SafeAreaView edges={['top']} style={styles.cameraTopOverlay}>
            <StepIndicator currentStep={1} step1Label="Take photo" />
        </SafeAreaView>
    );

    return (
        <CameraCapture
            onPhotoAccepted={handlePhotoAccepted}
            onCancel={handleCancel}
            hintText={t('Get close to some litter and capture the object in full view')}
            topOverlay={topOverlay}
        />
    );
};

const styles = StyleSheet.create({
    cameraTopOverlay: {
        backgroundColor: '#f0faf4',
        paddingBottom: 4
    },
    gradient: {flex: 1},
    safe: {flex: 1},
    body: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24
    },
    title: {textAlign: 'center', marginBottom: 12},
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
        borderRadius: 100
    },
    buttonPressed: {backgroundColor: '#229954'},
    buttonText: {fontSize: 16},
    secondaryLink: {marginTop: 20, paddingVertical: 12, paddingHorizontal: 24},
    skipLink: {marginTop: 8, paddingVertical: 12, paddingHorizontal: 24}
});

export default OnboardingCameraScreen;
