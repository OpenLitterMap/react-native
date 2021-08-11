import React, { Component } from 'react';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Colors, Body } from '../../components';
import AlbumCard from './AlbumCard';

class AlbumList extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isLoading: true
        };
    }
    componentDidMount() {
        this.getPhots();
    }

    // componentDidUpdate(preProps) {
    //     if()
    // }

    /**
     * get images from camera roll
     * initially getting 100 photos
     */
    async getPhots() {
        const params = {
            // initially get first 100 images
            first: 100
            // toTime: 1627819113000,
            // fromTime: 1626782313000
            // groupTypes: 'SavedPhotos',
            // assetType: 'Photos',
            // include: ['location']
        };
        const photosArray = await CameraRoll.getPhotos(params);
        console.log(photosArray.edges.length);
        // console.log(JSON.stringify(photosArray.edges, null, 2));

        this.filterPhotos(photosArray);
    }

    async filterPhotos(photoObject) {
        const imagesArray = photoObject.edges;
        const galleryLength = this.props.gallery.length;
        let geotagged = [];

        let id =
            galleryLength === 0
                ? 0
                : this.props.gallery[galleryLength - 1].id + 1;

        imagesArray.map(item => {
            id++;
            if (
                item.node?.location !== undefined &&
                item.node?.location?.longitude !== undefined &&
                item.node?.location?.latitude !== undefined
            ) {
                geotagged.push({
                    id,
                    filename: item.node.image.filename, // this will get hashed on the backend
                    uri: item.node.image.uri,
                    size: item.node.image.fileSize,
                    height: item.node.image.height,
                    width: item.node.image.width,
                    lat: item.node.location.latitude,
                    lon: item.node.location.longitude,
                    timestamp: item.node.timestamp,
                    selected: false,
                    picked_up: false,
                    tags: {},
                    type: 'gallery'
                });
            }
        });

        // console.log(JSON.stringify(geotagged, null, 2));
        console.log(`geotagged length ${geotagged.length}`);
        geotagged.length > 0 && this.props.addGeotaggedImages(geotagged);
        this.setState({ isLoading: false });
    }

    render() {
        if (this.state.isLoading) {
            return (
                <View style={styles.container}>
                    <ActivityIndicator color={Colors.accent} />
                </View>
            );
        }

        if (this.props.geotaggedImages.length > 0 && !this.state.isLoading) {
            return (
                <AlbumCard
                    albumName="Geotagged"
                    thumbnail={this.props.geotaggedImages[0]?.uri}
                    counter={this.props.geotaggedImages.length}
                />
            );
        } else {
            return (
                <View style={styles.container}>
                    <Body>No geotagged photos found</Body>
                </View>
            );
        }
    }
}

const mapStateToProps = state => {
    return {
        imagesLoading: state.gallery.imagesLoading,
        gallery: state.gallery.gallery,
        geotaggedImages: state.gallery.geotaggedImages
    };
};

export default connect(
    mapStateToProps,
    actions
)(AlbumList);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
