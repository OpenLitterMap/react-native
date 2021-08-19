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
        AppState.addEventListener('change', this.handleAppStateChange);
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
    }

    handleAppStateChange = nextAppState => {
        if (
            this.state.appState.match(/inactive|background/) &&
            nextAppState === 'active'
        ) {
            this.checkGalleryPermission();
        }
        this.setState({ appState: nextAppState });
    };

    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result === 'granted') {
            this.props.navigation.dispatch(StackActions.popToTop());
        }
    }

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
