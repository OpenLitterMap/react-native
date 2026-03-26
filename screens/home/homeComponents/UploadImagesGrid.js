import React, {useCallback, useMemo} from 'react';
import {FlatList, Image, Pressable, Text, useWindowDimensions, View} from 'react-native';
import {useDispatch} from 'react-redux';
import {Body, Colors, SubTitle} from '../../components';
import {isTagged} from '../../../utils/isTagged';
import {
    changeSwiperIndex,
    toggleSelectedImages
} from '../../../reducers/photos_reducer';
import resolveUri from '../../../utils/resolveUri';

const UploadGridTile = React.memo(({
    item,
    index,
    isSelecting,
    onTagUntagged,
    fetchingUntagged,
    untaggedCount,
    untaggedPreview,
    tileSize,
    onImagePress
}) => {
    // Special tile for untagged server photos
    if (item._untaggedPreview) {
        return (
            <Pressable onPress={isSelecting ? undefined : onTagUntagged} disabled={isSelecting || fetchingUntagged}>
                <View style={{width: tileSize, height: tileSize, marginHorizontal: 0.5, marginTop: 1, opacity: isSelecting ? 0.3 : 1}}>
                    <Image
                        style={{width: tileSize, height: tileSize}}
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
    const realIndex = untaggedPreview ? index - 1 : index;

    return (
        <Pressable onPress={() => onImagePress(realIndex)}>
            <View style={{width: tileSize, height: tileSize, marginHorizontal: 0.5, marginTop: 1}}>
                <Image
                    style={{width: tileSize, height: tileSize}}
                    source={{uri: resolveUri(item.uri ?? item.filename)}}
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
}, (prev, next) => (
    prev.item === next.item &&
    prev.index === next.index &&
    prev.isSelecting === next.isSelecting &&
    prev.fetchingUntagged === next.fetchingUntagged &&
    prev.untaggedCount === next.untaggedCount &&
    prev.untaggedPreview?.id === next.untaggedPreview?.id &&
    prev.tileSize === next.tileSize &&
    prev.onTagUntagged === next.onTagUntagged &&
    prev.onImagePress === next.onImagePress
));

const UploadImagesGrid = ({images, isSelecting, navigation, untaggedCount, onTagUntagged, fetchingUntagged, untaggedPreview}) => {
    const {width: SCREEN_WIDTH} = useWindowDimensions();
    const dispatch = useDispatch();

    const imagePressed = useCallback(index => {
        if (isSelecting) {
            dispatch(toggleSelectedImages(index));
        } else {
            dispatch(changeSwiperIndex(index));
            navigation.navigate('ADD_TAGS');
        }
    }, [dispatch, isSelecting, navigation]);

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

    const renderImage = useCallback(({item, index}) => {
        return (
            <UploadGridTile
                item={item}
                index={index}
                isSelecting={isSelecting}
                onTagUntagged={onTagUntagged}
                fetchingUntagged={fetchingUntagged}
                untaggedCount={untaggedCount}
                untaggedPreview={untaggedPreview}
                tileSize={tileSize}
                onImagePress={imagePressed}
            />
        );
    }, [fetchingUntagged, imagePressed, isSelecting, onTagUntagged, tileSize, untaggedCount, untaggedPreview]);

    // Build data: prepend untagged preview tile if available
    const gridData = useMemo(() => {
        const previewTile = untaggedPreview && untaggedCount > 0
            ? [{...untaggedPreview, _untaggedPreview: true}]
            : [];
        const localImages = untaggedPreview
            ? (images || []).filter(img => img.id !== untaggedPreview.id)
            : (images || []);
        return [...previewTile, ...localImages];
    }, [images, untaggedPreview, untaggedCount]);

    const getItemLayout = useCallback((_, index) => {
        const row = Math.floor(index / 3);
        const length = tileSize + 1;
        return {
            length,
            offset: row * length,
            index
        };
    }, [tileSize]);

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
                keyExtractor={(img, index) =>
                    img._untaggedPreview
                        ? 'untagged-preview'
                        : (img.uri || img.id || index).toString()
                }
                getItemLayout={getItemLayout}
                initialNumToRender={15}
                numColumns={3}
                renderItem={renderImage}
                keyboardShouldPersistTaps="handled"
                maxToRenderPerBatch={12}
                removeClippedSubviews
                windowSize={7}
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
