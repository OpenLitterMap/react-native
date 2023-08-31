import React, {Component} from 'react';
import {
    AppState,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../../actions';
import {Body, Colors, Title} from '../components';
import {
    checkCameraRollPermission,
    requestCameraRollPermission
} from '../../utils/permissions';
import * as Sentry from '@sentry/react-native';

class GalleryPermissionScreen extends Component {
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
        // deprecated in react-native 0.65+
        // AppState.removeEventListener('change', this.handleAppStateChange);

        const subscription = AppState.addEventListener(
            'change',
            this.handleAppStateChange
        );
        subscription.remove();
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
        this.setState({appState: nextAppState});
    };

    /**
     * fn to check for cameraroll/gallery permissions
     * if permissions granted go back to home, else do nothing
     */
    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result.toLowerCase() === 'granted') {
            this.props.navigation.navigate('HOME');
        } else {
            Sentry.captureException(
                JSON.stringify('Gallery Permission Error ' + result, null, 2),
                {
                    level: 'error',
                    tags: {
                        section: 'checkGalleryPermission'
                    }
                }
            );
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
            this.props.navigation.navigate('HOME');
        } else {
            Platform.OS === 'ios'
                ? await Linking.openURL('app-settings:')
                : await Linking.openSettings();
        }
    }

    render() {
        const {navigation, lang} = this.props;
        return (
            <View style={styles.container}>
                <Image
                    source={require('../../assets/illustrations/gallery_permission.png')}
                    style={styles.imageStyle}
                />
                <Title dictionary={`${lang}.permission.allow-gallery-access`} />
                <Body
                    color="muted"
                    style={styles.bodyText}
                    dictionary={`${lang}.permission.gallery-body`}>
                    Please provide us access to your gallery, which is required
                    if you want to upload geotagged images from gallery.
                </Body>
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.requestGalleryPermission()}>
                    <Body
                        color="white"
                        dictionary={`${lang}.permission.allow-gallery-access`}
                    />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('HOME')}>
                    <Body dictionary={`${lang}.permission.not-now`} />
                </Pressable>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        lang: state.auth.lang
    };
};

export default connect(mapStateToProps, actions)(GalleryPermissionScreen);

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
