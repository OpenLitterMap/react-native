import React, { Component } from 'react';
import {
    AppState,
    StyleSheet,
    View,
    Image,
    Pressable,
    PermissionsAndroid,
    Platform
} from 'react-native';
import { StackActions } from '@react-navigation/native';
import { request, PERMISSIONS, check } from 'react-native-permissions';

import { Title, Body, Colors } from '../components';
import { Linking } from 'react-native';

export default class GalleryPermissionScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            appState: AppState.currentState
        };
    }

    componentDidMount() {
        this.appStateSubscription = AppState.addEventListener(
            'change',
            nextAppState => {
                console.log(nextAppState);
                if (
                    this.state.appState.match(/inactive|background/) &&
                    nextAppState === 'active'
                ) {
                    this.checkCameraRollPermission();
                }
                this.setState({ appState: nextAppState });
            }
        );
    }

    componentWillUnmount() {
        AppState.removeEventListener('change');
    }

    async checkCameraRollPermission() {
        let result;
        if (Platform.OS === 'ios') {
            result = await check('ios.permission.PHOTO_LIBRARY');
        }
        if (Platform.OS === 'android') {
            result = await check('android.permission.READ_EXTERNAL_STORAGE');
        }

        if (result === 'granted') {
            this.props.navigation.dispatch(StackActions.popToTop());
            // this.getImagesFormCameraroll();
        }
    }
    async requestCameraRollPermission() {
        if (Platform.OS === 'ios') {
            const resultIos = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
            if (resultIos === 'granted') {
                this.props.navigation.dispatch(StackActions.popToTop());
            } else if (resultIos === 'blocked') {
                console.log('BLOCKED');
                Linking.openURL('app-settings:');
            }
        }

        if (Platform.OS === 'android') {
            const resultAndroid = await request(
                PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
            );
            const mediaLocation = await PermissionsAndroid.request(
                'android.permission.ACCESS_MEDIA_LOCATION'
            );
            if (
                resultAndroid === 'granted' &&
                mediaLocation !== PermissionsAndroid.RESULTS.DENIED
            ) {
                this.props.navigation.dispatch(StackActions.popToTop());
            } else {
                Linking.openSettings();
            }
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
                    to select geotagged litter images for upload.
                </Body>
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.requestCameraRollPermission()}>
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
        // backgroundColor: 'tomato',
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
