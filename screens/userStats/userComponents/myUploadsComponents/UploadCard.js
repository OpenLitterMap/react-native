import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Caption, Colors } from '../../../components';
import TagChips from './TagChips';
import dayjs from '../../../../utils/dayjs';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';

const UploadCard = React.memo(({ item, onEditTags, onDelete, onCopyLink, onOpenMap }) => {
    const { t } = useTranslation();
    const isTagged = (item.new_tags && item.new_tags.length > 0) || item.total_tags > 0;
    const totalTags = item.total_tags || (item.new_tags?.length || 0);
    const xp = item.xp || 0;
    const teamName = item.team?.name;
    const location = [item.city, item.state, item.country]
        .filter(Boolean)
        .join(', ');

    return (
        <View style={styles.card}>
            <View style={styles.statusRow}>
                <View
                    style={[
                        styles.statusDot,
                        { backgroundColor: isTagged ? Colors.accent : '#f59e0b' }
                    ]}
                />
                <Caption style={styles.statusText}>
                    {isTagged ? t('Tagged') : t('Untagged')}
                </Caption>
                {item.verified >= 2 && (
                    <View style={styles.verifiedBadge}>
                        <Icon name="checkmark-circle" size={12} color={Colors.accent} />
                        <Caption style={styles.verifiedText}>
                            {t('Verified')}
                        </Caption>
                    </View>
                )}
                {item.picked_up && (
                    <Icon
                        name="arrow-up-circle-outline"
                        size={14}
                        color={Colors.accent}
                        style={styles.pickedUpIcon}
                    />
                )}
                <Caption style={styles.timeAgo}>
                    {dayjs(item.datetime).fromNow()}
                </Caption>
            </View>

            {location ? (
                <View style={styles.locationRow}>
                    <Icon name="location-outline" size={12} color={Colors.muted} />
                    <Caption style={styles.locationText} numberOfLines={1}>
                        {location}
                    </Caption>
                </View>
            ) : null}

            <TagChips newTags={item.new_tags} />

            <View style={styles.statsRow}>
                <Caption>{totalTags} {t('tags')}</Caption>
                <Caption style={styles.statDivider}>|</Caption>
                <Caption>{xp} XP</Caption>
                {teamName && (
                    <>
                        <Caption style={styles.statDivider}>|</Caption>
                        <Caption numberOfLines={1} style={styles.teamName}>
                            {teamName}
                        </Caption>
                    </>
                )}
            </View>

            <View style={styles.actions}>
                <Pressable
                    style={styles.actionBtn}
                    onPress={() => onEditTags(item)}
                    hitSlop={6}
                >
                    <Icon name="pricetag-outline" size={16} color={Colors.accent} />
                    <Caption style={[styles.actionLabel, { color: Colors.accent }]}>
                        {t('Edit Tags')}
                    </Caption>
                </Pressable>

                <Pressable
                    style={styles.actionBtn}
                    onPress={() => onCopyLink(item)}
                    hitSlop={6}
                >
                    <Icon name="link-outline" size={16} color={Colors.muted} />
                    <Caption style={styles.actionLabel}>{t('Copy Link')}</Caption>
                </Pressable>

                <Pressable
                    style={styles.actionBtn}
                    onPress={() => onOpenMap(item)}
                    hitSlop={6}
                >
                    <Icon name="map-outline" size={16} color={Colors.muted} />
                    <Caption style={styles.actionLabel}>{t('Map')}</Caption>
                </Pressable>

                <Pressable
                    style={styles.actionBtn}
                    onPress={() => onDelete(item)}
                    hitSlop={6}
                >
                    <Icon name="trash-outline" size={16} color={Colors.error} />
                    <Caption style={[styles.actionLabel, { color: Colors.error }]}>
                        {t('Delete')}
                    </Caption>
                </Pressable>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginVertical: 6
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500'
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
        gap: 2
    },
    verifiedText: {
        fontSize: 10,
        color: Colors.accent,
        fontWeight: '500'
    },
    pickedUpIcon: {
        marginLeft: 6
    },
    timeAgo: {
        marginLeft: 'auto',
        opacity: 0.5
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4
    },
    locationText: {
        fontSize: 11,
        opacity: 0.6,
        flexShrink: 1
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6
    },
    statDivider: {
        opacity: 0.3
    },
    teamName: {
        flexShrink: 1
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e5e7eb'
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 2
    },
    actionLabel: {
        fontSize: 11,
        color: Colors.muted
    }
});

UploadCard.displayName = 'UploadCard';

export default UploadCard;
