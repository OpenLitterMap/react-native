import React, {useCallback, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSelector} from 'react-redux';
import {Caption, Colors} from '../../components';
import {makeTagKey, resolveTagEntry} from './tagUtils';

const QuickTags = ({
    currentTags,
    entriesByCloId,
    typeEntriesByKey,
    onAddTagWithPreset
}) => {
    const presets = useSelector(state => state.quickTags.presets);

    const currentKeys = useMemo(() => {
        const keys = new Set();
        for (const t of currentTags || []) {
            keys.add(makeTagKey(t.cloId, t.typeId));
        }
        return keys;
    }, [currentTags]);

    const chips = useMemo(() => {
        return presets.map(preset => {
            const entry = resolveTagEntry(
                preset.cloId,
                preset.typeId,
                entriesByCloId,
                typeEntriesByKey
            );
            const key = makeTagKey(preset.cloId, preset.typeId);
            const alreadyAdded = currentKeys.has(key);
            return {
                ...preset,
                entry,
                tagKey: key,
                alreadyAdded
            };
        });
    }, [presets, entriesByCloId, typeEntriesByKey, currentKeys]);

    const handlePress = useCallback(
        (preset) => {
            if (__DEV__) console.log('[QuickTags] chip pressed cloId:', preset.cloId, 'typeId:', preset.typeId);
            onAddTagWithPreset(preset);
        },
        [onAddTagWithPreset]
    );

    if (chips.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                {chips.map(chip => (
                    <Pressable
                        key={chip.tagKey}
                        style={({pressed}) => [
                            styles.chip,
                            chip.alreadyAdded && styles.chipAdded,
                            pressed && styles.chipPressed
                        ]}
                        onPress={() => handlePress(chip)}>
                        <Icon
                            name={chip.alreadyAdded ? 'checkmark' : 'add'}
                            size={14}
                            color={chip.alreadyAdded ? Colors.white : Colors.accent}
                        />
                        <Caption
                            color="white"
                            family="medium"
                            style={styles.chipText}>
                            {chip.customName || chip.entry?.displayName || chip.name || '?'}
                        </Caption>
                        {chip.quantity > 1 && (
                            <Caption
                                color={chip.alreadyAdded ? 'white' : 'accent'}
                                family="semiBold"
                                style={styles.quantityBadge}>
                                x{chip.quantity}
                            </Caption>
                        )}
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingBottom: 6
    },
    scrollContent: {
        gap: 6
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent,
        gap: 4
    },
    chipAdded: {
        backgroundColor: 'rgba(39, 174, 96, 0.3)',
        borderColor: 'rgba(39, 174, 96, 0.5)'
    },
    chipPressed: {
        backgroundColor: 'rgba(39, 174, 96, 0.2)'
    },
    chipText: {
        fontSize: 12
    },
    quantityBadge: {
        fontSize: 10
    }
});

export default React.memo(QuickTags);
