import React, { Component } from 'react';
import { Text, StyleSheet, View, Pressable } from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../actions';
import { Header, SubTitle, Body } from '../components';

class GalleryScreen extends Component {
    constructor(props) {
        super(props);
    }
    render() {
        return (
            <>
                <Header
                    leftContent={
                        <Pressable
                            onPress={() => {
                                this.props.navigation.navigate('HOME');
                                // this.props.setImageLoading;
                            }}>
                            <Body color="white">Cancel</Body>
                            {/* <Icon
                                name="ios-chevron-back-outline"
                                size={24}
                                color="white"
                            /> */}
                        </Pressable>
                    }
                    centerContent={<SubTitle color="white">Geotagged</SubTitle>}
                    rightContent={
                        <Pressable
                            onPress={() => {
                                // this._chooseImages();
                            }}>
                            <Body color="white">Done</Body>
                        </Pressable>
                    }
                />
            </>
        );
    }
}

const mapStateToProps = state => {
    return {
        geotaggedImages: state.gallery.geotaggedImages
    };
};

export default connect(
    mapStateToProps,
    actions
)(GalleryScreen);

const styles = StyleSheet.create({});
