import React, {useCallback, useMemo} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {Caption, Colors} from '../../components';
import {makeTagKey, resolveTagEntry} from './tagUtils';

const TagSuggestions = ({
    images,
    currentIndex,
    currentTags,
    entriesByCloId,
    typeEntriesByKey,
    onAddTag
}) => {
    const suggestions = useMemo(() => {
        const currentKeys = new Set(
            (currentTags || []).map(t => makeTagKey(t.cloId, t.typeId))
        );
        const frequency = {};

        for (let i = 0; i < images.length; i++) {
            if (i === currentIndex) {
                continue;
            }
            const tags = images[i].tags || [];
            for (const tag of tags) {
                const key = makeTagKey(tag.cloId, tag.typeId);
                if (!currentKeys.has(key)) {
                    frequency[key] = (frequency[key] || 0) + 1;
                }
            }
        }

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([key]) => {
                const [cloIdStr, typeIdStr] = key.split('-');
                const cloId = Number(cloIdStr);
                const typeId = typeIdStr ? Number(typeIdStr) : null;
                const entry = resolveTagEntry(
                    cloId,
                    typeId,
                    entriesByCloId,
                    typeEntriesByKey
                );
                return {cloId, typeId, entry};
            })
            .filter(s => s.entry);
    }, [images, currentIndex, currentTags, entriesByCloId, typeEntriesByKey]);

    const handleAdd = useCallback(
        (cloId, typeId) => {
            onAddTag(cloId, typeId);
        },
        [onAddTag]
    );

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.labelRow}>
                <Icon name="flash" size={12} color={Colors.accent} />
                <Caption color="accent" family="medium" style={styles.label}>
                    Quick add
                </Caption>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled">
                {suggestions.map(({cloId, typeId, entry}) => (
                    <Pressable
                        key={makeTagKey(cloId, typeId)}
                        style={({pressed}) => [
                            styles.chip,
                            pressed && styles.chipPressed
                        ]}
                        onPress={() => handleAdd(cloId, typeId)}>
                        <Icon name="add" size={14} color={Colors.accent} />
                        <Caption
                            color="white"
                            family="medium"
                            style={styles.chipText}>
                            {entry.displayName}
                        </Caption>
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
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6
    },
    label: {
        fontSize: 11
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
    chipPressed: {
        backgroundColor: 'rgba(39, 174, 96, 0.2)'
    },
    chipText: {
        fontSize: 12
    }
});

export default React.memo(TagSuggestions);
