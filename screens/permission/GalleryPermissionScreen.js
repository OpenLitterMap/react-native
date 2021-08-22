import React, { Component } from 'react';
import {
    AppState,
    StyleSheet,
    View,
    Image,
    Pressable,
    Platform,
    Linking
} from 'react-native';
import { StackActions } from '@react-navigation/native';

import { Title, Body, Colors } from '../components';
import {
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions';

export default class GalleryPermissionScreen extends Component {
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
     * {@link GalleryPermissionScreen.checkGalleryPermission} gallery permission is again checked
     * @param {"active" | "background" | "inactive"} nextAppState
     * "inactive" is IOS only
     */
    handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            this.checkGalleryPermission();
        }
        this.setState({ appState: nextAppState });
    };

    /**
     * fn to check for cameraroll/gallery permissions
     * if permissions granted go back to home, else do nothing
     */
    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result === 'granted') {
            this.props.navigation.dispatch(StackActions.popToTop());
        }
    }

    /**
     * fn to request permission for accessing gallery/cameraroll
     *
     * if asked earlier and user denied / ("BLOCKED")
     * it then take user to app setting
     *
     * if user granted access go back
     */
    async requestGalleryPermission() {
        const result = await requestCameraRollPermission();
        if (result === 'granted') {
            this.props.navigation.dispatch(StackActions.popToTop());
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
                    source={require('../../assets/illustrations/gallery_permission.png')}
                    style={styles.imageStyle}
                />
                <Title>Allow Gallery Access</Title>
                <Body color="muted" style={styles.bodyText}>
                    Please provide us access to your gallery, which is required
                    if you want to upload geotagged images from gallery.
                </Body>
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.requestGalleryPermission()}>
                    <Body color="white">Allow gallery access</Body>
                </Pressable>
                <Pressable
                    onPress={() =>
                        navigation.dispatch(StackActions.popToTop())
                    }>
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
    buttonStyle: {
        paddingHorizontal: 28,
        paddingVertical: 20,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        marginVertical: 32
    }
});
