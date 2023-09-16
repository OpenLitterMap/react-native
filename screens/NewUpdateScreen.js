import React, {Component} from 'react';
import {
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {connect} from 'react-redux';
import * as actions from '../actions';
import {Body, Colors, Title} from './components';

class NewUpdateScreen extends Component {
    constructor(props) {
        super(props);
    }

    async handleButtonClick() {
        const url =
            Platform.OS === 'ios'
                ? 'https://apps.apple.com/ie/app/openlittermap/id1475982147'
                : 'https://play.google.com/store/apps/details?id=com.geotech.openlittermap';

        const canOpen = await Linking.canOpenURL(url);

        canOpen && (await Linking.openURL(url));
    }

    render() {
        const {navigation, route, lang} = this.props;
        const {url} = route.params;
        return (
            <View style={styles.container}>
                <Image
                    source={require('../assets/illustrations/new_update.png')}
                    style={styles.imageStyle}
                />
                <Title dictionary={`${lang}.permission.new-version`} />
                <Body
                    color="muted"
                    style={styles.bodyText}
                    dictionary={`${lang}.permission.please-update-app`}
                />
                <Pressable
                    style={styles.buttonStyle}
                    onPress={() => this.handleButtonClick()}>
                    <Body
                        color="white"
                        dictionary={`${lang}.permission.update-now`}
                    />
                </Pressable>
                <Pressable onPress={() => navigation.navigate('HOME')}>
                    <Body dictionary={`${lang}.permission.not-now`} />
                </Pressable>
            </View>
        );
    }
}

const mapStateToProps = state => {
    return {
        lang: state.auth.lang
    };
};

export default connect(mapStateToProps, actions)(NewUpdateScreen);

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
