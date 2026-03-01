import React, {useCallback, useMemo, useState} from 'react';
import {
    Keyboard,
    Pressable,
    SectionList,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';

const MAX_RESULTS = 100;

const TagSearchBar = ({
    objectEntries,
    entriesByCloId,
    categoriesById,
    currentTags,
    customTags,
    onAddTag,
    onAddCustomTag,
    onBrowsePress,
    showBrowser
}) => {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const taggedKeys = useMemo(() => {
        const set = new Set();
        if (currentTags) {
            for (const t of currentTags) {
                set.add(`${t.cloId}-${t.typeId || ''}`);
            }
        }
        return set;
    }, [currentTags]);

    const results = useMemo(() => {
        if (!query.trim()) {
            return [];
        }
        const q = query.trim().toLowerCase();
        const terms = q.split(/\s+/);
        const matches = [];
        for (const entry of objectEntries) {
            const hit = terms.every(term => entry.searchText.includes(term));
            if (hit) {
                matches.push(entry);
                if (matches.length >= MAX_RESULTS) {
                    break;
                }
            }
        }
        return matches;
    }, [query, objectEntries]);

    // Group results by category for section display
    const sections = useMemo(() => {
        if (results.length === 0) {
            return [];
        }
        const groups = {};
        for (const entry of results) {
            const catId = entry.categoryId;
            if (!groups[catId]) {
                groups[catId] = {
                    categoryId: catId,
                    categoryKey: entry.categoryKey,
                    title: entry.categoryDisplayName,
                    data: []
                };
            }
            groups[catId].data.push(entry);
        }
        return Object.values(groups).sort((a, b) =>
            a.title.localeCompare(b.title)
        );
    }, [results]);

    const hasQuery = query.trim().length > 0;
    const showDropdown = isFocused && hasQuery && !showBrowser;
    const showNoResults = showDropdown && results.length === 0;
    const showResults = showDropdown && sections.length > 0;

    const handleSelect = useCallback(
        (cloId, typeId) => {
            onAddTag(cloId, typeId);
            setQuery('');
            Keyboard.dismiss();
        },
        [onAddTag]
    );

    const handleCreateCustomTag = useCallback(() => {
        const trimmed = query.trim();
        if (trimmed && onAddCustomTag) {
            onAddCustomTag(trimmed);
            setQuery('');
            Keyboard.dismiss();
        }
    }, [query, onAddCustomTag]);

    const handleSubmitEditing = useCallback(() => {
        if (results.length === 0) {
            handleCreateCustomTag();
        }
    }, [results, handleCreateCustomTag]);

    const handleClear = useCallback(() => {
        setQuery('');
    }, []);

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setTimeout(() => setIsFocused(false), 150);
    }, []);

    const handleBrowse = useCallback(() => {
        Keyboard.dismiss();
        setQuery('');
        if (onBrowsePress) {
            onBrowsePress();
        }
    }, [onBrowsePress]);

    const renderSectionHeader = useCallback(({section}) => {
        const catColor = getCategoryColor(section.categoryKey);
        return (
            <View style={styles.sectionHeader}>
                <View
                    style={[styles.sectionDot, {backgroundColor: catColor}]}
                />
                <Caption
                    color="muted"
                    family="semiBold"
                    style={styles.sectionTitle}>
                    {section.title}
                </Caption>
                <Caption color="muted" style={styles.sectionCount}>
                    {section.data.length}
                </Caption>
            </View>
        );
    }, []);

    const renderItem = useCallback(
        ({item}) => {
            const isAdded = taggedKeys.has(
                `${item.cloId}-${item.typeId || ''}`
            );
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
                        <View style={styles.resultNameRow}>
                            <Body
                                color={isAdded ? 'accent' : 'text'}
                                family="medium"
                                style={styles.resultName}>
                                {item.displayName}
                            </Body>
                            {item.isType && (
                                <View style={styles.typeBadge}>
                                    <Caption
                                        color="muted"
                                        style={styles.typeBadgeText}>
                                        type
                                    </Caption>
                                </View>
                            )}
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
            ? `type-${item.cloId}-${item.typeId}-${index}`
            : `obj-${item.cloId}-${index}`;
    }, []);

    return (
        <View style={styles.wrapper}>
            {/* Search input */}
            <View style={styles.inputContainer}>
                <Pressable
                    onPress={handleBrowse}
                    style={({pressed}) => [
                        styles.browseBtn,
                        showBrowser && styles.browseBtnActive,
                        pressed && styles.browseBtnPressed
                    ]}
                    hitSlop={4}>
                    <Icon
                        name={showBrowser ? 'grid' : 'grid-outline'}
                        size={18}
                        color={showBrowser ? Colors.white : Colors.muted}
                    />
                </Pressable>
                <Icon
                    name="search-outline"
                    size={17}
                    color={Colors.muted}
                    style={styles.searchIcon}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Search tags..."
                    placeholderTextColor={Colors.muted}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={handleSubmitEditing}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <Pressable onPress={handleClear} style={styles.clearButton}>
                        <Icon
                            name="close-circle"
                            size={18}
                            color={Colors.muted}
                        />
                    </Pressable>
                )}
            </View>

            {/* No results */}
            {showNoResults && (
                <View style={styles.noResults}>
                    <Caption color="muted" family="medium">
                        No results for &ldquo;{query.trim()}&rdquo;
                    </Caption>
                    <Pressable
                        onPress={handleCreateCustomTag}
                        style={styles.createCustomTag}>
                        <Icon
                            name="add-circle-outline"
                            size={16}
                            color={Colors.white}
                        />
                        <Caption color="white" family="medium">
                            Create &ldquo;{query.trim()}&rdquo;
                        </Caption>
                    </Pressable>
                    <Pressable
                        onPress={handleBrowse}
                        style={styles.browseSuggestion}>
                        <Icon
                            name="grid-outline"
                            size={14}
                            color={Colors.accent}
                        />
                        <Caption color="accent" family="medium">
                            Browse categories
                        </Caption>
                    </Pressable>
                </View>
            )}

            {/* Grouped results */}
            {showResults && (
                <View style={styles.dropdown}>
                    <View style={styles.resultsHeader}>
                        <Caption color="muted" family="medium">
                            {results.length} result
                            {results.length !== 1 ? 's' : ''}
                        </Caption>
                    </View>
                    <SectionList
                        sections={sections}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        keyExtractor={keyExtractor}
                        keyboardShouldPersistTaps="handled"
                        style={styles.resultsList}
                        stickySectionHeadersEnabled={false}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 16,
        zIndex: 10
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        paddingRight: 12,
        height: 44,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    browseBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 3
    },
    browseBtnActive: {
        backgroundColor: Colors.accent
    },
    browseBtnPressed: {
        backgroundColor: '#f0f0f0'
    },
    searchIcon: {
        marginRight: 6
    },
    input: {
        flex: 1,
        fontSize: 15,
        fontFamily: 'Poppins-Regular',
        color: '#050916',
        paddingVertical: 0
    },
    clearButton: {
        padding: 4
    },
    dropdown: {
        backgroundColor: '#fff',
        borderRadius: 14,
        marginTop: 4,
        maxHeight: 360,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        overflow: 'hidden'
    },
    resultsHeader: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
        backgroundColor: '#fafafa'
    },
    resultsList: {
        flexGrow: 0
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: '#fafafa',
        gap: 6
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    sectionTitle: {
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: 0.5
    },
    sectionCount: {
        fontSize: 11
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
        flex: 1
    },
    resultNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    resultName: {
        fontSize: 15
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
    noResults: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginTop: 4,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#e8e8e8',
        alignItems: 'center',
        gap: 8
    },
    createCustomTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: Colors.accent
    },
    browseSuggestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent
    }
});

export default React.memo(TagSearchBar);
