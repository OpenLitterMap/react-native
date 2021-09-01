import React, { Component } from 'react';
import { StyleSheet, View, Image, Pressable, Linking } from 'react-native';

import { Title, Body, Colors } from './components';

export default class NewUpdateScreen extends Component {
    constructor(props) {
        super(props);
    }

    async handleButtonClick(url) {
        const canOpen = await Linking.canOpenURL(url);
        canOpen && Linking.openURL(url);
    }
    render() {
        const { navigation, route } = this.props;
        const { url } = route.params;
        return (
            <View style={styles.container}>
                <Image
                    source={require('../assets/illustrations/new_update.png')}
                    style={styles.imageStyle}
                />
                <Title>New Version Available</Title>
                <Body color="muted" style={styles.bodyText}>
                    Please update the app for an improved experience.
                </Body>
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.handleButtonClick(url)}>
                    <Body color="white">Update Now</Body>
                </Pressable>
                <Pressable onPress={() => navigation.navigate('HOME')}>
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
