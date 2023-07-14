import React, { PureComponent } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    View,
    Pressable,
    Text
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { connect } from 'react-redux';
import * as actions from '../../../actions';
import { Body, Colors, SubTitle } from '../../components';
import { isTagged } from '../../../utils/isTagged';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

class UploadImagesGrid extends PureComponent {
    imagePressed(index) {
        const image = this.props.photos[index];

        if (this.props.isSelecting) {
            image.selected
                ? this.props.decrementSelected()
                : this.props.incrementSelected();

            this.props.toggleSelectedImage(index);
        } else {
            // shared_reducer - Open LitterPicker modal

            // litter.js
            this.props.swiperIndexChanged(index);
            this.props.navigation.navigate('ADD_TAGS');
        }
    }

    /**
     * Render images for uploading & tagging
     *
     * - Show each image in the grid
     * - Show icons for each image
     *   - isTagged
     *   - isPickedUp
     *   - isSelected: for deletion
     */
    renderImage = ({ item, index }) => {
        // console.log('renderImage', index, item);

        const isItemTagged = isTagged(item);
        const itemIsPickedUp = item.picked_up ?? null;
        const pickedUpIcon = itemIsPickedUp ? '👍🏻' : '👎🏻';
        const isItemUploaded = item.hasOwnProperty('uploaded') && item.uploaded;

        return (
            <Pressable onPress={() => this.imagePressed(index)}>
                <View style={styles.gridImageContainer}>
                    <Image
                        style={styles.gridImageStyle}
                        source={{
                            uri: item.hasOwnProperty('uri') && item.uri !== undefined
                                ? item.uri
                                : item.filename
                        }}
                        resizeMode="cover"
                    />
                    {isItemUploaded && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 5,
                                left: 5
                            }}>
                            <Text>☁</Text>
                        </View>
                    )}
                    {item.selected && (
                        <View style={styles.checkCircleContainer}>
                            <Text>🚮</Text>
                        </View>
                    )}
                    {isItemTagged && (
                        <View
                            style={{
                                position: 'absolute',
                                right: 30,
                                top: 6
                            }}>
                            <Text>🏷</Text>
                        </View>
                    )}
                    {itemIsPickedUp !== null && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5
                            }}>
                            <Text>{pickedUpIcon}</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    render() {
        const lang = this.props.lang;
        // Show empty state illustration when no images
        if (this.props.photos.length === 0) {
            return (
                <View
                    style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 0.75
                    }}>
                    <Image
                        style={styles.imageStyle}
                        source={require('../../../assets/illustrations/empty_image.png')}
                    />
                    <SubTitle
                        style={styles.exptyStateText}
                        dictionary={`${lang}.leftpage.no-images`}
                    />
                    <Body
                        style={styles.exptyStateText}
                        dictionary={`${lang}.leftpage.take-photo`}
                    />
                </View>
            );
        }

        return (
            <View
                style={{
                    paddingTop: 1,
                    paddingHorizontal: 0.5
                }}>
                {this.props.photos && (
                    <FlatList
                        contentContainerStyle={{ paddingBottom: 100 }}
                        data={this.props.photos}
                        extraData={this.props.uniqueValue}
                        keyExtractor={(item, index) => item + index}
                        numColumns={3}
                        renderItem={this.renderImage}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        );
    }
}

const styles = {
    exptyStateText: {
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20
    },
    imageStyle: {
        width: SCREEN_WIDTH / 2,
        height: SCREEN_WIDTH / 2
    },
    gridImageContainer: {
        width: SCREEN_WIDTH / 3 - 2,
        height: SCREEN_WIDTH / 3 - 2,
        marginHorizontal: 0.5,
        marginTop: 1
    },
    gridImageStyle: {
        width: SCREEN_WIDTH / 3 - 2,
        height: SCREEN_WIDTH / 3 - 2
    },
    checkCircleContainer: {
        position: 'absolute',
        width: 24,
        height: 24,
        right: 10,
        bottom: 10,
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center'
    }
};

export default connect(
    null,
    actions
)(UploadImagesGrid);
