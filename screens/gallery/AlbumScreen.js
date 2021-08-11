import React, { Component } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    Text,
    View,
    Pressable,
    PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import Icon from 'react-native-vector-icons/Ionicons';
import { request, PERMISSIONS } from 'react-native-permissions';

import { Header, Body, SubTitle } from '../components';
import AlbumList from './_components/AlbumList';

class AlbumScreen extends Component {
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

    render() {
        return (
            <>
                <Header
                    leftContent={
                        <Pressable
                            onPress={() => {
                                this.props.navigation.goBack();
                                // this.props.setImageLoading;
                            }}>
                            {/* <Body color="white">Cancel</Body> */}
                            <Icon
                                name="ios-chevron-back-outline"
                                size={24}
                                color="white"
                            />
                        </Pressable>
                    }
                    centerContent={<SubTitle color="white">Album</SubTitle>}
                    // rightContent={
                    //     <Pressable
                    //         onPress={() => {
                    //             // this._chooseImages();
                    //         }}>
                    //         <Body color="white">Done</Body>
                    //     </Pressable>
                    // }
                />
                {this.state.hasPermission ? (
                    <View style={{ flex: 1 }}>
                        <AlbumList />
                    </View>
                ) : (
                    <View>
                        <Body>No Permissions</Body>
                    </View>
                )}
            </>
        );
    }
}

const mapStateToProps = state => {
    return {
        totalGallerySelected: state.gallery.totalGallerySelected
    };
};

export default connect(
    mapStateToProps,
    actions
)(AlbumScreen);
