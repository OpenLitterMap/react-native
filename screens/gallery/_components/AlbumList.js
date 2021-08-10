import React, { Component } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import CameraRoll from '@react-native-community/cameraroll';

export default class AlbumList extends Component {
    componentDidMount() {
        this.getPhots();
    }
    async getPhots() {
        const params = {
            first: 1000
            // groupTypes: 'SavedPhotos',
            // assetType: 'Photos',
            // include: ['location']
        };
        const photosArray = await CameraRoll.getPhotos(params);
        console.log(photosArray.edges.length);
        photosArray.edges.map(photo => {
            if (photo.node.location) {
                console.log(JSON.stringify(photo, null, '\t'));
            }
        });
        // console.log(JSON.stringify(photosArray, null, '\t'));
    }
    render() {
        return (
            <View>
                <Text>gallery</Text>
            </View>
        );
    }
}

const styles = StyleSheet.create({});
