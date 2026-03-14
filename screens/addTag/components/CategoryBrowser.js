import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, ScrollView, StyleSheet, View} from 'react-native';
import {Pressable} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {makeTagKey} from './tagUtils';

const CategoryBrowser = ({
    categoriesById,
    objectEntries,
    currentTags,
    onAddTag,
    onClose
}) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);

    const taggedKeys = useMemo(() => {
        const set = new Set();
        if (currentTags) {
            for (const t of currentTags) {
                set.add(makeTagKey(t.cloId, t.typeId));
            }
        }
        return set;
    }, [currentTags]);

    const categoriesList = useMemo(() => {
        const countMap = {};
        for (const entry of objectEntries) {
            countMap[entry.categoryId] = (countMap[entry.categoryId] || 0) + 1;
        }
        return Object.values(categoriesById)
            .map(cat => ({
                ...cat,
                count: countMap[cat.id] || 0
            }))
            .sort((a, b) => b.count - a.count);
    }, [categoriesById, objectEntries]);

    const filteredEntries = useMemo(() => {
        if (!selectedCategoryId) {
            return objectEntries;
        }
        return objectEntries.filter(e => e.categoryId === selectedCategoryId);
    }, [selectedCategoryId, objectEntries]);

    // Deduplicate: for type entries sharing a cloId with their base object,
    // show both but visually distinguish them
    const deduped = useMemo(() => {
        const seen = new Set();
        const result = [];
        // Base entries first, then types
        const sorted = [...filteredEntries].sort((a, b) => {
            if (a.isType && !b.isType) {
                return 1;
            }
            if (!a.isType && b.isType) {
                return -1;
            }
            return a.displayName.localeCompare(b.displayName);
        });
        for (const entry of sorted) {
            const key = entry.isType
                ? `${entry.cloId}-type-${entry.typeId}`
                : `${entry.cloId}`;
            if (!seen.has(key)) {
                seen.add(key);
                result.push(entry);
            }
        }
        return result;
    }, [filteredEntries]);

    const handleSelect = useCallback(
        (cloId, typeId) => {
            onAddTag(cloId, typeId);
        },
        [onAddTag]
    );

    const handleCategoryPress = useCallback(catId => {
        setSelectedCategoryId(prev => (prev === catId ? null : catId));
    }, []);

    const renderItem = useCallback(
        ({item}) => {
            const isAdded = taggedKeys.has(makeTagKey(item.cloId, item.typeId));
            const categoryColor = getCategoryColor(item.categoryKey);

            return (
                <Pressable
                    style={({pressed}) => [
                        styles.resultRow,
                        isAdded && styles.resultRowAdded,
                        pressed && styles.resultRowPressed
                    ]}
                    onPress={() => handleSelect(item.cloId, item.typeId)}>
                    <View
                        style={[
                            styles.colorBar,
                            {backgroundColor: categoryColor}
                        ]}
                    />
                    <View style={styles.resultTextWrap}>
                        <Body
                            color={isAdded ? 'accent' : 'text'}
                            family="medium"
                            style={styles.resultName}>
                            {item.displayName}
                        </Body>
                        <View style={styles.badgeRow}>
                            {item.isType && (
                                <View style={styles.typeBadge}>
                                    <Caption
                                        color="muted"
                                        style={styles.typeBadgeText}>
                                        type
                                    </Caption>
                                </View>
                            )}
                            <View
                                style={[
                                    styles.categoryBadge,
                                    {backgroundColor: categoryColor + '18'}
                                ]}>
                                <Caption
                                    color="muted"
                                    family="medium"
                                    style={[
                                        styles.categoryBadgeText,
                                        {color: categoryColor}
                                    ]}>
                                    {item.categoryDisplayName}
                                </Caption>
                            </View>
                        </View>
                    </View>
                    {isAdded ? (
                        <Icon
                            name="checkmark-circle"
                            size={20}
                            color={Colors.accent}
                        />
                    ) : (
                        <Icon
                            name="add-circle-outline"
                            size={20}
                            color={Colors.muted}
                        />
                    )}
                </Pressable>
            );
        },
        [taggedKeys, handleSelect]
    );

    const keyExtractor = useCallback((item, index) => {
        return item.isType
            ? `type-${item.cloId}-${item.typeId}`
            : `obj-${item.cloId}-${index}`;
    }, []);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Caption
                    color="text"
                    family="semiBold"
                    style={styles.headerTitle}>
                    Browse Categories
                </Caption>
                <Pressable onPress={onClose} hitSlop={8}>
                    <Icon name="close" size={18} color={Colors.muted} />
                </Pressable>
            </View>

            {/* Category chips */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsRow}>
                <Pressable
                    style={[
                        styles.chip,
                        !selectedCategoryId && styles.chipActive
                    ]}
                    onPress={() => setSelectedCategoryId(null)}>
                    <Caption
                        color={!selectedCategoryId ? 'white' : 'text'}
                        family="medium"
                        style={styles.chipText}>
                        All ({objectEntries.length})
                    </Caption>
                </Pressable>
                {categoriesList.map(cat => {
                    const isSelected = selectedCategoryId === cat.id;
                    const catColor = getCategoryColor(cat.key);
                    return (
                        <Pressable
                            key={cat.id}
                            style={[
                                styles.chip,
                                isSelected && {backgroundColor: catColor}
                            ]}
                            onPress={() => handleCategoryPress(cat.id)}>
                            <Caption
                                color={isSelected ? 'white' : 'text'}
                                family="medium"
                                style={styles.chipText}>
                                {cat.displayName} ({cat.count})
                            </Caption>
                        </Pressable>
                    );
                })}
            </ScrollView>

            {/* Results list */}
            <FlatList
                data={deduped}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                keyboardShouldPersistTaps="handled"
                style={styles.list}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginHorizontal: 16,
        marginTop: 4,
        maxHeight: 480,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e8e8e8'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e8e8e8',
        backgroundColor: '#fafafa'
    },
    headerTitle: {
        fontSize: 13
    },
    chipsRow: {
        paddingHorizontal: 10,
        paddingTop: 10,
        paddingBottom: 18,
        gap: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0'
    },
    chip: {
        paddingHorizontal: 12,
        height: 39,
        justifyContent: 'center',
        borderRadius: 100,
        backgroundColor: '#f0f0f0'
    },
    chipActive: {
        backgroundColor: Colors.accent
    },
    chipText: {
        fontSize: 13,
        lineHeight: 18
    },
    list: {
        flexGrow: 0
    },
    listContent: {
        paddingBottom: 4
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0'
    },
    resultRowAdded: {
        backgroundColor: Colors.accentLight
    },
    resultRowPressed: {
        backgroundColor: '#f5f5f5'
    },
    colorBar: {
        width: 3,
        alignSelf: 'stretch',
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        marginRight: 11
    },
    resultTextWrap: {
        flex: 1,
        gap: 2
    },
    resultName: {
        fontSize: 15
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    typeBadge: {
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#ddd'
    },
    typeBadgeText: {
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    categoryBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 6
    },
    categoryBadgeText: {
        fontSize: 11
    }
});

export default React.memo(CategoryBrowser);
