import React from 'react';
import {FlatList, Image, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {useDispatch} from 'react-redux';
import {Body, Colors, SubTitle} from '../../components';
import {isTagged} from '../../../utils/isTagged';
import {
    changeSwiperIndex,
    toggleSelectedImages
} from '../../../reducers/images_reducer';
import {URL, IS_PRODUCTION} from '../../../actions/types';

const resolveUri = uri => {
    if (!IS_PRODUCTION && uri?.includes('127.0.0.1')) {
        const match = URL.match(/:\/\/([^:/]+)/);
        if (match) {
            return uri.replace('127.0.0.1', match[1]);
        }
    }
    return uri;
};

const UploadImagesGrid = ({images, isSelecting, navigation, untaggedCount, onTagUntagged, fetchingUntagged, untaggedPreview}) => {
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
    const tileSize = SCREEN_WIDTH / 3 - 2;

    const renderImage = ({item, index}) => {
        // Special tile for untagged server photos
        if (item._untaggedPreview) {
            return (
                <Pressable onPress={isSelecting ? undefined : onTagUntagged} disabled={isSelecting || fetchingUntagged}>
                    <View style={{width: tileSize, height: tileSize, marginHorizontal: 0.5, marginTop: 1, opacity: isSelecting ? 0.3 : 1}}>
                        <Image
                            style={{width: tileSize, height: tileSize, opacity: 0.7}}
                            source={{uri: resolveUri(item.filename)}}
                            resizeMode="cover"
                        />
                        <View style={{position: 'absolute', top: 5, left: 5}}>
                            <Text>☁</Text>
                        </View>
                        <View style={styles.untaggedCountBadge}>
                            <Text style={styles.untaggedCountText}>
                                {untaggedCount}
                            </Text>
                        </View>
                    </View>
                </Pressable>
            );
        }

        const imageHasTags = isTagged(item);
        // Adjust index to account for prepended preview tile
        const realIndex = untaggedPreview ? index - 1 : index;
        return (
            <Pressable onPress={() => imagePressed(realIndex)}>
                <View style={{width: tileSize, height: tileSize, marginHorizontal: 0.5, marginTop: 1}}>
                    <Image
                        style={{width: tileSize, height: tileSize}}
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

    // Build data: prepend untagged preview tile if available
    const previewTile = untaggedPreview && untaggedCount > 0
        ? [{...untaggedPreview, _untaggedPreview: true}]
        : [];
    // Filter out any image that duplicates the preview (same server ID)
    const localImages = untaggedPreview
        ? (images || []).filter(img => img.id !== untaggedPreview.id)
        : (images || []);
    const gridData = [...previewTile, ...localImages];

    // Show empty state only if no local images AND no untagged preview
    if (gridData.length === 0) {
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
            <FlatList
                contentContainerStyle={{paddingBottom: 100}}
                data={gridData}
                extraData={[images, untaggedCount]}
                keyExtractor={(img, index) =>
                    img._untaggedPreview
                        ? 'untagged-preview'
                        : (img.uri || img.id || index).toString()
                }
                numColumns={3}
                renderItem={renderImage}
                keyboardShouldPersistTaps="handled"
            />
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
    },
    untaggedCountBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        backgroundColor: Colors.accent,
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6
    },
    untaggedCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700'
    }
};

export default UploadImagesGrid;
