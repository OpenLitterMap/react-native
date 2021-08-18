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
import AsyncStorage from '@react-native-community/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import * as actions from '../../actions';
import { Header, SubTitle, Body } from '../components';

const { width } = Dimensions.get('window');
class GalleryScreen extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selected: []
        };
    }

    async handleDoneClick() {
        const sortedArray = await this.state.selected.sort(
            (a, b) => a.id - b.id
        );
        this.props.photosFromGallery(sortedArray);

        AsyncStorage.setItem(
            'openlittermap-gallery',
            JSON.stringify(this.state.selected)
        ).then(_ => {
            return true;
        });
    }

    selectImage(item) {
        const selectedArray = this.state.selected;
        const index = selectedArray.indexOf(item);
        if (index !== -1) {
            this.setState({
                selected: this.state.selected.filter((_, i) => i !== index)
            });
        }

        if (index === -1) {
            this.setState(prevState => {
                return { selected: [...prevState.selected, item] };
            });
        }
    }

    renderImage({ item, index }) {
        // console.log(JSON.stringify(item.item, null, 2));
        const selected = this.state.selected.includes(item);

        return (
            <Pressable onPress={() => this.selectImage(item)}>
                <Image
                    key={item.uri}
                    source={{ uri: item.uri }}
                    style={{
                        width: width / 3 - 2,
                        height: width / 3 - 2,
                        margin: 1
                    }}
                />
                {selected && (
                    <View
                        style={{
                            position: 'absolute',
                            width: 30,
                            height: 30,
                            backgroundColor: '#0984e3',
                            right: 10,
                            bottom: 10,
                            borderRadius: 100,
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                        <Icon
                            name="ios-checkmark-outline"
                            size={24}
                            color="white"
                        />
                    </View>
                )}
            </Pressable>
        );
    }
    render() {
        const { geotaggedImages } = this.props;
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
                        </Pressable>
                    }
                    centerContent={<SubTitle color="white">Geotagged</SubTitle>}
                    rightContent={
                        <Pressable
                            onPress={async () => {
                                await this.handleDoneClick();
                                this.props.navigation.navigate('HOME');
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
                        extraData={this.state.selected}
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
