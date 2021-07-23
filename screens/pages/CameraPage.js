import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    SafeAreaView,
    Text,
    TouchableOpacity,
    View,
    Animated
} from 'react-native';
import StyleSheet from 'react-native-extended-stylesheet';
import AsyncStorage from '@react-native-community/async-storage';

import { request, PERMISSIONS } from 'react-native-permissions';
import RNLocation from 'react-native-location';
import { RNCamera } from 'react-native-camera'; // FaceDetector

import { Icon } from 'react-native-elements';

import * as actions from '../../actions';
import { connect } from 'react-redux';
import moment from 'moment';
import VALUES from '../../utils/Values';

import DeviceInfo from 'react-native-device-info';
import base64 from 'react-native-base64';

// import { getUniqueId, getManufacturer } from 'react-native-device-info';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class CameraPage extends React.Component {
    constructor(props) {
        super(props);

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

        const p =
            Platform.OS === 'android' ? PERMISSIONS.ANDROID : PERMISSIONS.IOS;

        request(p.CAMERA).then(result => {
            // console.log({ result });
            if (result === 'granted') {
                this.setState({ permissionGranted: true });
            }
        });

        this._getLocationAsync();
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
     * Get the location of the device when the user takes a photo
     */
    _getLocationAsync = async () => {
        RNLocation.requestPermission({
            ios: 'whenInUse',
            android: {
                detail: 'fine'
            }
        })
            .then(granted => {
                if (granted) {
                    this.locationSubscription = RNLocation.subscribeToLocationUpdates(
                        locations => {
                            this.setState({
                                lat: locations[0].latitude,
                                lon: locations[0].longitude
                            });
                        }
                    );
                }
            })
            .finally(_ => {
                this.setState({
                    loading: false
                });
            });
    };

    /**
     * Render the camera page
     */
    render() {
        if (this.state.loading || this.props.index === 0) {
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
        // console.log('CAMERA');
        return (
            <>
                <RNCamera
                    ref={ref => {
                        this.camera = ref;
                    }}
                    style={{ flex: 1 }}
                    captureAudio={false}>
                    {/*Top Row
                        <View
                          style={{
                            alignItems: 'flex-start',
                            backgroundColor: 'transparent',
                            flex: 1,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            marginTop: 15,
                            marginLeft: 15
                          }}
                        >
                          <TouchableOpacity
                            onPress={this.goToAwards}
                          >
                            <Icon
                              color="white"
                              name="trophy"
                              size={40}
                              type="font-awesome"
                            />
                          </TouchableOpacity>
                        </View>
                        */}

                    {/* Bottom Row */}
                    <View style={styles.bottomRow}>
                        {/* Bottom Left */}
                        <TouchableOpacity
                            // onPress={this.changeView.bind(this, -1)}
                            // FIXME: remove this logout -- only for dev testing
                            onPress={() => this.props.logout()}
                            style={styles.bottomLeftIcon}>
                            <Icon
                                color="white"
                                name="backup"
                                size={SCREEN_HEIGHT * 0.05}
                            />
                        </TouchableOpacity>

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

                        {/* Bottom Right
                          <TouchableOpacity
                            onPress={this.changeView.bind(this, 1)}
                            style={styles.bottomRightIcon}
                          ><Icon color="white" name="layers" size={SCREEN_HEIGHT * 0.05} />
                          </TouchableOpacity>
                        */}
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
    takePicture() {
        if (this.camera) {
            try {
                this.animateShutter();

                this.camera
                    .takePictureAsync()
                    .then(result => {
                        console.log('takePicture', result); // height, uri, width

                        const lat = this.state.lat;
                        const lon = this.state.lon;

                        if (lat === null || lon === null) {
                            // Todo: Needs translation
                            alert(
                                'Your location services are not turn on. Please activate them to take geotagged photos.'
                            );
                        }

                        const now = moment();
                        const date = moment(now).format('YYYY:MM:DD HH:mm:ss');

                        // We need to generate a better filename for android
                        const filename =
                            Platform.OS === 'android'
                                ? base64.encode(date) + '.jpg'
                                : result.uri.split('/').pop();

                        // Example:
                        // iOS 96790415-6575-4CED-BA64-D6E8B16BF10D.jpg
                        // Android...

                        // photo_action.js, photos_reducer
                        this.props.addPhoto({
                            result,
                            lat,
                            lon,
                            filename,
                            date
                        });

                        // async-storage photos set
                        AsyncStorage.setItem(
                            'openlittermap-photos',
                            JSON.stringify(this.props.photos)
                        );
                    })
                    .catch(error => {
                        console.error('camera.takePicture', error);
                    });

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

    /**
     * Slide to value, passed to Parent Slides.js
     */
    changeView(value) {
        this.props.swipe(value);
    }
}

// StyleSheet needed for $rem above
const styles = StyleSheet.create({
    bottomLeftIcon: {
        backgroundColor: 'transparent',
        position: 'absolute',
        left: 30,
        bottom: 0,
        zIndex: 1,
        paddingRight: 20,
        paddingTop: 20
    },
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
)(CameraPage);
