import React, {useCallback, useMemo} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Caption, Colors} from '../../components';

const TagSuggestions = ({
    images,
    currentIndex,
    currentTags,
    entriesByCloId,
    onAddTag
}) => {
    const suggestions = useMemo(() => {
        const currentCloIds = new Set((currentTags || []).map(t => t.cloId));
        const frequency = {};

        for (let i = 0; i < images.length; i++) {
            if (i === currentIndex) {
                continue;
            }
            const tags = images[i].tagsV5 || [];
            for (const tag of tags) {
                if (!currentCloIds.has(tag.cloId)) {
                    frequency[tag.cloId] = (frequency[tag.cloId] || 0) + 1;
                }
            }
        }

        return Object.entries(frequency)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([cloId]) => ({
                cloId: Number(cloId),
                entry: entriesByCloId[Number(cloId)]
            }))
            .filter(s => s.entry);
    }, [images, currentIndex, currentTags, entriesByCloId]);

    const handleAdd = useCallback(
        cloId => {
            onAddTag(cloId);
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
                {suggestions.map(({cloId, entry}) => (
                    <Pressable
                        key={cloId}
                        style={({pressed}) => [
                            styles.chip,
                            pressed && styles.chipPressed
                        ]}
                        onPress={() => handleAdd(cloId)}>
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
