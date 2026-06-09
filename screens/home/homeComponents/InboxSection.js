import React from 'react';
import {
    Image,
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
    <Pressable
        style={styles.thumb}
        disabled={!photo.hasGps && !isSelecting}
        onPress={() => onPress(photo)}>
        <Image source={{uri: photo.uri}} style={styles.thumbImage} />
        {/* Non-geotagged photos can't be mapped — grey them out (and, outside
            delete mode, they're inert: only geotagged photos can be tagged) */}
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
export const InboxControls = ({count, isSelecting, selectedCount, onToggleDelete, onDeleteSelected, onAddPhotos}) => {
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
                        <Pressable onPress={onAddPhotos} style={styles.headerButtonAccent}>
                            <Icon name="add" size={14} color={Colors.white} />
                            <Body style={styles.headerButtonAccentText}>{t('Add Photos')}</Body>
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

/** Inbox empty state — the primary first-run call to action. */
export const InboxEmpty = ({onAddPhotos}) => {
    const {t} = useTranslation();
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Icon name="images-outline" size={48} color={Colors.accent} />
            </View>
            <Body style={styles.emptyTitle}>
                {t('Add your litter photos to start tagging')}
            </Body>
            <Caption color="muted" style={styles.emptyText}>
                {t('Choose litter photos from your gallery — only the photos you pick are uploaded.')}
            </Caption>
            <Pressable onPress={onAddPhotos} style={styles.addPhotosPrimary}>
                <Icon name="add" size={18} color={Colors.white} />
                <Body style={styles.addPhotosPrimaryText}>{t('Add Photos')}</Body>
            </Pressable>
        </View>
    );
};

/** Per-photo notice for picks that had no GPS (can't be mapped). Dismissible. */
export const NoGpsPicksCard = ({picks, onDismiss}) => {
    const {t} = useTranslation();
    if (!picks || picks.length === 0) return null;
    return (
        <View style={styles.noGpsCard}>
            <View style={styles.noGpsHeader}>
                <Icon name="location-outline" size={16} color={Colors.error} />
                <Body style={styles.noGpsTitle}>{t("Couldn't add — no location data")}</Body>
                <Pressable onPress={onDismiss} hitSlop={8} style={styles.noGpsDismiss}>
                    <Icon name="close" size={18} color={Colors.muted} />
                </Pressable>
            </View>
            {picks.map(p => (
                <View key={p.uri} style={styles.noGpsRow}>
                    <Image source={{uri: p.uri}} style={styles.noGpsThumb} />
                    <Caption color="muted" numberOfLines={1} style={styles.noGpsName}>
                        {p.filename || t('Photo')}
                    </Caption>
                    <Caption style={styles.noGpsTag}>{t('No location data')}</Caption>
                </View>
            ))}
        </View>
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
    emptyIconCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    emptyTitle: {
        fontSize: 16, fontWeight: '600', color: Colors.text ?? '#222',
        textAlign: 'center', marginBottom: 6
    },
    addPhotosPrimary: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 24, marginTop: 18
    },
    addPhotosPrimaryText: {color: Colors.white, fontSize: 15, fontWeight: '600'},
    noGpsCard: {
        marginHorizontal: 16, marginBottom: 12, padding: 12,
        borderRadius: 12, borderWidth: 1, borderColor: Colors.error,
        backgroundColor: 'rgba(231,76,60,0.06)'
    },
    noGpsHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8},
    noGpsTitle: {flex: 1, fontSize: 13, fontWeight: '600', color: Colors.error},
    noGpsDismiss: {padding: 2},
    noGpsRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4},
    noGpsThumb: {width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.accentLight},
    noGpsName: {flex: 1, fontSize: 12},
    noGpsTag: {fontSize: 11, color: Colors.error, fontWeight: '600'}
});
