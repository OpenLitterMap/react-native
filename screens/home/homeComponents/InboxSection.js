import React from 'react';
import {
    ActivityIndicator,
    Image,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {Colors} from '../../components/theme';
import {Body, Caption} from '../../components/typography';

dayjs.extend(relativeTime);

export const NUM_COLUMNS = 3;

const formatRelativeTime = (timestampSeconds) => {
    return dayjs.unix(timestampSeconds).fromNow();
};

export const InboxThumbnail = React.memo(({photo, onPress, isSelecting, isSelected, hasTag}) => (
    <Pressable style={styles.thumb} onPress={() => onPress(photo)}>
        <Image source={{uri: photo.uri}} style={styles.thumbImage} />
        {/* Non-geotagged photos can't be mapped — grey them out */}
        {!photo.hasGps && <View style={styles.mutedOverlay} />}
        {isSelecting ? (
            <View style={[styles.selectBadge, isSelected && styles.selectBadgeActive]}>
                {isSelected && <Icon name="checkmark" size={14} color={Colors.white} />}
            </View>
        ) : (
            <>
                {hasTag && (
                    <View style={styles.tagBadge}>
                        <Icon name="pricetag" size={12} color={Colors.white} />
                    </View>
                )}
                {/* Pin emoji marks a geotagged (mappable) photo */}
                {photo.hasGps && <Text style={styles.pinEmoji}>📍</Text>}
            </>
        )}
        {photo.fromCamera && (
            <View style={styles.cameraBadge}>
                <Icon name="camera" size={12} color={Colors.white} />
            </View>
        )}
        <View style={styles.timeOverlay}>
            <Caption style={styles.timeText} numberOfLines={1}>
                {formatRelativeTime(photo.date)}
            </Caption>
        </View>
        {isSelecting && isSelected && <View style={styles.selectedOverlay} />}
    </Pressable>
));

/** Inbox header: title + select/delete controls + delete bar (FlashList header). */
export const InboxControls = ({count, isSelecting, selectedCount, onToggleDelete, onDeleteSelected, onSelectMore}) => {
    const {t} = useTranslation();
    return (
        <View style={styles.controls}>
            <View style={styles.headerRow}>
                <Body style={styles.sectionTitle}>
                    {t('Your Photos')} ({count})
                </Body>
                <View style={styles.headerActions}>
                    {count > 0 && (
                        <Pressable onPress={onToggleDelete} style={styles.headerButton}>
                            <Body style={styles.headerButtonText}>
                                {isSelecting ? t('Cancel') : t('Delete')}
                            </Body>
                        </Pressable>
                    )}
                    {!isSelecting && (
                        <Pressable onPress={onSelectMore} style={styles.headerButtonAccent}>
                            <Icon name="add" size={14} color={Colors.white} />
                            <Body style={styles.headerButtonAccentText}>{t('Select More')}</Body>
                        </Pressable>
                    )}
                </View>
            </View>
            {isSelecting && selectedCount > 0 && (
                <Pressable onPress={onDeleteSelected} style={styles.deleteBar}>
                    <Icon name="trash-outline" size={16} color={Colors.white} />
                    <Body style={styles.deleteBarText}>
                        {t('Delete')} ({selectedCount})
                    </Body>
                </Pressable>
            )}
        </View>
    );
};

/** Inbox empty / permission / searching states (FlashList ListEmptyComponent). */
export const InboxEmpty = ({permissionStatus, requestPermission, totalGalleryPhotos, hasMorePages, isLoading, onLoadMore}) => {
    const {t} = useTranslation();
    const openSettings = () =>
        Platform.OS === 'ios' ? Linking.openURL('app-settings:') : Linking.openSettings();

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
                <Pressable onPress={openSettings} style={styles.grantAccessButton}>
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
                <Pressable onPress={openSettings} style={styles.grantAccessButton}>
                    <Body style={styles.grantAccessText}>{t('Manage Photo Access')}</Body>
                </Pressable>
            </View>
        );
    }
    // No geotagged photos in what's loaded so far — offer to load more pages.
    return (
        <View style={styles.emptyContainer}>
            <Icon name="location-outline" size={40} color={Colors.muted} />
            <Body style={styles.emptyText}>
                {t('Select Photos To Tag & Upload')}
            </Body>
            {hasMorePages && (
                <Pressable onPress={onLoadMore} disabled={isLoading} style={styles.manageAccessButton}>
                    {isLoading ? (
                        <ActivityIndicator size="small" color={Colors.accent} />
                    ) : (
                        <Body style={styles.manageAccessText}>{t('Load more photos')}</Body>
                    )}
                </Pressable>
            )}
        </View>
    );
};

/** Inbox footer: load-more / keep-looking (FlashList ListFooterComponent). */
export const InboxFooter = ({count, hasMoreToShow, isLoading, onLoadMore}) => {
    const {t} = useTranslation();
    if (!(count > 0 && hasMoreToShow)) {
        return null;
    }
    return (
        <Pressable onPress={onLoadMore} disabled={isLoading} style={styles.showOlderButton}>
            {isLoading ? (
                <ActivityIndicator size="small" color={Colors.accent} />
            ) : (
                <Body style={styles.showOlderText}>{t('Load more photos')}</Body>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    controls: {
        paddingTop: 8
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
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
    headerButtonAccent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.accent
    },
    headerButtonAccentText: {
        color: Colors.white,
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
    // Fills its grid column (device-consistent — no fixed width); square tiles
    // with even 6px gutters (3px margin all round) and clipped rounded corners.
    thumb: {
        flex: 1,
        aspectRatio: 1,
        margin: 3,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: Colors.accentLight
    },
    thumbImage: {
        width: '100%',
        height: '100%'
    },
    pinEmoji: {
        position: 'absolute',
        top: 3,
        right: 4,
        fontSize: 15,
        textShadowColor: 'rgba(0,0,0,0.45)',
        textShadowOffset: {width: 0, height: 1},
        textShadowRadius: 2
    },
    // Soft grey wash over non-geotagged (un-mappable) photos
    mutedOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(150,150,150,0.45)'
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 26,
        left: 6,
        backgroundColor: Colors.accent,
        borderRadius: 8,
        padding: 3
    },
    tagBadge: {
        position: 'absolute',
        top: 6,
        left: 6,
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
