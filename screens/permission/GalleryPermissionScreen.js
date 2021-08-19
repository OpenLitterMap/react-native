import React, { Component } from 'react';
import { Text, StyleSheet, View, Image, Pressable } from 'react-native';
import { Title, Body, Colors } from '../components';

export default class GalleryPermissionScreen extends Component {
    render() {
        return (
            <View style={styles.container}>
                <Image
                    source={require('../../assets/illustrations/gallery_permission.png')}
                    style={styles.imageStyle}
                />
                <Title>Allow Gallery Access</Title>
                <Body color="muted" style={styles.bodyText}>
                    Please provide us access to your gallery, which is required
                    to select geotagged litter images for upload.
                </Body>
                <Pressable style={styles.buttonStyle}>
                    <Body color="white">Allow gallery access</Body>
                </Pressable>
                <Pressable>
                    <Body>Not now, Later</Body>
                </Pressable>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        // backgroundColor: 'tomato',
        flex: 1,
        padding: 20
    },
    imageStyle: {
        width: 300,
        height: 300
    },
    bodyText: {
        textAlign: 'center',
        marginVertical: 20
    },
    buttonStyle: {
        paddingHorizontal: 28,
        paddingVertical: 20,
        backgroundColor: Colors.accent,
        borderRadius: 100,
        marginVertical: 32
    }
});
