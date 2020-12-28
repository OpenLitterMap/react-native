import React, { PureComponent } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    Text,
    View
} from 'react-native';

import { request, PERMISSIONS } from 'react-native-permissions';
import { Header } from 'react-native-elements';
import GalleryMediaPicker from '../components/albums';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import moment from 'moment';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

class AlbumList extends PureComponent {

    constructor(props)
    {
        super(props);

        this.state = {
            loading: true,
            totalFiles: 0,
            selected: [],
            hasPermission: false
        };
    }

    componentDidMount ()
    {
        this.requestCameraPermission();
    }

    async requestCameraPermission ()
    {
        let p =
            Platform.OS === 'android'
                ? PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
                : PERMISSIONS.IOS.PHOTO_LIBRARY;

        request(p).then(result => {
            if (result === 'granted') {
                this.setState({ hasPermission: true, loading: false });
            }
        });
    }

    getSelectedFiles (files, current)
    {
        this.setState({ totalFiles: files.length, selected: files });
    }

    renderCenterTitle ()
    {
        // Todo - switch between albums
        return <Text style={{ fontSize: SCREEN_HEIGHT * 0.025 }}>Photos</Text>;
    }

    /**
     * Choose Images for Tagging
     */
    _chooseImages ()
    {
        // check if every photo has a geotag, otherwise return.
        // todo - allow the users to give nongeotagged images a location
        this.state.selected.some((img, i) => {
            if ( ! img.location || Object.keys(img.location).length === 0)
            {
                alert(
                    'Your ' +
                    moment.localeData().ordinal(i + 1) +
                    ' image does not have a GPS tag associated with it. Only geotagged images can be uploaded.'
                );
                return true;
            }
        });

        try {
            this.props.photosFromGallery(this.state.selected);
            this.props.toggleImageBrowser();
        } catch (e) {
            console.log(e);
        }
    }

    _getDoneText ()
    {
        return this.props.totalGallerySelected === 0
            ? 'Done'
            : 'Done (' + this.props.totalGallerySelected + ')';
    }

    render ()
    {
        return (
            <View style={styles.container}>
                <Header
                    backgroundColor="white"
                    outerContainerStyles={{ height: SCREEN_HEIGHT * 0.1 }}
                    leftComponent={{
                        text: 'Cancel',
                        style: { color: '#2089dc', fontSize: SCREEN_HEIGHT * 0.025 },
                        size: SCREEN_HEIGHT * 0.03,
                        onPress: () => {
                            this.props.toggleImageBrowser(false);
                            this.props.setImageLoading;
                        }
                    }}
                    centerComponent={this.renderCenterTitle()}
                    rightComponent={{
                        text: this._getDoneText(),
                        style: {
                            color: '#2089dc',
                            fontSize: SCREEN_HEIGHT * 0.025,
                            width: SCREEN_WIDTH * 0.3,
                            textAlign: 'right'
                        },
                        size: SCREEN_HEIGHT * 0.05,
                        onPress: () => {
                            this._chooseImages();
                        }
                    }}
                />

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
        );
    }
}

const styles = {
    container: {
        flex: 1,
        marginTop: SCREEN_HEIGHT * 0.01
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
