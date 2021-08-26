import React, { Component } from 'react';
import {
    AppState,
    StyleSheet,
    View,
    Image,
    Pressable,
    Platform,
    Linking,
    Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Title, Body, Colors, Caption } from '../components';
import {
    checkCameraPermission,
    checkLocationPermission,
    requestCameraPermission,
    requestLocationPermission
} from '../../utils/permissions';

const { width } = Dimensions.get('window');
export default class CameraPermissionScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            appState: AppState.currentState
        };
    }

    componentDidMount() {
        /**
         * App state event listner to check if app is in foreground/active
         * or in background/inactive
         */
        AppState.addEventListener('change', this.handleAppStateChange);
    }

    componentWillUnmount() {
        /**
         * remove appState subscription
         */
        AppState.removeEventListener('change', this.handleAppStateChange);
    }
    /**
     * fn that is called when app state changes
     *
     * if app comes back from inactive/background to active state
     * {@link CameraPermissionScreen.checkPermissions} gallery permission is again checked
     * @param {"active" | "background" | "inactive"} nextAppState
     * "inactive" is IOS only
     */
    handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            this.checkPermissions();
        }
        this.setState({ appState: nextAppState });
    };

    /**
     * fn to check for camera permissions
     * if permissions granted go back to home, else do nothing
     */
    async checkPermissions() {
        const cameraPermission = await checkCameraPermission();
        const locationPermission = await checkLocationPermission();

        if (
            cameraPermission === 'granted' &&
            locationPermission === 'granted'
        ) {
            this.props.navigation.navigate('CAMERA');
        }
    }

    /**
     * fn to request permission for accessing camera
     *
     * if asked earlier and user denied / ("BLOCKED")
     * it then take user to app setting
     *
     * if user granted access go back
     */
    async requestPermissions() {
        const cameraResult = await requestCameraPermission();
        const locationResult = await requestLocationPermission();
        if (cameraResult === 'granted' && locationResult === 'granted') {
            this.props.navigation.navigate('CAMERA');
        } else {
            Platform.OS === 'ios'
                ? Linking.openURL('app-settings:')
                : Linking.openSettings();
        }
    }

    render() {
        const { navigation } = this.props;
        return (
            <View style={styles.container}>
                <Image
                    source={require('../../assets/illustrations/camera_permission.png')}
                    style={styles.imageStyle}
                />
                <Title>Please Give Permissions</Title>
                {/* 1 */}
                <View style={styles.permissionContainer}>
                    <View style={styles.permissionItem}>
                        <Icon name="ios-camera" size={32} color={Colors.text} />
                        <View style={styles.itemBody}>
                            <Body>Camera Access</Body>
                            <Caption>
                                To capture litter images from app camera.
                            </Caption>
                        </View>
                    </View>

                    {/* 2 */}
                    <View style={styles.permissionItem}>
                        <Icon name="ios-location" size={32} />
                        <View style={styles.itemBody}>
                            <Body>Location Access</Body>
                            <Caption>
                                To get exact geolocation of where the litter is.
                            </Caption>
                        </View>
                    </View>
                </View>
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.requestPermissions()}>
                    <Body color="white">Allow Permissions</Body>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('CAMERA')}>
                    <Body>Not now, Later</Body>
                </Pressable>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        padding: 20
    },
    imageStyle: {
        width: 300,
        height: 300
    },
    bodyText: {
        textAlign: 'center',
        marginVertical: 20
    },
    permissionContainer: {
        width: width - 80,
        marginTop: 20
    },
    permissionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20
    },
    itemBody: { flexShrink: 1, marginLeft: 20 },
    buttonStyle: {
        paddingHorizontal: 28,
        paddingVertical: 20,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        marginVertical: 32
    }
});
