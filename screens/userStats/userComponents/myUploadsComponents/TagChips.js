import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Caption } from '../../../components';
import { getCategoryColor } from '../../../addTag/components/categoryColors';
import { useTranslation } from 'react-i18next';

const TagChips = ({ newTags = [], maxVisible = 3 }) => {
    const { t } = useTranslation();

    if (!newTags || newTags.length === 0) return null;

    const visible = newTags.slice(0, maxVisible);
    const overflow = newTags.length - maxVisible;

    return (
        <View style={styles.container}>
            {visible.map((tag, index) => {
                const catKey = tag.category?.key || '';
                const objKey = tag.object?.key || '';
                const qty = tag.quantity || 1;
                const bg = getCategoryColor(catKey);
                const label = catKey && objKey
                    ? t(`litter.${catKey}.${objKey}`)
                    : objKey || catKey;

                return (
                    <View
                        key={`${catKey}-${objKey}-${index}`}
                        style={[styles.chip, { backgroundColor: bg }]}
                    >
                        <Caption style={styles.chipText} color="white">
                            {label}{qty > 1 ? ` ${qty}` : ''}
                        </Caption>
                    </View>
                );
            })}
            {overflow > 0 && (
                <View style={[styles.chip, styles.overflowChip]}>
                    <Caption style={styles.chipText}>+{overflow} more</Caption>
                </View>
            )}
        </View>
    );
};

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
