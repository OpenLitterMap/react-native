import React, {useCallback, useState} from 'react';
import {
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {useDispatch} from 'react-redux';
import {Body, Caption, Colors, Title} from '../components';
import StepIndicator from './components/StepIndicator';
import {addOnboardingPhoto} from '../../reducers/photos_reducer';
import {readGpsFromExif} from '../../utils/readGpsFromExif';

/**
 * Gallery photo acquisition screen.
 * Shows a "Select a photo" screen. Tapping the button opens the system picker.
 * Validates GPS. Adds to Redux. Advances to tagging.
 *
 * Does NOT auto-upload here — upload happens after tagging via the normal
 * HomeScreen upload flow when onboarding completes.
 */
const OnboardingPhotoScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const [noGps, setNoGps] = useState(false);
    const [error, setError] = useState(null);

    const openPicker = useCallback(async () => {
        setError(null);
        setNoGps(false);

        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                includeExtra: true,
                quality: 1
            });

            if (result.didCancel) return; // User cancelled — stay on this screen

            if (result.errorCode) {
                setError(result.errorMessage || 'Something went wrong. Please try again.');
                return;
            }

            const asset = result.assets?.[0];
            if (!asset) {
                setError('No photo selected. Please try again.');
                return;
            }

            // react-native-image-picker doesn't return GPS — read from EXIF
            const gps = await readGpsFromExif(asset.uri);

            if (!gps) {
                setNoGps(true);
                return;
            }

            dispatch(addOnboardingPhoto({
                uri: asset.uri,
                filename: asset.fileName || `onboarding_${Date.now()}.jpg`,
                lat: gps.latitude,
                lon: gps.longitude,
                width: asset.width,
                height: asset.height,
                type: asset.type || 'image/jpeg',
                fileSize: asset.fileSize
            }));

            navigation.replace('ONBOARDING_TAG');
        } catch (err) {
            if (__DEV__) console.error('[Photo] picker error:', err);
            setError('Something went wrong. Please try again.');
        }
    }, [dispatch, navigation]);

    const switchToCamera = () => {
        navigation.replace('ONBOARDING_PERMISSION', {path: 'camera'});
    };

    // No GPS fallback
    if (noGps) {
        return (
            <LinearGradient
                colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
                locations={[0, 0.5, 1]}
                style={styles.gradient}>
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                    <StepIndicator currentStep={1} />
                    <View style={styles.body}>
                        <View style={styles.iconCircle}>
                            <Icon name="location-outline" size={56} color={Colors.warn} />
                        </View>
                        <Title style={styles.title}>
                            {"This photo doesn't have location data"}
                        </Title>
                        <Body color="muted" style={styles.bodyText}>
                            {"Photos taken with your phone's camera include GPS automatically. Take a fresh photo or select a different one."}
                        </Body>
                        <Pressable
                            style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                            onPress={switchToCamera}>
                            <Icon name="camera-outline" size={20} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.buttonText}>
                                {'Open camera'}
                            </Body>
                        </Pressable>
                        <Pressable onPress={openPicker} style={styles.secondaryLink}>
                            <Caption color="accent" family="medium">
                                {'Select another photo'}
                            </Caption>
                        </Pressable>
                    </View>
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
                <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
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
                                {'Try again'}
                            </Body>
                        </Pressable>
                    </View>
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
            <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
                <StepIndicator currentStep={1} />
                <View style={styles.body}>
                    <View style={styles.iconCircle}>
                        <Icon name="images-outline" size={56} color={Colors.accent} />
                    </View>
                    <Title style={styles.title}>
                        {'Select a photo of litter'}
                    </Title>
                    <Body color="muted" style={styles.bodyText}>
                        {'Choose a photo from your library. Photos with GPS location data work best.'}
                    </Body>
                    <Pressable
                        style={({pressed}) => [styles.buttonStyle, pressed && styles.buttonPressed]}
                        onPress={openPicker}>
                        <Icon name="images-outline" size={20} color={Colors.white} />
                        <Body color="white" family="semiBold" style={styles.buttonText}>
                            {'Choose from library'}
                        </Body>
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
    }
});

export default OnboardingPhotoScreen;
