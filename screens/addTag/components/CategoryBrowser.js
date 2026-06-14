import React, {useCallback, useMemo, useState} from 'react';
import {FlatList, SectionList, StyleSheet, View} from 'react-native';
import {Pressable} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {runOnJS} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';

const ALL_KEY = 'all';

const CategoryBrowser = ({
    objectEntries,
    currentTags,
    onSelectCandidate,
    onClose
}) => {
    const {t} = useTranslation();
    const [activeTab, setActiveTab] = useState('category');
    // Accordion: every section collapsed by default ({} = none expanded).
    const [expandedSections, setExpandedSections] = useState({});

    // Browse lists show simple nouns only — base objects, never type/compound
    // rows (Soda Can, Beer Can…). Type precision is handled in TagDetailSheet.
    const baseEntries = useMemo(
        () => objectEntries.filter(e => !e.isType),
        [objectEntries]
    );

    // "All Objects": each base object once. Representative = first entry per
    // objectId (preserves i18n). Divergent names across categories ⇒ flag it.
    const allObjects = useMemo(() => {
        const byId = new Map();
        for (const e of baseEntries) {
            const existing = byId.get(e.objectId);
            if (!existing) {
                byId.set(e.objectId, {
                    kind: 'object',
                    objectId: e.objectId,
                    objectKey: e.objectKey,
                    displayName: e.displayName
                });
            } else if (__DEV__ && existing.displayName !== e.displayName) {
                console.warn(
                    `[Browser] objectId ${e.objectId} has divergent displayNames ` +
                    `across categories: "${existing.displayName}" vs "${e.displayName}" ` +
                    '— possible data issue.'
                );
            }
        }
        return [...byId.values()].sort((a, b) =>
            a.displayName.localeCompare(b.displayName)
        );
    }, [baseEntries]);

    const categoryGroups = useMemo(() => {
        const groups = {};
        for (const e of baseEntries) {
            if (!groups[e.categoryId]) {
                groups[e.categoryId] = {
                    categoryId: e.categoryId,
                    categoryKey: e.categoryKey,
                    title: e.categoryDisplayName,
                    items: []
                };
            }
            groups[e.categoryId].items.push(e);
        }
        const list = Object.values(groups);
        for (const g of list) {
            g.items.sort((a, b) => a.displayName.localeCompare(b.displayName));
        }
        // Heaviest categories first (matches the prior chip order), then A–Z.
        list.sort((a, b) =>
            b.items.length - a.items.length || a.title.localeCompare(b.title)
        );
        return list;
    }, [baseEntries]);

    const {taggedCloIds, taggedObjectIds} = useMemo(() => {
        const cloIds = new Set();
        for (const tag of currentTags || []) {
            if (!tag.brandOnly && tag.cloId != null) {
                cloIds.add(tag.cloId);
            }
        }
        const objIds = new Set();
        for (const e of baseEntries) {
            if (cloIds.has(e.cloId)) {
                objIds.add(e.objectId);
            }
        }
        return {taggedCloIds: cloIds, taggedObjectIds: objIds};
    }, [currentTags, baseEntries]);

    const sections = useMemo(() => {
        const out = [{
            key: ALL_KEY,
            title: t('All Objects'),
            count: allObjects.length,
            data: expandedSections[ALL_KEY] ? allObjects : []
        }];
        for (const g of categoryGroups) {
            const key = `cat-${g.categoryId}`;
            out.push({
                key,
                title: g.title,
                categoryKey: g.categoryKey,
                count: g.items.length,
                data: expandedSections[key] ? g.items : []
            });
        }
        return out;
    }, [allObjects, categoryGroups, expandedSections, t]);

    // TODO(Pass 2): replace this hardcoded alphabetical fallback with real
    // most-tagged ordering once the data source lands. No data this pass.
    const mostTagged = allObjects;

    const toggleSection = useCallback(key => {
        setExpandedSections(prev => ({...prev, [key]: !prev[key]}));
    }, []);

    const handleSelectObject = useCallback(item => {
        onSelectCandidate({
            objectId: item.objectId,
            categoryId: null,
            cloId: null,
            typeId: null,
            displayName: item.displayName
        });
    }, [onSelectCandidate]);

    const handleSelectCategoryEntry = useCallback(entry => {
        onSelectCandidate({
            objectId: entry.objectId,
            categoryId: entry.categoryId,
            categoryKey: entry.categoryKey,
            cloId: entry.cloId,
            typeId: null,
            displayName: entry.displayName
        });
    }, [onSelectCandidate]);

    const renderRow = useCallback((item, isObjectRow) => {
        const isAdded = isObjectRow
            ? taggedObjectIds.has(item.objectId)
            : taggedCloIds.has(item.cloId);
        const barColor = isObjectRow
            ? Colors.muted
            : getCategoryColor(item.categoryKey);
        return (
            <Pressable
                style={({pressed}) => [
                    styles.resultRow,
                    isAdded && styles.resultRowAdded,
                    pressed && styles.resultRowPressed
                ]}
                onPress={() =>
                    isObjectRow
                        ? handleSelectObject(item)
                        : handleSelectCategoryEntry(item)
                }>
                <View style={[styles.colorBar, {backgroundColor: barColor}]} />
                <View style={styles.resultTextWrap}>
                    <Body
                        color={isAdded ? 'accent' : 'text'}
                        family="medium"
                        style={styles.resultName}>
                        {item.displayName}
                    </Body>
                </View>
                <Icon
                    name={isAdded ? 'checkmark-circle' : 'add-circle-outline'}
                    size={20}
                    color={isAdded ? Colors.accent : Colors.muted}
                />
            </Pressable>
        );
    }, [taggedObjectIds, taggedCloIds, handleSelectObject, handleSelectCategoryEntry]);

    const renderItem = useCallback(
        ({item}) => renderRow(item, item.kind === 'object'),
        [renderRow]
    );

    const renderSectionHeader = useCallback(({section}) => {
        const expanded = !!expandedSections[section.key];
        const dotColor = section.categoryKey
            ? getCategoryColor(section.categoryKey)
            : Colors.accent;
        return (
            <Pressable
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.key)}>
                <View style={[styles.sectionDot, {backgroundColor: dotColor}]} />
                <Caption
                    color="text"
                    family="semiBold"
                    style={styles.sectionTitle}>
                    {section.title}
                </Caption>
                <Caption color="muted" style={styles.sectionCount}>
                    {section.count}
                </Caption>
                <Icon
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={Colors.muted}
                />
            </Pressable>
        );
    }, [expandedSections, toggleSection]);

    const sectionKeyExtractor = useCallback(
        item => (item.kind === 'object' ? `obj-${item.objectId}` : `clo-${item.cloId}`),
        []
    );

    const swipeDownGesture = Gesture.Pan()
        .activeOffsetY(12)
        .failOffsetX([-24, 24])
        .onEnd(e => {
            const isMostlyVertical =
                Math.abs(e.translationY) > Math.abs(e.translationX) * 1.2;
            const shouldClose =
                isMostlyVertical && e.translationY > 60 && e.velocityY > 250;
            if (shouldClose) {
                runOnJS(onClose)();
            }
        });

    return (
        <GestureDetector gesture={swipeDownGesture}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.tabs}>
                        <Pressable
                            style={[
                                styles.tab,
                                activeTab === 'category' && styles.tabActive
                            ]}
                            onPress={() => setActiveTab('category')}>
                            <Caption
                                color={activeTab === 'category' ? 'accent' : 'muted'}
                                family="semiBold"
                                style={styles.tabText}>
                                {t('By Category')}
                            </Caption>
                        </Pressable>
                        <Pressable
                            style={[
                                styles.tab,
                                activeTab === 'mostTagged' && styles.tabActive
                            ]}
                            onPress={() => setActiveTab('mostTagged')}>
                            <Caption
                                color={activeTab === 'mostTagged' ? 'accent' : 'muted'}
                                family="semiBold"
                                style={styles.tabText}>
                                {t('Most Tagged')}
                            </Caption>
                        </Pressable>
                    </View>
                    <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
                        <Icon name="close" size={18} color={Colors.muted} />
                    </Pressable>
                </View>

                {activeTab === 'category' ? (
                    <SectionList
                        sections={sections}
                        renderItem={renderItem}
                        renderSectionHeader={renderSectionHeader}
                        keyExtractor={sectionKeyExtractor}
                        keyboardShouldPersistTaps="handled"
                        stickySectionHeadersEnabled={false}
                        contentContainerStyle={styles.listContent}
                    />
                ) : (
                    <FlatList
                        data={mostTagged}
                        renderItem={renderItem}
                        keyExtractor={sectionKeyExtractor}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={styles.listContent}
                    />
                )}
            </View>
        </GestureDetector>
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
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e8e8e8',
        backgroundColor: '#fafafa',
        gap: 8
    },
    tabs: {
        flexDirection: 'row',
        flex: 1,
        gap: 6
    },
    tab: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 100,
        backgroundColor: '#f0f0f0'
    },
    tabActive: {
        backgroundColor: Colors.accentLight
    },
    tabText: {
        fontSize: 13
    },
    closeBtn: {
        padding: 4
    },
    listContent: {
        paddingBottom: 4
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0',
        gap: 8
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    sectionTitle: {
        flex: 1,
        fontSize: 13
    },
    sectionCount: {
        fontSize: 12,
        marginRight: 2
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 14,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f5f5f5'
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
    resultName: {
        fontSize: 15
    }
});

export default React.memo(CategoryBrowser);
