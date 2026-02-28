import {Pressable, StyleSheet, View} from 'react-native';
import React from 'react';
import RankingMedal from './RankingMedal';
import {Body, Caption} from '../../components';
import dayjs from '../../../utils/dayjs';

const LocationListCard = ({location, index, onPress}) => {
    const photos = location.photos || location.total_images || 0;
    const tags = location.tags || location.total_tags || 0;
    const people = location.contributors || location.total_members || 0;
    const updatedAt = location.updated_at || location.last_updated_at;

    return (
        <Pressable
            style={({pressed}) => [
                styles.cardContainer,
                pressed && styles.cardPressed
            ]}
            onPress={onPress}>
            <View style={styles.leftSection}>
                <RankingMedal index={index} />
                <View style={styles.nameContainer}>
                    <Body style={{flexShrink: 1}} numberOfLines={1}>
                        {location.name || location.country}
                    </Body>
                    <View style={styles.statsRow}>
                        <Caption>
                            {photos.toLocaleString()} Photos
                        </Caption>
                        <Caption style={styles.statDivider}>|</Caption>
                        <Caption>
                            {tags.toLocaleString()} Tags
                        </Caption>
                        <Caption style={styles.statDivider}>|</Caption>
                        <Caption>
                            {people.toLocaleString()}{' '}
                            People
                        </Caption>
                    </View>
                    {updatedAt && (
                        <Caption style={styles.updatedAt}>
                            Updated {dayjs(updatedAt).fromNow()}
                        </Caption>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 12,
        padding: 12,
        marginVertical: 6
    },
    cardPressed: {
        backgroundColor: '#f0f1f3'
    },
    leftSection: {
        flexDirection: 'row',
        flexShrink: 1,
        alignItems: 'center'
    },
    nameContainer: {
        marginLeft: 12,
        flexShrink: 1
    },
    statsRow: {
        flexDirection: 'row',
        marginTop: 4,
        alignItems: 'center',
        gap: 6
    },
    statDivider: {
        opacity: 0.3
    },
    updatedAt: {
        marginTop: 2,
        opacity: 0.5
    }
});

export default LocationListCard;
