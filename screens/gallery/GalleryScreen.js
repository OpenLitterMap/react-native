import React, { Component } from 'react';
import {
    Text,
    StyleSheet,
    View,
    Pressable,
    FlatList,
    Dimensions,
    Image
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../actions';
import { Header, SubTitle, Body } from '../components';

const { width } = Dimensions.get('window');
class GalleryScreen extends Component {
    constructor(props) {
        super(props);
    }

    renderImage({ item, index }) {
        // console.log(JSON.stringify(item.item, null, 2));
        return (
            <Image
                key={item.uri}
                source={{ uri: item.uri }}
                style={{
                    width: width / 3 - 2,
                    height: width / 3 - 2,
                    margin: 1
                }}
            />
        );
    }
    render() {
        const { geotaggedImages } = this.props;
        console.log(JSON.stringify(geotaggedImages, null, 2));
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
                <View style={{ flexDirection: 'row' }}>
                    <FlatList
                        style={{ flexDirection: 'column' }}
                        numColumns={3}
                        data={geotaggedImages}
                        renderItem={(item, index) =>
                            this.renderImage(item, index)
                        }
                    />
                </View>
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
