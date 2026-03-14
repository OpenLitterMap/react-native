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
import {useDispatch} from 'react-redux';
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors, Title} from '../components';
import {
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions';
import {
    resetGallery,
    getPhotosFromCameraroll
} from '../../reducers/gallery_reducer';

const GalleryPermissionScreen = ({navigation}) => {
    const dispatch = useDispatch();

    useEffect(() => {
        // Check on initial mount in case permissions were already granted
        checkGalleryPermission();

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

        if (result === 'granted' || result === 'limited') {
            // Reset gallery and re-fetch so newly-permitted photos appear
            dispatch(resetGallery());
            dispatch(getPhotosFromCameraroll('REFRESH'));
            navigation.navigate('APP', { screen: 'HOME' });
        }
    };

    const requestGalleryPermission = async () => {
        const result = await requestCameraRollPermission();

        if (result === 'granted' || result === 'limited') {
            dispatch(resetGallery());
            dispatch(getPhotosFromCameraroll('REFRESH'));
            navigation.navigate('APP', { screen: 'HOME' });
        } else {
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
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.iconCircle}>
                    <Image
                        source={require('../../assets/illustrations/gallery_permission.png')}
                        style={styles.imageStyle}
                    />
                </View>

                <Title
                    style={styles.title}
                    dictionary="Allow Gallery Access"
                />

                <Body
                    color="muted"
                    style={styles.bodyText}
                    dictionary="Please provide us access to your gallery, which is required to upload geotagged images from your device"
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
                        dictionary="Allow Gallery Access"
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
