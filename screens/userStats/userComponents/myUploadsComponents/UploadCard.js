import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption, Colors } from '../../../components';
import TagChips from './TagChips';
import dayjs from '../../../../utils/dayjs';
import { useTranslation } from 'react-i18next';

const UploadCard = ({ item }) => {
    const { t } = useTranslation();
    const isTagged = item.new_tags && item.new_tags.length > 0;
    const totalTags = item.total_tags || (item.new_tags?.length || 0);
    const xp = item.xp || 0;
    const teamName = item.team?.name;

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
                <Caption style={styles.timeAgo}>
                    {dayjs(item.datetime).fromNow()}
                </Caption>
            </View>

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
        </View>
    );
};

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
    timeAgo: {
        marginLeft: 8,
        opacity: 0.5
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
    }
});

export default UploadCard;
