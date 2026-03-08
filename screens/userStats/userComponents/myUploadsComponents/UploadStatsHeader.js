import React from 'react';
import { StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Caption } from '../../../components';
import { useTranslation } from 'react-i18next';

const StatCell = ({ icon, value, label, color }) => (
    <View style={styles.cell}>
        <Icon name={icon} size={16} color={color} style={styles.icon} />
        <Body style={[styles.value, { color }]}>
            {(value || 0).toLocaleString()}
        </Body>
        <Caption>{label}</Caption>
    </View>
);

const UploadStatsHeader = React.memo(({ totalPhotos, totalTags, totalXp, leftToTag }) => {
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <StatCell
                icon="camera-outline"
                value={totalPhotos}
                label={t('Photos')}
                color="#8b5cf6"
            />
            <StatCell
                icon="pricetag-outline"
                value={totalTags}
                label={t('Tags')}
                color="#14b8a6"
            />
            <StatCell
                icon="star-outline"
                value={totalXp}
                label={t('XP')}
                color="#f59e0b"
            />
            {leftToTag > 0 && (
                <StatCell
                    icon="time-outline"
                    value={leftToTag}
                    label={t('To Tag')}
                    color="#ef4444"
                />
            )}
        </View>
    );
});

UploadStatsHeader.displayName = 'UploadStatsHeader';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8
    },
    cell: {
        flex: 1,
        alignItems: 'center'
    },
    icon: {
        marginBottom: 4
    },
    value: {
        fontSize: 18,
        fontWeight: '600'
    }
});

export default UploadStatsHeader;

