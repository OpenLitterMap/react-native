import React, {Component} from 'react';
import {Pressable, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Header, SubTitle} from '../components';
import {checkCameraRollPermission} from '../../utils/permissions';
import AlbumList from './galleryComponents/AlbumList';

class AlbumScreen extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            hasPermission: false
        };
    }

    componentDidMount() {
        this.checkGalleryPermission();
    }

    /**
     * fn to check for cameraroll/gallery permissions
     * if permissions granted setState, else navigate to GalleryPermissionScreen
     */

    async checkGalleryPermission() {
        const result = await checkCameraRollPermission();
        if (result === 'granted') {
            this.setState({hasPermission: true, loading: false});
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
                            }}>
                            <Icon
                                name="ios-chevron-back-outline"
                                size={24}
                                color="white"
                            />
                        </Pressable>
                    }
                    centerContent={<SubTitle color="white">Album</SubTitle>}
                />
                {this.state.hasPermission && (
                    <View style={{flex: 1}}>
                        <AlbumList navigation={this.props.navigation} />
                    </View>
                )}
            </>
        );
    }
}

export default AlbumScreen;
