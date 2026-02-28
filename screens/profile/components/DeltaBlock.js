import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const BRAND = '#27ae60';
const TEXT_TERTIARY = '#bbbbbb';

const DeltaBlock = ({ deltas, isFirstVisit = false }) => {
    // First visit — no cached data to compare against
    if (isFirstVisit) return null;

    const positiveDeltas = (deltas || []).filter(d => d.value > 0);

    if (positiveDeltas.length === 0) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>
                    Upload some photos to see your progress here
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {positiveDeltas.map(d => (
                <Text key={d.label} style={styles.deltaText}>
                    +{d.value.toLocaleString()} {d.label}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 24,
        paddingBottom: 24
    },
    deltaText: {
        fontSize: 15,
        fontFamily: 'Poppins-Medium',
        fontWeight: '500',
        color: BRAND,
        marginBottom: 4
    },
    emptyText: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        fontWeight: '400',
        color: TEXT_TERTIARY
    }
});

export default DeltaBlock;
