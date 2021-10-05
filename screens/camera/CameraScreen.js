import React from 'react';

import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Linking
} from 'react-native';
import StyleSheet from 'react-native-extended-stylesheet';
import AsyncStorage from '@react-native-community/async-storage';

import RNLocation from 'react-native-location';
import { RNCamera } from 'react-native-camera'; // FaceDetector
import CameraRoll from '@react-native-community/cameraroll';

import { Icon } from 'react-native-elements';

import * as actions from '../../actions';
import { connect } from 'react-redux';
import moment from 'moment';
import VALUES from '../../utils/Values';
import {
    checkCameraPermission,
    checkLocationPermission
} from '../../utils/permissions';

import DeviceInfo from 'react-native-device-info';
import piexif from 'piexifjs';
const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class CameraScreen extends React.Component {
    constructor(props) {
        super(props);
        this.locationSubscription;
        this.state = {
            lat: null,
            lon: null,
            errorMessage: '',
            loading: true,
            shutterOpacity: new Animated.Value(0),
            permissionGranted: false
            // Camera.Constants.Type.back,
        };

        const model = DeviceInfo.getModel();

        // settings_actions, settings_reducer
        this.props.setModel(model);
    }

    async componentDidMount() {
        StyleSheet.build({
            $rem: Dimensions.get('window').width / VALUES.remDivisionFactor
        });

        this.focusListner = this.props.navigation.addListener('focus', () => {
            this.checkPermission();
        });
        this.blurListner = this.props.navigation.addListener('blur', () => {
            this.setState({ loading: true });
        });
    }

    componentWillUnmount() {
        // unsubscribe to location services on unmount

        this.locationSubscription && this.locationSubscription();
        this.focusListner();
        this.blurListner();
    }

    /**
     * check for camera and location permission
     * if not granted navigate to permission screen
     */
    async checkPermission() {
        const cameraPermission = await checkCameraPermission();
        const locationPermission = await checkLocationPermission();

        if (
            cameraPermission === 'granted' &&
            locationPermission === 'granted'
        ) {
            this.setState({ permissionGranted: true });
            this.getUserLocation();
        } else {
            this.props.navigation.navigate('PERMISSION', {
                screen: 'CAMERA_PERMISSION'
            });
        }
    }
    /**
     * Get location of user
     * subscribe to location changes
     */

    async getUserLocation() {
        const locationPermission = await checkLocationPermission();
        if (locationPermission === 'granted') {
            this.locationSubscription = RNLocation.subscribeToLocationUpdates(
                locations => {
                    !this.state.loading &&
                        this.setState({
                            lat: locations[0].latitude,
                            lon: locations[0].longitude
                        });
                }
            );
            this.setState({ loading: false });
        }
    }
    /**
     * Flash a black screen when the user takes a photo
     */
    animateShutter() {
        Animated.sequence([
            Animated.timing(this.state.shutterOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true
            }),
            Animated.timing(this.state.shutterOpacity, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            })
        ]).start();
    }

    /**
     * Render the camera page
     */
    render() {
        if (this.state.loading) {
            return (
                <View
                    style={{
                        flex: 1,
                        justifyContent: 'center',
                        backgroundColor: 'black'
                    }}>
                    <ActivityIndicator />
                </View>
            );
        }

        return this.state.permissionGranted
            ? this.renderCamera()
            : this.renderNoPermissions();
    }

    /**
     * Render Camera
     */
    renderCamera() {
        return (
            <>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={{ flex: 1 }}
                    captureAudio={false}>
                    {/* Bottom Row */}
                    <View style={styles.bottomRow}>
                        {/* Photo Button*/}
                        <TouchableOpacity
                            onPress={this.takePicture.bind(this)}
                            style={styles.cameraButton}>
                            <Icon
                                color="white"
                                name="adjust"
                                size={SCREEN_HEIGHT * 0.1}
                            />
                        </TouchableOpacity>

                        {/* Shutter Layer with props */}
                        <Animated.View
                            style={{
                                width: SCREEN_WIDTH,
                                height: SCREEN_HEIGHT,
                                backgroundColor: 'black',
                                opacity: this.state.shutterOpacity
                            }}
                        />
                    </View>
                    <SafeAreaView style={{ flex: 0 }} />
                </RNCamera>
            </>
        );
    }

    /**
     * Render No Permissions
     *
     * Todo - When permissions are denied: Add Button to request permissions again
     */
    renderNoPermissions() {
        return (
            <View style={styles.noPermissionView}>
                <Text style={styles.noPermissionText}>
                    Camera permissions not granted - cannot open camera preview.
                </Text>
            </View>
        );
    }

    /**
     * Take a Pic and save to custom photos folder
     *
     * We attach the users current GPS to the image
     */
    async takePicture() {
        const lat = this.state.lat;
        const lon = this.state.lon;
        if (lat === null || lon === null) {
            // Todo: Needs translation
            Alert.alert(
                'Location data not found',
                'Your location services are not turned on. Please activate them to take geotagged photos.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            // take user to location setting
                            // INFO: IOS only
                            // TODO: find a way to do the same in android without external libs
                            const iosUrl = 'App-Prefs:Privacy&path=LOCATION';
                            if (Platform.OS === 'ios') {
                                const result = await Linking.canOpenURL(iosUrl);
                                result &&
                                    Linking.openURL(
                                        'App-Prefs:Privacy&path=LOCATION'
                                    );
                            }
                        }
                    }
                ]
            );
        } else if (this.camera) {
            try {
                this.animateShutter();
                const options = {
                    // writeExif: {
                    //     GPSLatitude: lat,
                    //     GPSLongitude: lon
                    // },
                    base64: true
                    // exif: true,
                };
                const result = await this.camera.takePictureAsync(options);

                // console.log(JSON.stringify(result, null, 2)); // height, uri, width: ;

                const now = moment();
                const date = moment(now).format('YYYY:MM:DD HH:mm:ss');
                // We need to generate a better filename for android
                const filename = result.uri.split('/').pop();

                const exifData = await piexif.load(
                    `data:image/jpeg;base64,${result.base64}`
                );

                const newExif = {
                    '0th': { ...exifData['0th'] },
                    Exif: { ...exifData['Exif'] },
                    GPS: { ...exifData['GPS'] },
                    Interop: { ...exifData['Interop'] },
                    '1st': { ...exifData['1st'] },
                    thumbnail: null
                };
                newExif['GPS'][piexif.GPSIFD.GPSLatitude] = lat;
                newExif['GPS'][piexif.GPSIFD.GPSLatitudeRef] = 'N';

                newExif['GPS'][piexif.GPSIFD.GPSLongitude] = lon - 2 * lon;
                newExif['GPS'][piexif.GPSIFD.GPSLongitudeRef] = 'W';

                console.log(newExif);
                const newExifBinary = await piexif.dump(newExif);
                // console.log(newExifBinary);
                const newPhotoData = await piexif.insert(
                    newExifBinary,
                    `data:image/jpeg;base64,${result.base64}`
                );
                // photo_action.js, photos_reducer

                CameraRoll.save(newPhotoData, {
                    type: 'photo',
                    album: 'OLM'
                }).then(data => {
                    console.log('===>');
                    console.log(data);
                    result.uri = data;
                    // this.props.addPhoto({
                    //     result,
                    //     lat,
                    //     lon,
                    //     filename,
                    //     date
                    // });
                });
                // async-storage photos set
                // AsyncStorage.setItem(
                //     'openlittermap-photos',
                //     JSON.stringify(this.props.photos)
                // );

                // later:
                // check settings - does the user want to save these images to their camera roll?
                // can we create a new photo album for them?
                // let saveResult = await CameraRoll.saveToCameraRoll(data, 'photo');
                // this.setState({ cameraRollUri: saveResult });
            } catch (e) {
                console.error('catch.camera.takePicture', e);
            }

            // todo - upload images to database automatically in background
            // todo - check settings for TagNow (this does not exist yet)
            // todo - if true, set currently selected photo and load LitterPicker.js
        }
    }

    /**
     * Todo - Zoom In & Out
     *
     * This should be on state
     */
    // zoomIn ()
    // {
    // }
    // zoomOut ()
    // {
    // }
}

