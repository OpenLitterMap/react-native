import React, { Component } from 'react';
import { Text, StyleSheet, View, ActivityIndicator } from 'react-native';
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
        this.getImagesFormCameraroll();
    }

    async getImagesFormCameraroll() {
        const galleryLength = this.props.gallery.length;
        let id =
            galleryLength === 0
                ? 0
                : this.props.gallery[galleryLength - 1].id + 1;

        await this.props.getPhotosFromCameraroll(id);
        console.log('render');
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

        if (this.props.geotaggedImages?.length > 0 && !this.state.isLoading) {
            return (
                <AlbumCard
                    albumName="Geotagged"
                    thumbnail={this.props.geotaggedImages[0]?.uri}
                    counter={this.props.geotaggedImages.length}
                    navigation={this.props.navigation}
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
