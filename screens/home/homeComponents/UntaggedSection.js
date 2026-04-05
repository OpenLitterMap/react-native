import React, {useCallback} from 'react';
import {
    FlatList,
    Image,
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import {useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import resolveUri from '../../../utils/resolveUri';
import {Colors} from '../../components/theme';
import {Body, Caption} from '../../components/typography';

const THUMB_SIZE = 100;

const UntaggedThumbnail = React.memo(({photo, onPress}) => {
    const uri = photo?.filename ? resolveUri(photo.filename) : null;

    return (
        <Pressable style={styles.thumb} onPress={() => onPress(photo)}>
            {uri ? (
                <Image source={{uri}} style={styles.thumbImage} />
            ) : (
                <View style={[styles.thumbImage, styles.thumbPlaceholder]}>
                    <Icon name="cloud-outline" size={28} color={Colors.muted} />
                </View>
            )}
            <View style={styles.warningBadge}>
                <Icon name="alert-circle" size={14} color={Colors.warn} />
            </View>
            {photo.city && (
                <Caption style={styles.thumbLocation} numberOfLines={1}>
                    {photo.city}
                </Caption>
            )}
        </Pressable>
    );
});

const UntaggedSection = ({onTagPhoto, onTagAll}) => {
    const {t} = useTranslation();
    const untaggedCount = useSelector(state => state.serverPhotos.untaggedCount);
    const untaggedPreviews = useSelector(state => state.serverPhotos.untaggedPreviews);

    const renderItem = useCallback(({item}) => (
        <UntaggedThumbnail photo={item} onPress={onTagPhoto} />
    ), [onTagPhoto]);

    if (!untaggedCount || untaggedCount === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.headerRow}>
                <Body style={styles.sectionTitle}>
                    {t('Needs Tagging')} ({untaggedCount})
                </Body>
                <Pressable onPress={onTagAll} style={styles.tagAllButton}>
                    <Body style={styles.tagAllText}>{t('Tag All')}</Body>
                </Pressable>
            </View>
            <FlatList
                data={untaggedPreviews}
                renderItem={renderItem}
                keyExtractor={item => String(item.id)}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

export default UntaggedSection;

const styles = StyleSheet.create({
    section: {
        paddingTop: 8,
        paddingBottom: 8
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
    tagAllButton: {
        backgroundColor: Colors.accent,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16
    },
    tagAllText: {
        color: Colors.white,
        fontSize: 13,
        fontWeight: '600'
    },
    listContent: {
        paddingHorizontal: 16
    },
    thumb: {
        width: THUMB_SIZE,
        marginRight: 10
    },
    thumbImage: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: 10,
        backgroundColor: Colors.accentLight
    },
    thumbPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center'
    },
    warningBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderRadius: 10,
        padding: 2
    },
    thumbLocation: {
        fontSize: 11,
        color: Colors.muted,
        marginTop: 4
    }
});
