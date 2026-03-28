import React, {useCallback, useMemo, useState} from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
    selectRecentGeotaggedPhotos,
    selectHasOlderGeotaggedPhotos,
    getPhotosFromCameraroll,
    expandRecencyWindow,
    dismissPhotos
} from '../../../reducers/gallery_reducer';
import {isTagged} from '../../../utils/isTagged';
import {Colors} from '../../components/theme';
import {Body, Caption} from '../../components/typography';

dayjs.extend(relativeTime);

const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const THUMB_SIZE = (SCREEN_WIDTH - 32 - (NUM_COLUMNS - 1) * 6) / NUM_COLUMNS;

const formatRelativeTime = (timestampSeconds) => {
    return dayjs.unix(timestampSeconds).fromNow();
};

const InboxThumbnail = React.memo(({photo, onPress, isSelecting, isSelected, hasTag}) => (
    <Pressable
        style={[styles.thumb, {width: THUMB_SIZE, height: THUMB_SIZE}]}
        onPress={() => onPress(photo)}>
        <Image source={{uri: photo.uri}} style={[styles.thumbImage, {width: THUMB_SIZE, height: THUMB_SIZE}]} />
        {isSelecting ? (
            <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
                {isSelected && <Icon name="checkmark" size={14} color={Colors.white} />}
            </View>
        ) : hasTag ? (
            <View style={styles.tagBadge}>
                <Icon name="pricetag" size={12} color={Colors.white} />
            </View>
        ) : null}
        <View style={styles.gpsBadge}>
            <Icon name="location" size={12} color={Colors.accent} />
        </View>
        <View style={styles.timeOverlay}>
            <Caption style={styles.timeText} numberOfLines={1}>
                {formatRelativeTime(photo.date)}
            </Caption>
        </View>
        {isSelecting && isSelected && <View style={styles.selectedOverlay} />}
    </Pressable>
));

const InboxSection = ({onTapPhoto, permissionStatus, requestPermission}) => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const recentPhotos = useSelector(selectRecentGeotaggedPhotos);
    const totalGalleryPhotos = useSelector(state => state.gallery.galleryImages.length);
    const hasMorePages = useSelector(state => state.gallery.hasMorePages);
    const hasOlderPhotos = useSelector(selectHasOlderGeotaggedPhotos);
    const fetchStatus = useSelector(state => state.gallery.fetchStatus);
    const isLoading = fetchStatus === 'loading';
    // Only show "Show older" when photos are already visible in the grid.
    // When the grid is empty, the empty-state message + settings button handles UX.
    const showOlderButton = recentPhotos.length > 0 && (hasMorePages || hasOlderPhotos);

    const imagesArray = useSelector(state => state.photos.imagesArray);
    const taggedUris = useMemo(() => {
        const set = new Set();
        for (const img of imagesArray) {
            if (img.uri && isTagged(img)) set.add(img.uri);
        }
        return set;
    }, [imagesArray]);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedUris, setSelectedUris] = useState(new Set());

    const handleShowOlder = useCallback(() => {
        dispatch(expandRecencyWindow());
        if (hasMorePages && !isLoading) {
            dispatch(getPhotosFromCameraroll('LOAD'));
        }
    }, [dispatch, hasMorePages, isLoading]);

    const handlePhotoPress = useCallback((photo) => {
        if (isSelecting) {
            setSelectedUris(prev => {
                const next = new Set(prev);
                if (next.has(photo.uri)) {
                    next.delete(photo.uri);
                } else {
                    next.add(photo.uri);
                }
                return next;
            });
        } else {
            onTapPhoto(photo);
        }
    }, [isSelecting, onTapPhoto]);

    const handleToggleDelete = useCallback(() => {
        setIsSelecting(prev => !prev);
        setSelectedUris(new Set());
    }, []);

    const handleDeleteSelected = useCallback(() => {
        if (selectedUris.size === 0) return;
        dispatch(dismissPhotos([...selectedUris]));
        setSelectedUris(new Set());
        setIsSelecting(false);
    }, [dispatch, selectedUris]);

    const renderItem = useCallback(({item}) => (
        <InboxThumbnail
            photo={item}
            onPress={handlePhotoPress}
            isSelecting={isSelecting}
            isSelected={selectedUris.has(item.uri)}
            hasTag={taggedUris.has(item.uri)}
        />
    ), [handlePhotoPress, isSelecting, selectedUris, taggedUris]);

    const handleOpenSettings = useCallback(() => {
        Platform.OS === 'ios'
            ? Linking.openURL('app-settings:')
            : Linking.openSettings();
    }, []);

    const renderEmpty = () => {
        if (permissionStatus === 'denied') {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="images-outline" size={40} color={Colors.muted} />
                    <Body style={styles.emptyText}>
                        {t('Allow photo access to see your recent photos here.')}
                    </Body>
                    <Pressable onPress={requestPermission} style={styles.grantAccessButton}>
                        <Body style={styles.grantAccessText}>{t('Grant Access')}</Body>
                    </Pressable>
                </View>
            );
        }
        if (permissionStatus === 'blocked') {
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="images-outline" size={40} color={Colors.muted} />
                    <Body style={styles.emptyText}>
                        {t('Photo access is turned off. Enable it in Settings to get started.')}
                    </Body>
                    <Pressable onPress={handleOpenSettings} style={styles.grantAccessButton}>
                        <Body style={styles.grantAccessText}>{t('Open Settings')}</Body>
                    </Pressable>
                </View>
            );
        }
        if (totalGalleryPhotos === 0) {
            // App has no photos from CameraRoll — user needs to select/share photos
            return (
                <View style={styles.emptyContainer}>
                    <Icon name="images-outline" size={40} color={Colors.muted} />
                    <Body style={styles.emptyText}>
                        {t('No photos available yet. Open Settings to choose which photos OpenLitterMap can access.')}
                    </Body>
                    <Pressable onPress={handleOpenSettings} style={styles.grantAccessButton}>
                        <Body style={styles.grantAccessText}>{t('Manage Photo Access')}</Body>
                    </Pressable>
                </View>
            );
        }
        // App has photos but none are geotagged within the recency window
        return (
            <View style={styles.emptyContainer}>
                <Icon name="camera-outline" size={40} color={Colors.muted} />
                <Body style={styles.emptyText}>
                    {t('No photos with location data in the last 7 days.')}
                </Body>
                <Caption style={styles.emptyHint}>
                    {t('Turn on location in your camera settings so new photos include where they were taken.')}
                </Caption>
                <Pressable onPress={handleOpenSettings} style={styles.manageAccessButton}>
                    <Icon name="settings-outline" size={14} color={Colors.accent} />
                    <Body style={styles.manageAccessText}>{t('Manage Photo Access')}</Body>
                </Pressable>
            </View>
        );
    };

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Body style={styles.sectionTitle}>
                    {t('Your Photos')} ({recentPhotos.length})
                </Body>
                {recentPhotos.length > 0 && (
                    <Pressable onPress={handleToggleDelete} style={styles.headerButton}>
                        <Body style={styles.headerButtonText}>
                            {isSelecting ? t('Cancel') : t('Delete')}
                        </Body>
                    </Pressable>
                )}
            </View>
            {isSelecting && selectedUris.size > 0 && (
                <Pressable onPress={handleDeleteSelected} style={styles.deleteBar}>
                    <Icon name="trash-outline" size={16} color={Colors.white} />
                    <Body style={styles.deleteBarText}>
                        {t('Delete')} ({selectedUris.size})
                    </Body>
                </Pressable>
            )}
            {recentPhotos.length === 0 && renderEmpty()}
            {recentPhotos.length > 0 && (
                <FlatList
                    data={recentPhotos}
                    renderItem={renderItem}
                    keyExtractor={item => String(item.id)}
                    numColumns={NUM_COLUMNS}
                    scrollEnabled={false}
                    contentContainerStyle={styles.gridContent}
                    columnWrapperStyle={styles.columnWrapper}
                    extraData={selectedUris}
                />
            )}
            {showOlderButton && (
                <Pressable
                    onPress={handleShowOlder}
                    disabled={isLoading}
                    style={styles.showOlderButton}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.accent} />
                    ) : (
                        <Body style={styles.showOlderText}>
                            {t('Show older photos')}
                        </Body>
                    )}
                </Pressable>
            )}
        </View>
    );
};

