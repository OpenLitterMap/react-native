import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption } from '../../../components';
import { getCategoryColor } from '../../../addTag/components/categoryColors';
import { useTranslation } from 'react-i18next';

const TagChips = React.memo(({ newTags = [], maxVisible = 3 }) => {
    const { t } = useTranslation();

    const chips = useMemo(() => {
        if (!newTags || newTags.length === 0) return [];

        // Build flat list of chips: CLO tags + custom tags from extra_tags
        const result = [];
        for (const tag of newTags) {
            const catKey = tag.category?.key || '';
            const objKey = tag.object?.key || '';
            const qty = tag.quantity || 1;

            // Skip unclassified.other if it only exists as a carrier for custom tags
            const isUnclassifiedOther = catKey === 'unclassified' && objKey === 'other';
            if (!isUnclassifiedOther) {
                let label = catKey && objKey
                    ? t(`litter.${catKey}.${objKey}`)
                    : objKey || catKey;

                // If tag has a type (e.g. "juice" for carton), prepend it
                const typeKey = tag.type?.key;
                if (typeKey) {
                    const typeName = t(`litter.types.${typeKey}`);
                    label = `${typeName} ${label}`;
                }

                result.push({
                    key: `${catKey}-${objKey}-${result.length}`,
                    label,
                    qty,
                    bg: getCategoryColor(catKey)
                });
            }

            // Add custom tags from extra_tags
            if (tag.extra_tags) {
                for (const extra of tag.extra_tags) {
                    if (extra.type === 'custom_tag' && extra.tag?.key) {
                        result.push({
                            key: `custom-${extra.tag.id}-${result.length}`,
                            label: extra.tag.key,
                            qty: 1,
                            bg: '#6b7280'
                        });
                    }
                }
            }
        }
        return result;
    }, [newTags, t]);

    if (chips.length === 0) return null;

    const visible = chips.slice(0, maxVisible);
    const overflow = chips.length - maxVisible;

    return (
        <View style={styles.container}>
            {visible.map(chip => (
                <View
                    key={chip.key}
                    style={[styles.chip, { backgroundColor: chip.bg }]}
                >
                    <Caption style={styles.chipText} color="white">
                        {chip.label}{chip.qty > 1 ? ` ${chip.qty}` : ''}
                    </Caption>
                </View>
            ))}
            {overflow > 0 && (
                <View style={[styles.chip, styles.overflowChip]}>
                    <Caption style={styles.chipText}>+{overflow} more</Caption>
                </View>
            )}
        </View>
    );
});

TagChips.displayName = 'TagChips';

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4
    },
    chip: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6
    },
    overflowChip: {
        backgroundColor: '#e0e0e0'
    },
    chipText: {
        fontSize: 11,
        letterSpacing: 0.3
    }
});

export default TagChips;
