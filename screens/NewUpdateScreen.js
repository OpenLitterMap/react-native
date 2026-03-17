import React from 'react';
import { Image, Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Body, Colors, Title } from './components';

const NewUpdateScreen = ({ navigation }) => {

    const handleButtonClick = async () => {
        const url = Platform.OS === 'ios'
            ? 'https://apps.apple.com/ie/app/openlittermap/id1475982147'
            : 'https://play.google.com/store/apps/details?id=com.geotech.openlittermap';

        const canOpen = await Linking.canOpenURL(url);

        canOpen && (await Linking.openURL(url));
    }

    return (
        <View style={styles.container}>
            <Image
                source={require('../assets/illustrations/new_update.png')}
                style={styles.imageStyle}
            />
            <Title dictionary={'New Version Available'} />
            <Body
                color="muted"
                style={styles.bodyText}
                dictionary={'Please update the app for an improved experience'}
            />
            <Pressable
                style={styles.buttonStyle}
                onPress={handleButtonClick}>
                <Body
                    color="white"
                    dictionary={'Update Now'}
                />
            </Pressable>
            <Pressable onPress={() => navigation.goBack()}>
                <Body dictionary={'Not now, Later'} />
            </Pressable>
        </View>
    );
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

export default NewUpdateScreen;
