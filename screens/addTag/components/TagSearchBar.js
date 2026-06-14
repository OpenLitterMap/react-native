import React, {useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState} from 'react';
import {
    Keyboard,
    SectionList,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import {Pressable} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {makePrimaryTagKey, makeTagKey} from './tagUtils';

const MAX_RESULTS = 100;

// Tiered relevance ladder (no composite score). Lower = more relevant.
// Objects/compounds rank above brands by design — the browse/search principle
// is "simple nouns first, brands are the noise we suppress".
const TIER = {
    EXACT_OBJECT: 0,
    EXACT_COMPOUND: 1,
    STARTSWITH_OBJECT: 2,
    OTHER_OBJECT: 3, // residual object/compound substring — kept above brands
    MATERIAL: 4, // reserved slot — material search is not wired this pass (own ticket)
    BRAND_EXACT: 5,
    BRAND_PREFIX: 6,
    BRAND_CONTAINS: 7
};
// An object match at or above this tier counts as "strong" (suppresses brands).
const STRONG_OBJECT_TIER = TIER.STARTSWITH_OBJECT;

const objectTier = (entry, q) => {
    const dn = (entry.displayName || '').toLowerCase();
    if (entry.isType) {
        return dn === q ? TIER.EXACT_COMPOUND : TIER.OTHER_OBJECT;
    }
    if (dn === q) {
        return TIER.EXACT_OBJECT;
    }
    if (dn.startsWith(q)) {
        return TIER.STARTSWITH_OBJECT;
    }
    return TIER.OTHER_OBJECT;
};

const TagSearchBar = React.forwardRef(({
    objectEntries,
    entriesByCloId,
    currentTags,
    customTags,
    brands,
    quickTagCloIds,
    onAddTag,
    onAddBrandOnly,
    onAddCustomTag,
    onPendingCustomTag,
    onBrowsePress,
    onToggleQuickTag,
    showBrowser
}, ref) => {
    const {t} = useTranslation();
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const blurTimerRef = useRef(null);
    const inputRef = useRef(null);
    const starPressedRef = useRef(false);

    useEffect(() => {
        return () => {
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
            }
        };
    }, []);

    const taggedKeys = useMemo(() => {
        const set = new Set();
        if (currentTags) {
            for (const tag of currentTags) {
                set.add(makePrimaryTagKey(tag));
            }
        }
        return set;
    }, [currentTags]);

    const {objectSections, brandResults, hasStrongObjectMatch, totalCount} = useMemo(() => {
        if (!query.trim()) {
            return {objectSections: [], brandResults: [], hasStrongObjectMatch: false, totalCount: 0};
        }
        const q = query.trim().toLowerCase();
        const terms = q.split(/\s+/);

        // --- Objects (+ compounds/types) ---
        const objectMatches = [];
        let strong = false;
        for (const entry of objectEntries) {
            if (!terms.every(term => entry.searchText.includes(term))) {
                continue;
            }
            if (entry.isType) {
                // Include a type/compound row only when a query term matches the
                // type's OWN name — not merely the inherited object text. So
                // "can" shows the base Can (type chosen in the sheet), while
                // "beer can" surfaces Beer Can directly.
                const typeText = (entry.typeName || '').toLowerCase();
                if (!terms.some(term => typeText.includes(term))) {
                    continue;
                }
            }
            const tier = objectTier(entry, q);
            if (tier <= STRONG_OBJECT_TIER) {
                strong = true;
            }
            objectMatches.push({entry, tier});
        }
        objectMatches.sort((a, b) =>
            a.tier - b.tier ||
            (a.entry.displayName || '').localeCompare(b.entry.displayName || '')
        );
        const capped = objectMatches.slice(0, MAX_RESULTS);

        // Group objects into category sections; order sections by best tier.
        const groups = {};
        for (const {entry, tier} of capped) {
            const catId = entry.categoryId;
            if (!groups[catId]) {
                groups[catId] = {
                    categoryId: catId,
                    categoryKey: entry.categoryKey,
                    title: entry.categoryDisplayName,
                    bestTier: tier,
                    data: []
                };
            }
            groups[catId].bestTier = Math.min(groups[catId].bestTier, tier);
            groups[catId].data.push(entry);
        }
        const sectionsOut = Object.values(groups).sort((a, b) =>
            a.bestTier - b.bestTier || a.title.localeCompare(b.title)
        );

        // --- Brands (query-length-gated) ---
        // 1–3 chars: exact/prefix only. 4+ chars: allow contains.
        const allowContains = q.length >= 4;
        const brandMatches = [];
        for (const brand of brands || []) {
            const name = brand.name.toLowerCase();
            let tier;
            if (name === q) {
                tier = TIER.BRAND_EXACT;
            } else if (name.startsWith(q)) {
                tier = TIER.BRAND_PREFIX;
            } else if (allowContains && terms.every(term => name.includes(term))) {
                tier = TIER.BRAND_CONTAINS;
            } else {
                continue;
            }
            brandMatches.push({
                isBrandOnly: true,
                brandId: brand.id,
                brandKey: brand.key,
                displayName: brand.name,
                categoryId: 'brand-only',
                categoryKey: 'brand-only',
                categoryDisplayName: t('Brands'),
                searchText: name,
                _tier: tier
            });
        }
        brandMatches.sort((a, b) =>
            a._tier - b._tier || a.displayName.localeCompare(b.displayName)
        );
        const brandsOut = brandMatches.slice(0, MAX_RESULTS);

        return {
            objectSections: sectionsOut,
            brandResults: brandsOut,
            hasStrongObjectMatch: strong,
            totalCount: capped.length + brandsOut.length
        };
    }, [brands, objectEntries, query, t]);

    // Brands collapse: default open ONLY when there's no strong object match.
    // null = follow the default; true/false = user override for this query.
    const [brandsManual, setBrandsManual] = useState(null);
    useEffect(() => {
        setBrandsManual(null);
    }, [query]);
    const brandsExpanded = brandsManual != null ? brandsManual : !hasStrongObjectMatch;
    const toggleBrands = useCallback(() => {
        setBrandsManual(prev => {
            const current = prev != null ? prev : !hasStrongObjectMatch;
            return !current;
        });
    }, [hasStrongObjectMatch]);

    // Object category sections + a collapsible Brands section appended last.
    const sections = useMemo(() => {
        const secs = objectSections.map(s => ({...s}));
        if (brandResults.length > 0) {
            secs.push({
                categoryId: 'brand-only',
                categoryKey: 'brand-only',
                title: t('Brands'),
                isBrandSection: true,
                brandCount: brandResults.length,
                data: brandsExpanded ? brandResults : []
            });
        }
        return secs;
    }, [objectSections, brandResults, brandsExpanded, t]);

    useImperativeHandle(ref, () => ({
        clearQuery: () => setQuery(''),
        blurInput: () => {
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
                blurTimerRef.current = null;
            }
            inputRef.current?.blur();
            setIsFocused(false);
        }
    }), []);

    const hasQuery = query.trim().length > 0;
    const showDropdown = isFocused && hasQuery && !showBrowser;
    const showNoResults = showDropdown && totalCount === 0;
    const showResults = showDropdown && sections.length > 0;

    // Notify parent when there's a pending custom tag (no results for query)
    useEffect(() => {
        if (onPendingCustomTag) {
            onPendingCustomTag(showNoResults ? query.trim() : null);
        }
    }, [showNoResults, query, onPendingCustomTag]);

    const handleSelect = useCallback(
        item => {
            if (starPressedRef.current) {
                starPressedRef.current = false;
                return;
            }
            if (item.isBrandOnly) {
                onAddBrandOnly?.(item.brandId, item.displayName, item.brandKey);
            } else {
                onAddTag(item.cloId, item.typeId);
            }
            setQuery('');
            Keyboard.dismiss();
        },
        [onAddBrandOnly, onAddTag]
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
        if (totalCount === 0) {
            handleCreateCustomTag();
        }
    }, [totalCount, handleCreateCustomTag]);

    const handleClear = useCallback(() => {
        setQuery('');
    }, []);

    const handleFocus = useCallback(() => {
        if (__DEV__) console.log('[Search] input focused');
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
            blurTimerRef.current = null;
        }
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
        blurTimerRef.current = setTimeout(() => setIsFocused(false), 150);
    }, []);

    const handleBrowse = useCallback(() => {
        Keyboard.dismiss();
        setQuery('');
        if (onBrowsePress) {
            onBrowsePress();
        }
    }, [onBrowsePress]);

    const renderSectionHeader = useCallback(({section}) => {
        if (section.isBrandSection) {
            return (
                <Pressable
                    style={styles.brandSectionHeader}
                    onPress={toggleBrands}>
                    <Icon
                        name="pricetag-outline"
                        size={13}
                        color={Colors.muted}
                    />
                    <Caption
                        color="muted"
                        family="semiBold"
                        style={[styles.sectionTitle, styles.brandSectionTitle]}>
                        {t('Brands matching "{{query}}"', {query: query.trim()})}
                    </Caption>
                    <Caption color="muted" style={styles.sectionCount}>
                        {section.brandCount}
                    </Caption>
                    <Icon
                        name={brandsExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={Colors.muted}
                    />
                </Pressable>
            );
        }
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
    }, [toggleBrands, brandsExpanded, query, t]);

    const handleToggleStar = useCallback(
        (item) => {
            starPressedRef.current = true;
            if (!item.isBrandOnly && onToggleQuickTag) {
                onToggleQuickTag(item.cloId, item.typeId);
            }
        },
        [onToggleQuickTag]
    );

    const renderItem = useCallback(
        ({item}) => {
            const isAdded = item.isBrandOnly
                ? taggedKeys.has(`brand-${item.brandId}`)
                : taggedKeys.has(makeTagKey(item.cloId, item.typeId));
            const categoryColor = item.isBrandOnly
                ? '#dc2626'
                : getCategoryColor(item.categoryKey);
            const isQuickTag = !item.isBrandOnly && quickTagCloIds?.has(
                makeTagKey(item.cloId, item.typeId)
            );

            return (
                <Pressable
                    style={({pressed}) => [
                        styles.resultRow,
                        isAdded && styles.resultRowAdded,
                        pressed && styles.resultRowPressed
                    ]}
                    onPress={() => handleSelect(item)}>
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
                            {item.isBrandOnly && (
                                <View style={styles.typeBadge}>
                                    <Caption
                                        color="muted"
                                        style={styles.typeBadgeText}>
                                        brand
                                    </Caption>
                                </View>
                            )}
                        </View>
                    </View>
                    {!item.isBrandOnly && (
                        <Pressable
                            onPress={() => handleToggleStar(item)}
                            style={styles.starButton}
                            hitSlop={6}>
                            <Icon
                                name={isQuickTag ? 'star' : 'star-outline'}
                                size={18}
                                color={isQuickTag ? '#f59e0b' : Colors.muted}
                            />
                        </Pressable>
                    )}
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
        [taggedKeys, handleSelect, quickTagCloIds, handleToggleStar]
    );

    const keyExtractor = useCallback((item) => {
        return item.isType
            ? `type-${item.cloId}-${item.typeId}`
            : item.isBrandOnly
                ? `brand-${item.brandId}`
                : `obj-${item.cloId}`;
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
                    ref={inputRef}
                    style={styles.input}
                    placeholder={t('Search tags...')}
                    placeholderTextColor={Colors.muted}
                    value={query}
                    onChangeText={setQuery}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onSubmitEditing={handleSubmitEditing}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                    maxLength={100}
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
                        {t('No results for "{{query}}"', {query: query.trim()})}
                    </Caption>
                    <Pressable
                        onPress={handleBrowse}
                        style={styles.browseSuggestion}>
                        <Icon
                            name="grid-outline"
                            size={14}
                            color={Colors.accent}
                        />
                        <Caption color="accent" family="medium">
                            {t('Browse Categories')}
                        </Caption>
                    </Pressable>
                </View>
            )}

            {/* Grouped results */}
            {showResults && (
                <View style={styles.dropdown}>
                    <View style={styles.resultsHeader}>
                        <Caption color="muted" family="medium">
                            {totalCount} result
                            {totalCount !== 1 ? 's' : ''}
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
});

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
    brandSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 9,
        backgroundColor: '#fafafa',
        gap: 6,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#eee'
    },
    brandSectionTitle: {
        flex: 1
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
    starButton: {
        padding: 4,
        marginRight: 4
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
