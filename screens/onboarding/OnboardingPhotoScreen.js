import React, {useCallback, useState} from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import OnboardingBackButton from './components/OnboardingBackButton';
import {addOnboardingPhoto} from '../../reducers/photos_reducer';
import {markOnboardingComplete} from '../../reducers/auth_reducer';
import {pickGeotaggedPhotos} from '../../utils/pickGeotaggedPhotos';
import {partitionByGps} from '../../utils/partitionByGps';
import {setOnboardingComplete} from '../../utils/onboarding';

/**
 * Gallery photo acquisition screen.
 * Shows a "Select a photo" screen. Tapping the button opens the system picker.
 * Validates GPS. Adds to Redux. Advances to tagging.
 *
 * Does NOT auto-upload here — upload happens after tagging via the normal
 * HomeScreen upload flow when onboarding completes.
 */
const OnboardingPhotoScreen = ({navigation}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const userId = useSelector(state => state.auth.user?.id);
    const [noGps, setNoGps] = useState(false);
    const [readingExif, setReadingExif] = useState(false);
    const [error, setError] = useState(null);

    const handleSkip = useCallback(async () => {
        await setOnboardingComplete(userId);
        dispatch(markOnboardingComplete());
    }, [dispatch, userId]);

    const openPicker = useCallback(async () => {
        setError(null);
        setNoGps(false);

        try {
            // Android reads unredacted GPS natively via MediaStore; iOS reads EXIF after
            // the picker. The spinner covers the post-pick processing on both.
            setReadingExif(true);
            let assets;
            try {
                assets = await pickGeotaggedPhotos({selectionLimit: 1});
            } finally {
                setReadingExif(false);
            }

            if (!assets.length) return; // User cancelled — stay on this screen

            const {imported} = partitionByGps(assets);
            if (!imported.length) {
                setNoGps(true);
                return;
            }

            const asset = imported[0];
            dispatch(addOnboardingPhoto({
                uri: asset.uri,
                filename: asset.fileName || `onboarding_${Date.now()}.jpg`,
                lat: asset.latitude,
                lon: asset.longitude,
                width: asset.width,
                height: asset.height,
                type: asset.type || 'image/jpeg',
                fileSize: asset.fileSize
            }));

            navigation.replace('ONBOARDING_TAG');
        } catch (err) {
            setReadingExif(false);
            if (err?.message === 'MEDIA_LOCATION_DENIED') {
                setError(t('OpenLitterMap needs photo-location access to read GPS from your photos. Enable it in Settings.'));
            } else if (err?.message === 'PHOTO_PERMISSION_DENIED') {
                setError(t('OpenLitterMap needs photo access to import geotagged photos.'));
            } else {
                if (__DEV__) console.error('[Photo] picker error:', err);
                setError(t('Something went wrong. Please try again.'));
            }
        }
    }, [dispatch, navigation, t]);

    const switchToCamera = () => {
        navigation.replace('ONBOARDING_PERMISSION', {path: 'camera'});
    };

    // Reading EXIF data — show spinner
    if (readingExif) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
                    <StepIndicator currentStep={1} />
                    <View style={styles.body}>
                        <ActivityIndicator size="large" color={Colors.accent} />
                        <Caption color="muted" style={styles.loadingText}>
                            {t('Reading photo location...')}
                        </Caption>
                    </View>
                    <OnboardingBackButton onPress={() => navigation.goBack()} />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // No GPS fallback
    if (noGps) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
                    <StepIndicator currentStep={1} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="location-outline" size={56} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {t('No location found')}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {t("This photo has no GPS, so it can't be placed on the map. Try another photo, or take a new one with the OLM Camera.")}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={switchToCamera}>
                            <Icon name="camera-outline" size={20} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Use OLM Camera')}
                            </Body>
                        </Pressable>
                        <Pressable onPress={openPicker} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {t('Select another photo')}
                            </Caption>
                        </Pressable>
                        <Pressable onPress={handleSkip} style={styles.skipLink}>
                            <Caption color="muted">
                                {t('Skip for now')}
                            </Caption>
                        </Pressable>
                    </View>
                    <OnboardingBackButton onPress={() => navigation.goBack()} />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Error state
    if (error) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
                    <StepIndicator currentStep={1} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="alert-circle-outline" size={56} color={Colors.error} />
                        </View>
                        <Body color="muted" style={styles.bodyText}>{error}</Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={openPicker}>
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {t('Try again')}
                            </Body>
                        </Pressable>
                    </View>
                    <OnboardingBackButton onPress={() => navigation.goBack()} />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    // Default: prompt user to select a photo
    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb', '#d4f7e2']}
            locations={[0, 0.3, 0.7, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
                <StepIndicator currentStep={1} />
                <View style={styles.body}>
                    <View style={styles.iconCircle}>
                        <Icon name="images-outline" size={56} color={Colors.accent} />
                    </View>
                    <Title style={styles.title}>
                        {t('Select a Geotagged Photo')}
                    </Title>
                    <Body color="muted" style={styles.bodyText}>
                        {t('Photos are required to be geotagged so we can map them')}
                    </Body>
                    <Pressable
                        style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                        onPress={openPicker}>
                        <Icon name="images-outline" size={20} color={Colors.white} />
                        <Body color="white" family="semiBold" style={styles.buttonText}>
                            {t('Choose from library')}
                        </Body>
                    </Pressable>
                </View>
                <OnboardingBackButton onPress={() => navigation.goBack()} />
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    gradient: {
        flex: 1
    },
    safe: {
        flex: 1
    },
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
    },
    skipLink: {
        marginTop: 8,
        paddingVertical: 12,
        paddingHorizontal: 24
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14
    }
});

export default OnboardingPhotoScreen;
