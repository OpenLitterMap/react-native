import React, {useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Body, Caption, Colors} from '../../components';

/**
 * 6 quick-select chips for the most common litter objects.
 * Onboarding-only — shown above the search bar during guided tagging.
 *
 * Each chip maps to an objectKey + preferred categoryKey to handle
 * multi-category objects (e.g. bottles exist in alcohol, beverages, etc.).
 * We pick the entry matching the preferred category, or first match if not found.
 */
const COMMON_ITEMS = [
    {objectKey: 'cigaretteButts', categoryKey: 'smoking', label: 'Cigarette butt', icon: '\uD83D\uDEAC'},
    {objectKey: 'bottlePlastic', categoryKey: 'softdrinks', label: 'Bottle', icon: '\uD83C\uDF76'},
    {objectKey: 'canDrink', categoryKey: 'softdrinks', label: 'Can', icon: '\uD83E\uDD6B'},
    {objectKey: 'sweetWrappers', categoryKey: 'food', label: 'Wrapper', icon: '\uD83C\uDF6C'},
    {objectKey: 'coffeeCup', categoryKey: 'coffee', label: 'Cup', icon: '\u2615'},
    {objectKey: 'plasticBag', categoryKey: 'softdrinks', label: 'Bag', icon: '\uD83D\uDECD\uFE0F'}
];

/**
 * Resolve chip entries from the tag catalogue.
 * Prefers the entry with the matching categoryKey to avoid picking the wrong
 * category for multi-category objects. Falls back to first match.
 */
const resolveChipEntries = (objectEntries) => {
    if (!objectEntries || objectEntries.length === 0) return [];

    return COMMON_ITEMS.map(item => {
        // Preferred: match objectKey + categoryKey
        const preferred = objectEntries.find(
            e => e.objectKey === item.objectKey && e.categoryKey === item.categoryKey
        );
        // Fallback: match objectKey only (first hit)
        const fallback = preferred || objectEntries.find(e => e.objectKey === item.objectKey);
        return fallback ? {...item, cloId: fallback.cloId, typeId: fallback.typeId ?? null} : null;
    }).filter(Boolean);
};

/**
 * @param {Object} props
 * @param {Array} props.objectEntries - From state.tags.objectEntries
 * @param {Function} props.onSelect - Called with (cloId, typeId) when a chip is tapped
 * @param {Array} props.selectedCloIds - Array of already-selected cloIds (to highlight)
 */
const OnboardingChips = ({objectEntries, onSelect, selectedCloIds = []}) => {
    const chips = useMemo(() => resolveChipEntries(objectEntries), [objectEntries]);

    if (chips.length === 0) return null;

    return (
        <View style={styles.container}>
            <Caption color="muted" style={styles.hint}>
                {'What can you see? Tap a tag or search below'}
            </Caption>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}>
                {chips.map(chip => {
                    const isSelected = selectedCloIds.includes(chip.cloId);

                    return (
                        <Pressable
                            key={chip.cloId}
                            onPress={() => onSelect(chip.cloId, chip.typeId)}
                            style={({pressed}) => [
                                styles.chip,
                                isSelected && styles.chipSelected,
                                pressed && styles.chipPressed
                            ]}>
                            <Body style={styles.chipIcon}>{chip.icon}</Body>
                            <Caption
                                family="medium"
                                color={isSelected ? 'white' : 'text'}
                                style={styles.chipLabel}>
                                {chip.label}
                            </Caption>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingVertical: 8
    },
    hint: {
        textAlign: 'center',
        marginBottom: 8,
        fontSize: 13
    },
    scrollContent: {
        paddingHorizontal: 16,
        gap: 8
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2
    },
    chipSelected: {
        backgroundColor: Colors.accent
    },
    chipPressed: {
        opacity: 0.8
    },
    chipIcon: {
        fontSize: 16,
        marginRight: 6
    },
    chipLabel: {
        fontSize: 13
    }
});

export default OnboardingChips;
