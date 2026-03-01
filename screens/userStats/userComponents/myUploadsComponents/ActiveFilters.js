import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Body, Caption } from '../../../components';
import { useTranslation } from 'react-i18next';
import dayjs from '../../../../utils/dayjs';

const FilterChip = ({ label, onRemove }) => (
    <View style={styles.chip}>
        <Caption style={styles.chipText}>{label}</Caption>
        <Pressable onPress={onRemove} hitSlop={8}>
            <Icon name="close-circle" size={16} color="#888" />
        </Pressable>
    </View>
);

const ActiveFilters = ({ filters, onRemoveFilter, onClearAll }) => {
    const { t } = useTranslation();
    const chips = [];

    if (filters.filterTag) {
        chips.push({
            key: 'filterTag',
            label: `Tag: ${filters.filterTag}`
        });
    }

    if (filters.filterCustomTag) {
        chips.push({
            key: 'filterCustomTag',
            label: `Custom: ${filters.filterCustomTag}`
        });
    }

    if (filters.filterDateFrom) {
        const from = dayjs(filters.filterDateFrom).format('MMM D');
        const to = filters.filterDateTo
            ? dayjs(filters.filterDateTo).format('MMM D')
            : 'now';
        chips.push({
            key: 'filterDate',
            label: `${from} – ${to}`
        });
    } else if (filters.filterDateTo) {
        chips.push({
            key: 'filterDate',
            label: `Until ${dayjs(filters.filterDateTo).format('MMM D')}`
        });
    }

    if (chips.length === 0) return null;

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {chips.map(chip => (
                    <FilterChip
                        key={chip.key}
                        label={chip.label}
                        onRemove={() => onRemoveFilter(chip.key)}
                    />
                ))}
                <Pressable onPress={onClearAll} hitSlop={8}>
                    <Body style={styles.clearAll} color="accent">
                        {t('Clear all')}
                    </Body>
                </Pressable>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginHorizontal: 16,
        marginBottom: 8
    },
    scrollContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 100,
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 6
    },
    chipText: {
        fontSize: 12,
        color: '#333'
    },
    clearAll: {
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4
    }
});

export default ActiveFilters;
