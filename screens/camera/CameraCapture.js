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
                const lat = Math.abs(gps.Latitude);
                const lon = Math.abs(gps.Longitude);
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

    // Preview state — show captured photo with GPS info + Use/Retake/Delete buttons
    if (preview) {
        const hasGps = preview.lat != null && preview.lon != null;

        return (
            <View style={styles.container}>
                <Image source={{uri: preview.uri}} style={styles.previewImage} resizeMode="contain" />
                {topOverlay}
                <View style={styles.previewOverlay}>
                    {/* GPS info */}
                    <View style={styles.gpsInfo}>
                        <Icon
                            name={hasGps ? 'location' : 'location-outline'}
                            size={16}
                            color={hasGps ? Colors.accent : '#ff6b6b'}
                        />
                        <Caption color="white" style={styles.gpsText}>
                            {hasGps
                                ? `${preview.lat.toFixed(6)}, ${preview.lon.toFixed(6)}`
                                : t('No GPS data')}
                        </Caption>
                    </View>

                    {/* Action buttons */}
                    <View style={[styles.previewActions, {paddingBottom: insets.bottom + 16}]}>
                        <View style={styles.secondaryRow}>
                            <Pressable onPress={handleRetake} style={styles.deleteButton}>
                                <Icon name="trash-outline" size={20} color={Colors.white} />
                                <Body color="white" family="medium" style={styles.actionText}>
                                    {t('Delete')}
                                </Body>
                            </Pressable>

                            <Pressable onPress={handleRetake} style={styles.retakeButton}>
                                <Icon name="refresh-outline" size={20} color={Colors.white} />
                                <Body color="white" family="medium" style={styles.actionText}>
                                    {t('Retake')}
                                </Body>
                            </Pressable>
                        </View>

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

    // No camera device (e.g. simulator)
    if (!device) {
        return (
            <View style={styles.container}>
                <View style={styles.centered}>
                    <Icon name="camera-outline" size={48} color="#666" />
                    <Body color="white" style={styles.noCameraText}>{t('Camera not available')}</Body>
                    <Caption color="white" style={styles.noCameraHint}>
                        {t('This device does not have a camera.')}
                    </Caption>
                    <Pressable
                        onPress={onCancel}
                        style={({pressed}) => [
                            styles.noCameraButton,
                            pressed && {opacity: 0.7}
                        ]}>
                        <Body color="white" family="semiBold">{t('Go Back')}</Body>
                    </Pressable>
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
        alignItems: 'center',
        padding: 32
    },
    noCameraText: {
        marginTop: 16,
        fontSize: 17
    },
    noCameraHint: {
        marginTop: 8,
        textAlign: 'center',
        opacity: 0.6
    },
    noCameraButton: {
        marginTop: 24,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.4)'
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
        justifyContent: 'flex-end'
    },
    gpsInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 12
    },
    gpsText: {
        fontSize: 13
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(200,50,50,0.7)',
        borderRadius: 100,
        paddingHorizontal: 20,
        height: 44,
        flex: 1
    },
    previewActions: {
        paddingHorizontal: 20,
        gap: 10
    },
    secondaryRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12
    },
    retakeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 100,
        paddingHorizontal: 20,
        height: 44,
        flex: 1
    },
    useButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        height: 52
    },
    useButtonPressed: {
        backgroundColor: '#229954'
    },
    actionText: {
        fontSize: 15
    }
});

export default CameraCapture;
