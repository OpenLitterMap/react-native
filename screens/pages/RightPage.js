import React, { PureComponent } from 'react';
import { Dimensions, Picker, Image, ScrollView, Text, TouchableHighlight, View } from 'react-native';
// import Constants from 'expo-constants';
import { Button, Card, Icon } from 'react-native-elements';
import { connect } from 'react-redux';
import * as actions from '../../actions';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

import LitterPicker from './LitterPicker';

// Load a users image from the database if they have uploaded from web
class RightPage extends PureComponent {

    UNSAFE_componentWillReceiveProps(nextProps) {
        console.log("Next props - right page");
        // console.log(nextProps);
    }

    render() {
        console.log("Render --- Right Page ---");
        return (
            <View style={{ flex: 1 }}>
                <LitterPicker rightPage="true" />
            </View>
        );
    }
}

const styles = {

}

const mapStateToProps = state => {
    return {
        photos: state.photos.photos,
        gallery: state.gallery.gallery,
        photoSelected: state.photos.photoSelected
    };
}

export default connect(mapStateToProps, actions)(RightPage);
