import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    Text,
    View,
    PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';

import { request, PERMISSIONS } from 'react-native-permissions';
// import { Header } from 'react-native-elements';
import GalleryMediaPicker from '../components/albums';
import { Header, Body, SubTitle } from '../../components';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Pressable } from 'react-native';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class AlbumList extends PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            totalFiles: 0,
            selected: [],
            hasPermission: false
        };
    }

    componentDidMount() {
        this.requestCameraPermission();
    }

    async requestCameraPermission() {
        if (Platform.OS === 'ios') {
            request(PERMISSIONS.IOS.PHOTO_LIBRARY).then(result => {
                if (result === 'granted') {
                    this.setState({ hasPermission: true, loading: false });
                }
            });
        }

        if (Platform.OS === 'android') {
            let hasPermission = false;

            request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE).then(result => {
                if (result === 'granted') {
                    hasPermission = true;
                }

                PermissionsAndroid.request(
                    'android.permission.ACCESS_MEDIA_LOCATION'
                ).then(result => {
                    if (result === PermissionsAndroid.RESULTS.DENIED) {
                        hasPermission = false;
                    }

                    this.setState({ hasPermission, loading: false });
                });
            });
        }
    }

    /**
     * Determine outer container style
     *
     * This should probably be replaced with SafeAreaView
     */
    container() {
        return Platform.OS === 'android'
            ? styles.androidContainer
            : styles.iOSContainer;
    }

    getSelectedFiles(files, current) {
        this.setState({ totalFiles: files.length, selected: files });
    }

    renderCenterTitle() {
        // Todo - switch between albums
        return <SubTitle color="white">Photos</SubTitle>;
    }

    /**
     * Choose Images for Tagging
     */
    _chooseImages() {
        this.props.photosFromGallery(this.state.selected);
        // this.props.toggleImageBrowser();
        this.props.navigation.goBack();

        // async-storage set gallery
        AsyncStorage.setItem(
            'openlittermap-gallery',
            JSON.stringify(this.state.selected)
        );
    }

    _getDoneText() {
        return this.props.totalGallerySelected === 0
            ? 'Done'
            : 'Done (' + this.props.totalGallerySelected + ')';
    }

    render() {
        return (
            /* This should probably be wrapped in SafeAreaView? */
            <>
                <Header
                    backgroundColor="white"
                    outerContainerStyles={{ height: SCREEN_HEIGHT * 0.1 }}
                    leftContent={
                        <Pressable
                            onPress={() => {
                                this.props.navigation.goBack();
                                this.props.setImageLoading;
                            }}>
                            <Body color="white">Cancel</Body>
                        </Pressable>
                    }
                    centerContent={this.renderCenterTitle()}
                    rightContent={
                        <Pressable
                            onPress={() => {
                                this._chooseImages();
                            }}>
                            <Body color="white">{this._getDoneText()}</Body>
                        </Pressable>
                    }
                />
                <View style={this.container()}>
                    {this.state.hasPermission && (
                        <GalleryMediaPicker
                            groupTypes="All"
                            assetType="Photos"
                            // markIcon={marker}
                            // customSelectMarker={this.renderSelectMarker()}
                            batchSize={1}
                            emptyGalleryText={'There are no photos or video'}
                            maximumSelectedFiles={100}
                            selected={this.state.selected}
                            itemsPerRow={3}
                            imageMargin={3}
                            customLoader={<ActivityIndicator />}
                            callback={this.getSelectedFiles.bind(this)}
                        />
                    )}
                </View>
            </>
        );
    }
}

const styles = {
    androidContainer: {
        flex: 1,
        marginTop: 0
    },
    iOSContainer: {
        flex: 1,
        marginTop: SCREEN_HEIGHT * 0.025
    }
};

const mapStateToProps = state => {
    return {
        totalGallerySelected: state.gallery.totalGallerySelected
    };
};

export default connect(
    mapStateToProps,
    actions
)(AlbumList);
