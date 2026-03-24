import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CountUp } from 'use-count-up';

import { formatOrdinal } from '../helpers/ordinal';

const TEXT_SECONDARY = '#888888';

// Each stat gets a colour that means something
const COLORS = {
    rank: '#7c3aed',     // purple — prestige
    tags: '#ea580c',     // orange — effort
    photos: '#3b82f6',   // blue — creative
    littercoin: '#27ae60' // green — littercoin
};

const StatCell = ({
    value,
    startValue,
    label,
    color,
    ordinal = false,
    reduceMotion = false,
    accessibilityLabel
}) => {
    const shouldAnimate =
        !reduceMotion &&
        startValue !== undefined &&
        startValue !== value;

    const hasValue = value != null && value > 0;

    return (
        <View
            style={styles.cell}
            accessible
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="text"
        >
            <Text style={[styles.number, { color }]}>
                {!hasValue ? (
                    '\u2013'
                ) : shouldAnimate ? (
                    <CountUp
                        isCounting
                        start={startValue}
                        end={value}
                        duration={4}
                        formatter={v => {
                            const n = Math.floor(v);
                            return ordinal
                                ? formatOrdinal(n)
                                : n.toLocaleString();
                        }}
                        decimalPlaces={0}
                    />
                ) : ordinal ? (
                    formatOrdinal(value)
                ) : (
                    value.toLocaleString()
                )}
            </Text>
            <Text style={styles.label}>{label}</Text>
        </View>
    );
};

const StatsGrid = ({
    rank = 0,
    prevRank,
    totalUsers = 0,
    tags = 0,
    prevTags,
    photos = 0,
    prevPhotos,
    littercoin = 0,
    prevLittercoin,
    reduceMotion = false
}) => {
    return (
        <View style={styles.container}>
            {/* Row 1: Rank + Tags */}
            <View style={styles.row}>
                <StatCell
                    value={rank}
                    startValue={prevRank}
                    label={
                        totalUsers > 0
                            ? `of ${totalUsers.toLocaleString()}`
                            : 'global rank'
                    }
                    color={COLORS.rank}
                    ordinal
                    reduceMotion={reduceMotion}
                    accessibilityLabel={`${formatOrdinal(rank)} of ${totalUsers.toLocaleString()}, global rank`}
                />

                <StatCell
                    value={tags}
                    startValue={prevTags}
                    label="tags"
                    color={COLORS.tags}
                    reduceMotion={reduceMotion}
                    accessibilityLabel={`${tags.toLocaleString()} tags`}
                />
            </View>

            {/* Row 2: Photos + Littercoin */}
            <View style={styles.row}>
                <StatCell
                    value={photos}
                    startValue={prevPhotos}
                    label="photos"
                    color={COLORS.photos}
                    reduceMotion={reduceMotion}
                    accessibilityLabel={`${photos.toLocaleString()} photos`}
                />

                <StatCell
                    value={littercoin}
                    startValue={prevLittercoin}
                    label="littercoin"
                    color={COLORS.littercoin}
                    reduceMotion={reduceMotion}
                    accessibilityLabel={`${littercoin.toLocaleString()} littercoin`}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingTop: 8,
        paddingBottom: 16
    },
    row: {
        flexDirection: 'row',
        marginBottom: 28
    },
    cell: {
        flex: 1
    },
    number: {
        fontSize: 28,
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '600'
    },
    label: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: TEXT_SECONDARY,
        marginTop: 2
    }
});

export default StatsGrid;
