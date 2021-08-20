import React, { Component } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Colors, Body } from '../../components';
import AlbumCard from './AlbumCard';

class AlbumList extends Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
        this.getImagesFormCameraroll();
    }

    getImagesFormCameraroll() {
        this.props.getPhotosFromCameraroll();
    }

    render() {
        if (this.props.geotaggedImages?.length > 0) {
            return (
                <AlbumCard
                    albumName="Geotagged"
                    thumbnail={this.props.geotaggedImages[0]?.uri}
                    counter={this.props.geotaggedImages.length}
                    navigation={this.props.navigation}
                />
            );
        }
        if (this.props.imagesLoading) {
            return (
                <View style={styles.container}>
                    <ActivityIndicator color={Colors.accent} />
                </View>
            );
        } else if (this.props.geotaggedImages?.length === 0) {
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
