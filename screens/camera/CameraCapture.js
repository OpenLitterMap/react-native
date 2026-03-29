import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    AppState,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {useIsFocused} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';
import {readGpsFromExif} from '../../utils/readGpsFromExif';

/**
 * Reusable camera capture component.
 * Handles: viewfinder, shutter, preview, Use/Retake.
 * Does NOT know about onboarding, navigation, or upload.
 *
 * @param {Object} props
 * @param {Function} props.onPhotoAccepted - Called with {uri, lat, lon, width, height} when user taps "Use this photo"
 * @param {Function} props.onCancel - Called when user taps cancel/close
 * @param {string} [props.hintText] - Optional hint text shown above the shutter button
 * @param {React.ReactNode} [props.topOverlay] - Optional content rendered at the top of the viewfinder (e.g. StepIndicator)
 */
const CameraCapture = ({onPhotoAccepted, onCancel, hintText, topOverlay}) => {
    const {t} = useTranslation();
    const insets = useSafeAreaInsets();
    const isFocused = useIsFocused();
    const cameraRef = useRef(null);
    const device = useCameraDevice('back');

    const [preview, setPreview] = useState(null); // {uri, lat, lon, width, height}
    const [capturing, setCapturing] = useState(false);
    const [captureError, setCaptureError] = useState(false);
    const [appActive, setAppActive] = useState(true);
    const usedRef = useRef(false); // prevents double-tap on "Use this photo"

    // Track app foreground/background state
    useEffect(() => {
        const sub = AppState.addEventListener('change', state => {
            setAppActive(state === 'active');
        });
        return () => sub.remove();
    }, []);

    // Deactivate camera when app is backgrounded, screen loses focus, or previewing
    const cameraActive = isFocused && appActive && !preview;

    const takePhoto = useCallback(async () => {
        if (!cameraRef.current || capturing) return;
        setCapturing(true);
        setCaptureError(false);
        try {
            const photo = await cameraRef.current.takePhoto({
                enableShutterSound: true
            });

            const photoUri = `file://${photo.path}`;

            // Try iOS metadata first, then fall back to EXIF reading (works on all platforms)
            let finalLat = null;
            let finalLon = null;

            const gps = photo.metadata?.['{GPS}'];
            if (gps?.Latitude != null && gps?.Longitude != null) {
                const lat = gps.Latitude;
                const lon = gps.Longitude;
                finalLat = gps.LatitudeRef === 'S' ? -lat : lat;
                finalLon = gps.LongitudeRef === 'W' ? -lon : lon;
            }

            // EXIF fallback — handles Android and cases where metadata is missing
            if (finalLat == null || finalLon == null) {
                const exifGps = await readGpsFromExif(photoUri);
                if (exifGps) {
                    finalLat = exifGps.latitude;
                    finalLon = exifGps.longitude;
                }
            }

            setPreview({
                uri: photoUri,
                lat: finalLat,
                lon: finalLon,
                width: photo.width,
                height: photo.height
            });
        } catch (err) {
            if (__DEV__) console.error('[Camera] takePhoto error:', err);
            setCaptureError(true);
        }
        setCapturing(false);
    }, [capturing]);

    const handleUsePhoto = useCallback(() => {
        if (!preview || !onPhotoAccepted || usedRef.current) return;
        usedRef.current = true;
        onPhotoAccepted(preview);
    }, [preview, onPhotoAccepted]);

    const handleRetake = useCallback(() => {
        setPreview(null);
        usedRef.current = false;
    }, []);

    // Preview state — show captured photo with Use/Retake buttons
    if (preview) {
        return (
            <View style={styles.container}>
                <Image source={{uri: preview.uri}} style={styles.previewImage} resizeMode="cover" />
                <View style={styles.previewOverlay}>
                    {topOverlay}
                    <View style={styles.previewActions}>
                        <Pressable onPress={handleRetake} style={styles.retakeButton}>
                            <Icon name="refresh-outline" size={22} color={Colors.white} />
                            <Body color="white" family="medium" style={styles.actionText}>
                                {t('Retake')}
                            </Body>
                        </Pressable>

                        <Pressable
                            onPress={handleUsePhoto}
                            style={({pressed}) => [
                                styles.useButton,
                                pressed && styles.useButtonPressed
                            ]}>
                            <Icon name="checkmark-circle" size={22} color={Colors.white} />
                            <Body color="white" family="semiBold" style={styles.actionText}>
                                {t('Use this photo')}
                            </Body>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    }

    // No camera device
    if (!device) {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <Body color="white">{t('Camera not available')}</Body>
                </View>
            </View>
        );
    }

    // Camera viewfinder
    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                style={StyleSheet.absoluteFill}
                device={device}
                isActive={cameraActive}
                photo={true}
                enableLocation={true}
            />

            <View style={styles.cameraOverlay}>
                {topOverlay}

                {captureError ? (
                    <View style={styles.cameraHint}>
                        <Caption color="white" family="medium" style={styles.errorHint}>
                            {t('Photo capture failed. Please try again.')}
                        </Caption>
                    </View>
                ) : hintText ? (
                    <View style={styles.cameraHint}>
                        <Caption color="white" family="medium" style={styles.hintText}>
                            {hintText}
                        </Caption>
                    </View>
                ) : null}

                <View style={[styles.captureRow, {paddingBottom: insets.bottom + 16}]}>
                    <Pressable onPress={onCancel} style={styles.cancelButton}>
                        <Icon name="close" size={28} color={Colors.white} />
                    </Pressable>

                    <Pressable
                        onPress={takePhoto}
                        disabled={capturing}
                        style={[styles.captureButton, capturing && styles.captureDisabled]}>
                        <View style={styles.captureInner} />
                    </Pressable>

                    <View style={styles.captureButtonPlaceholder} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between'
    },
    cameraHint: {
        alignItems: 'center',
        paddingHorizontal: 32
    },
    hintText: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        overflow: 'hidden',
        textAlign: 'center'
    },
    errorHint: {
        backgroundColor: 'rgba(200,50,50,0.8)',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        overflow: 'hidden',
        textAlign: 'center'
    },
    captureRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 32
    },
    cancelButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        borderWidth: 4,
        borderColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center'
    },
    captureInner: {
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: Colors.white
    },
    captureDisabled: {
        opacity: 0.5
    },
    captureButtonPlaceholder: {
        width: 48
    },
    previewImage: {
        ...StyleSheet.absoluteFillObject
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between'
    },
    previewActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
        paddingHorizontal: 24,
        paddingBottom: 24
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 100,
        paddingHorizontal: 20,
        height: 48
    },
    useButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        paddingHorizontal: 20,
        height: 48
    },
    useButtonPressed: {
        backgroundColor: '#229954'
    },
    actionText: {
        fontSize: 15
    }
});

export default CameraCapture;
