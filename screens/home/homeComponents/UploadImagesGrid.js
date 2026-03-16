import React from 'react';
import {Image, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useDispatch} from 'react-redux';
import {Body, SubTitle} from '../../components';
import {isTagged} from '../../../utils/isTagged';
import {
    changeSwiperIndex,
    toggleSelectedImages
} from '../../../reducers/images_reducer';

const UploadImagesGrid = ({images, isSelecting, navigation}) => {
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    const dispatch = useDispatch();

    const imagePressed = index => {
        if (isSelecting) {
            dispatch(toggleSelectedImages(index));
        } else {
            // shared_reducer - Open LitterPicker modal

            // litter.js
            dispatch(changeSwiperIndex(index));

            navigation.navigate('ADD_TAGS');
        }
    };

    /**
     * Render images for uploading & tagging
     *
     * - Show each image in the grid
     * - Show icons for each image
     *   - isTagged
     *   - isPickedUp
     *   - isSelected: for deletion
     *
     * Flatlist expects "item" as the first key.
     * Each "item" is an image.
     */
    const renderImage = ({item, index}) => {
        const imageHasTags = isTagged(item);
        return (
            <Pressable onPress={() => imagePressed(index)}>
                <View style={{width: SCREEN_WIDTH / 3 - 2, height: SCREEN_WIDTH / 3 - 2, marginHorizontal: 0.5, marginTop: 1}}>
                    <Image
                        style={{width: SCREEN_WIDTH / 3 - 2, height: SCREEN_WIDTH / 3 - 2}}
                        source={{uri: item.uri ?? item.filename}}
                        resizeMode="cover"
                    />
                    {item.uploaded && (
                        <View style={{position: 'absolute', top: 5, left: 5}}>
                            <Text>☁</Text>
                        </View>
                    )}
                    {item.selected && (
                        <View style={styles.checkCircleContainer}>
                            <Text>🚮</Text>
                        </View>
                    )}
                    {imageHasTags && (
                        <View
                            style={{
                                position: 'absolute',
                                right: 30,
                                top: 6
                            }}>
                            <Text>🏷</Text>
                        </View>
                    )}
                    {item.picked_up && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 5,
                                right: 5
                            }}>
                            <Text>⬆️</Text>
                        </View>
                    )}
                </View>
            </Pressable>
        );
    };

    // Show empty state illustration when no images
    if (!images || images.length === 0) {
        return (
            <View
                style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 0.75
                }}>
                <Image
                    style={{width: SCREEN_WIDTH / 2, height: SCREEN_WIDTH / 2}}
                    source={require('../../../assets/illustrations/empty_image.png')}
                />
                <SubTitle
                    style={styles.emptyStateText}
                    dictionary={'No images to upload'}
                />
                <Body
                    style={styles.emptyStateText}
                    dictionary={'Take a photo and select it from the gallery'}
                />
            </View>
        );
    }

    return (
        <View style={{paddingTop: 1, paddingHorizontal: 0.5}}>
            {images && (
                <FlashList
                    contentContainerStyle={{paddingBottom: 100}}
                    data={images}
                    extraData={images}
                    keyExtractor={(img, index) =>
                        (img.uri || img.id || index).toString()
                    }
                    numColumns={3}
                    estimatedItemSize={140}
                    renderItem={renderImage}
                    keyboardShouldPersistTaps="handled"
                />
            )}
        </View>
    );
};

const styles = {
    emptyStateText: {
        textAlign: 'center',
        marginTop: 20,
        paddingHorizontal: 20
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

export default UploadImagesGrid;
