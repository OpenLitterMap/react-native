import React, {useEffect, useRef} from 'react';
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
import {Title, Body, Colors, Caption} from '../components';
import {
    checkCameraPermission,
    checkLocationPermission,
    requestCameraPermission,
    requestLocationPermission
} from '../../utils/permissions';

const CameraPermissionScreen = ({navigation}) => {
    const isMounted = useRef(true);

    useEffect(() => {
        // Check on initial mount in case permissions were already granted
        checkPermissions();

        const handleAppStateChange = nextAppState => {
            if (
                AppState.currentState?.match(/inactive|background/) &&
                nextAppState === 'active'
            ) {
                checkPermissions();
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

    const checkPermissions = async () => {
        const cameraPermission = await checkCameraPermission();
        const locationPermission = await checkLocationPermission();

        if (!isMounted.current) return;

        if (
            cameraPermission === 'granted' &&
            locationPermission === 'granted'
        ) {
            navigation.navigate('APP', { screen: 'HOME' });
        }
    };

    const requestPermissions = async () => {
        const cameraResult = await requestCameraPermission();
        const locationResult = await requestLocationPermission();
        if (cameraResult === 'granted' && locationResult === 'granted') {
            navigation.navigate('APP', { screen: 'HOME' });
        } else {
            Platform.OS === 'ios'
                ? Linking.openURL('app-settings:')
                : Linking.openSettings();
        }
    };

    return (
        <LinearGradient
            colors={['#f0faf4', '#e8f5ec', '#dcffeb']}
            locations={[0, 0.5, 1]}
            style={styles.gradient}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.iconCircle}>
                    <Image
                        source={require('../../assets/illustrations/camera_permission.png')}
                        style={styles.imageStyle}
                    />
                </View>

                <Title
                    style={styles.title}
                    dictionary="Please Give Permissions"
                />

                <View style={styles.permissionContainer}>
                    <View style={styles.permissionItem}>
                        <View style={styles.permissionIcon}>
                            <Icon
                                name="camera-outline"
                                size={24}
                                color={Colors.accent}
                            />
                        </View>
                        <View style={styles.itemBody}>
                            <Body family="medium" dictionary="Camera Access" />
                            <Caption
                                color="muted"
                                dictionary="To capture litter images from app camera"
                            />
                        </View>
                    </View>
                    <View style={styles.permissionItem}>
                        <View style={styles.permissionIcon}>
                            <Icon
                                name="location-outline"
                                size={24}
                                color={Colors.accent}
                            />
                        </View>
                        <View style={styles.itemBody}>
                            <Body
                                family="medium"
                                dictionary="Location Access"
                            />
                            <Caption
                                color="muted"
                                dictionary="To get exact geolocation of where the litter is"
                            />
                        </View>
                    </View>
                </View>

                <Pressable
                    style={({pressed}) => [
                        styles.buttonStyle,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={requestPermissions}>
                    <Icon
                        name="shield-checkmark-outline"
                        size={20}
                        color={Colors.white}
                    />
                    <Body
                        color="white"
                        family="semiBold"
                        dictionary="Allow Permissions"
                        style={styles.buttonText}
                    />
                </Pressable>

                <Pressable
                    onPress={() => navigation.navigate('APP', { screen: 'HOME' })}
                    style={styles.skipButton}>
                    <Caption
                        color="muted"
                        family="medium"
                        dictionary="Not now, Later"
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
        marginBottom: 20
    },
    permissionContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 8
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(39,174,96,0.06)',
        borderRadius: 14,
        padding: 16,
        gap: 14
    },
    permissionIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    itemBody: {
        flexShrink: 1,
        gap: 2
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
        marginTop: 28,
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

export default CameraPermissionScreen;