// StyleSheet needed for $rem above
const styles = StyleSheet.create({
    bottomRightIcon: {
        backgroundColor: 'transparent',
        position: 'absolute',
        right: 30,
        bottom: 0,
        zIndex: 1,
        paddingRight: 20,
        paddingTop: 20
    },
    bottomRow: {
        backgroundColor: 'transparent',
        marginBottom: 15,
        flex: 1,
        flexDirection: 'row',
        position: 'relative'
    },
    cameraButton: {
        backgroundColor: 'transparent',
        position: 'absolute',
        bottom: 0,
        left: SCREEN_WIDTH * 0.35,
        right: SCREEN_WIDTH * 0.35,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1
    },
    container: {
        flex: 1
    },
    paragraph: {
        margin: 24,
        fontSize: 18,
        textAlign: 'center'
    },
    noPermissionView: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '12rem',
        backgroundColor: 'black'
    },
    noPermissionText: {
        color: 'white',
        textAlign: 'center',
        fontSize: '18rem'
    }
});

const mapStateToProps = state => {
    return {
        autoFocus: state.camera.autoFocus,
        lat: state.camera.lat,
        lon: state.camera.lon,
        photos: state.photos.photos,
        token: state.auth.token,
        type: state.camera.type,
        user: state.auth.user,
        zoom: state.camera.zoom
    };
};

export default connect(
    mapStateToProps,
    actions
)(CameraScreen);