export default InboxSection;

const styles = StyleSheet.create({
    section: {
        paddingTop: 8,
        paddingBottom: 20
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.muted,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    headerButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.muted
    },
    headerButtonText: {
        color: Colors.muted,
        fontSize: 13,
        fontWeight: '600'
    },
    deleteBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginHorizontal: 16,
        marginBottom: 12,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: Colors.error
    },
    deleteBarText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600'
    },
    showOlderButton: {
        alignItems: 'center',
        paddingVertical: 14,
        marginHorizontal: 16,
        marginTop: 4,
        borderRadius: 10,
        backgroundColor: Colors.accentLight
    },
    showOlderText: {
        fontSize: 14,
        color: Colors.accent,
        fontWeight: '600'
    },
    gridContent: {
        paddingHorizontal: 16
    },
    columnWrapper: {
        gap: 6,
        marginBottom: 6
    },
    thumb: {
        borderRadius: 10,
        overflow: 'hidden'
    },
    thumbImage: {
        borderRadius: 10,
        backgroundColor: Colors.accentLight
    },
    gpsBadge: {
        position: 'absolute',
        bottom: 26,
        left: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        padding: 2
    },
    tagBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: Colors.accent,
        borderRadius: 10,
        padding: 3
    },
    selectBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.white,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    selectBadgeActive: {
        backgroundColor: Colors.error,
        borderColor: Colors.error
    },
    selectedOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(231,76,60,0.2)',
        borderRadius: 10
    },
    timeOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingVertical: 3,
        paddingHorizontal: 6,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10
    },
    timeText: {
        fontSize: 10,
        color: Colors.white
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 40
    },
    emptyText: {
        fontSize: 14,
        color: Colors.muted,
        textAlign: 'center',
        marginTop: 12
    },
    grantAccessButton: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginTop: 16
    },
    grantAccessText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '600'
    },
    emptyHint: {
        fontSize: 12,
        color: Colors.muted,
        textAlign: 'center',
        marginTop: 6
    },
    manageAccessButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    manageAccessText: {
        fontSize: 13,
        color: Colors.accent,
        fontWeight: '600'
    }
});
