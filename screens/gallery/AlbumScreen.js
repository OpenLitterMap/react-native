import React, { Component } from 'react';
import { View, Pressable } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../../actions';
import Icon from 'react-native-vector-icons/Ionicons';

import { Header, Body, SubTitle } from '../components';
import { checkCameraRollPermission } from '../../utils/permissions';
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
        this.checkGalleryPermission();
    }

    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result === 'granted') {
            this.setState({ hasPermission: true, loading: false });
        } else {
            this.props.navigation.navigate('PERMISSION', {
                screen: 'GALLERY_PERMISSION'
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
                />
                {this.state.hasPermission ? (
                    <View style={{ flex: 1 }}>
                        <AlbumList navigation={this.props.navigation} />
                    </View>
                ) : (
                    <View
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                        <Body>No Permissions to view gallery</Body>
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
