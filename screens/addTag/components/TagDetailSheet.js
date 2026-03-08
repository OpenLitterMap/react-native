import React, {useMemo, useState} from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {MAX_QUANTITY} from './tagUtils';
import {useTranslation} from 'react-i18next';
const MAX_SEARCH_RESULTS = 5;

const TagDetailSheet = ({
    visible,
    tag,
    tagEntry,
    materials,
    brands,
    brandsById,
    onToggleMaterial,
    onAddBrand,
    onRemoveBrand,
    onAddCustomTag,
    onRemoveCustomTag,
    onUpdateQuantity,
    onClose
}) => {
    const {t} = useTranslation();
    const [materialQuery, setMaterialQuery] = useState('');
    const [brandQuery, setBrandQuery] = useState('');
    const [customTagText, setCustomTagText] = useState('');

    const categoryColor = getCategoryColor(tagEntry?.categoryKey || tag?._categoryKey);
    const tagName = tagEntry?.displayName || tag?._displayName || `#${tag?.cloId}`;
    const categoryName = tagEntry?.categoryDisplayName || tag?._categoryDisplayName || '';

    const selectedMaterialIds = useMemo(
        () => new Set(tag?.materials || []),
        [tag?.materials]
    );

    const selectedBrandIds = useMemo(
        () => new Set((tag?.brands || []).map(b => b.id)),
        [tag?.brands]
    );

    const materialResults = useMemo(() => {
        if (!materialQuery.trim() || !materials) return [];
        const q = materialQuery.toLowerCase();
        const matches = [];
        for (const m of materials) {
            if (
                m.name.toLowerCase().includes(q) &&
                !selectedMaterialIds.has(m.id)
            ) {
                matches.push(m);
                if (matches.length >= MAX_SEARCH_RESULTS) break;
            }
        }
        return matches;
    }, [materialQuery, materials, selectedMaterialIds]);

    const selectedMaterials = useMemo(() => {
        if (!materials || selectedMaterialIds.size === 0) return [];
        return materials.filter(m => selectedMaterialIds.has(m.id));
    }, [materials, selectedMaterialIds]);

    const brandResults = useMemo(() => {
        if (!brandQuery.trim() || !brands) return [];
        const q = brandQuery.toLowerCase();
        const matches = [];
        for (const b of brands) {
            if (
                b.name.toLowerCase().includes(q) &&
                !selectedBrandIds.has(b.id)
            ) {
                matches.push(b);
                if (matches.length >= MAX_SEARCH_RESULTS) break;
            }
        }
        return matches;
    }, [brandQuery, brands, selectedBrandIds]);

    const handleAddCustomTag = () => {
        const trimmed = customTagText.trim();
        if (trimmed) {
            onAddCustomTag(trimmed);
            setCustomTagText('');
        }
    };

    if (!tag || !visible) return null;

    const qty = tag.quantity || 1;

    return (
        <Modal animationType="slide" transparent visible={visible}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}>
                    <Pressable style={styles.backdrop} onPress={onClose} />
                    <View style={styles.sheet}>
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            bounces={false}
                            keyboardShouldPersistTaps="handled">
                            <View style={styles.handle} />

                            {/* Header */}
                            <View style={styles.header}>
                                <View
                                    style={[
                                        styles.headerColorBar,
                                        {backgroundColor: categoryColor}
                                    ]}
                                />
                                <View>
                                    <Body style={styles.headerName}>
                                        {tagName}
                                    </Body>
                                    {categoryName ? (
                                        <Caption>{categoryName}</Caption>
                                    ) : null}
                                </View>
                            </View>

                            {/* Quantity */}
                            <View style={styles.section}>
                                <Caption style={styles.sectionLabel}>
                                    {t('Quantity')}
                                </Caption>
                                <View style={styles.quantityRow}>
                                    <Pressable
                                        style={styles.stepperBtn}
                                        onPress={() =>
                                            onUpdateQuantity(
                                                tag.cloId,
                                                tag.typeId,
                                                qty - 1
                                            )
                                        }
                                        disabled={qty <= 1}>
                                        <Icon
                                            name={
                                                qty <= 1
                                                    ? 'trash-outline'
                                                    : 'remove'
                                            }
                                            size={18}
                                            color={
                                                qty <= 1
                                                    ? Colors.error
                                                    : '#333'
                                            }
                                        />
                                    </Pressable>
                                    <Body style={styles.quantityText}>
                                        {qty}
                                    </Body>
                                    <Pressable
                                        style={[
                                            styles.stepperBtn,
                                            qty >= MAX_QUANTITY &&
                                                styles.stepperBtnDisabled
                                        ]}
                                        onPress={() =>
                                            onUpdateQuantity(
                                                tag.cloId,
                                                tag.typeId,
                                                qty + 1
                                            )
                                        }
                                        disabled={qty >= MAX_QUANTITY}>
                                        <Icon
                                            name="add"
                                            size={18}
                                            color={
                                                qty >= MAX_QUANTITY
                                                    ? '#ccc'
                                                    : '#333'
                                            }
                                        />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Materials */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Caption style={styles.sectionLabel}>
                                        {t('Materials')}
                                    </Caption>
                                    <Caption
                                        style={styles.xpHint}
                                        color="accent">
                                        +2 XP
                                    </Caption>
                                </View>

                                {/* Selected materials */}
                                {selectedMaterials.length > 0 && (
                                    <View style={styles.selectedChipsWrap}>
                                        {selectedMaterials.map(m => (
                                            <View
                                                key={m.id}
                                                style={styles.selectedChip}>
                                                <Caption
                                                    style={
                                                        styles.selectedChipText
                                                    }>
                                                    {m.name}
                                                </Caption>
                                                <Pressable
                                                    onPress={() =>
                                                        onToggleMaterial(m.id)
                                                    }
                                                    hitSlop={4}>
                                                    <Icon
                                                        name="close"
                                                        size={14}
                                                        color="#888"
                                                    />
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Material search */}
                                <View style={styles.searchRow}>
                                    <Icon
                                        name="search"
                                        size={16}
                                        color="#aaa"
                                        style={styles.searchIcon}
                                    />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('Search materials')}
                                        placeholderTextColor="#aaa"
                                        value={materialQuery}
                                        onChangeText={setMaterialQuery}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {materialQuery.length > 0 && (
                                        <Pressable
                                            onPress={() =>
                                                setMaterialQuery('')
                                            }
                                            hitSlop={4}>
                                            <Icon
                                                name="close-circle"
                                                size={16}
                                                color="#ccc"
                                            />
                                        </Pressable>
                                    )}
                                </View>

                                {/* Material results */}
                                {materialResults.length > 0 && (
                                    <View style={styles.brandResults}>
                                        {materialResults.map(m => (
                                            <Pressable
                                                key={m.id}
                                                style={styles.brandRow}
                                                onPress={() => {
                                                    onToggleMaterial(m.id);
                                                    setMaterialQuery('');
                                                }}>
                                                <Caption
                                                    style={styles.brandName}>
                                                    {m.name}
                                                </Caption>
                                                <Icon
                                                    name="add-circle-outline"
                                                    size={18}
                                                    color={Colors.accent}
                                                />
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Brands */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Caption style={styles.sectionLabel}>
                                        {t('Brands')}
                                    </Caption>
                                    <Caption
                                        style={styles.xpHint}
                                        color="accent">
                                        +3 XP
                                    </Caption>
                                </View>

                                {/* Selected brands */}
                                {tag.brands && tag.brands.length > 0 && (
                                    <View style={styles.selectedChipsWrap}>
                                        {tag.brands.map(b => {
                                            const brandInfo =
                                                brandsById?.[b.id];
                                            return (
                                                <View
                                                    key={b.id}
                                                    style={
                                                        styles.selectedChip
                                                    }>
                                                    <Caption
                                                        style={
                                                            styles.selectedChipText
                                                        }>
                                                        {brandInfo?.name ||
                                                            `#${b.id}`}
                                                    </Caption>
                                                    <Pressable
                                                        onPress={() =>
                                                            onRemoveBrand(b.id)
                                                        }
                                                        hitSlop={4}>
                                                        <Icon
                                                            name="close"
                                                            size={14}
                                                            color="#888"
                                                        />
                                                    </Pressable>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}

                                {/* Brand search */}
                                <View style={styles.searchRow}>
                                    <Icon
                                        name="search"
                                        size={16}
                                        color="#aaa"
                                        style={styles.searchIcon}
                                    />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('Search brands')}
                                        placeholderTextColor="#aaa"
                                        value={brandQuery}
                                        onChangeText={setBrandQuery}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    {brandQuery.length > 0 && (
                                        <Pressable
                                            onPress={() => setBrandQuery('')}
                                            hitSlop={4}>
                                            <Icon
                                                name="close-circle"
                                                size={16}
                                                color="#ccc"
                                            />
                                        </Pressable>
                                    )}
                                </View>

                                {/* Brand results */}
                                {brandResults.length > 0 && (
                                    <View style={styles.brandResults}>
                                        {brandResults.map(b => (
                                            <Pressable
                                                key={b.id}
                                                style={styles.brandRow}
                                                onPress={() => {
                                                    onAddBrand(b.id);
                                                    setBrandQuery('');
                                                }}>
                                                <Caption
                                                    style={styles.brandName}>
                                                    {b.name}
                                                </Caption>
                                                <Icon
                                                    name="add-circle-outline"
                                                    size={18}
                                                    color={Colors.accent}
                                                />
                                            </Pressable>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Custom Tags */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <Caption style={styles.sectionLabel}>
                                        {t('Custom Tags')}
                                    </Caption>
                                    <Caption
                                        style={styles.xpHint}
                                        color="accent">
                                        +1 XP
                                    </Caption>
                                </View>

                                {/* Selected custom tags */}
                                {tag.customTags && tag.customTags.length > 0 && (
                                    <View style={styles.selectedChipsWrap}>
                                        {tag.customTags.map(ct => (
                                            <View
                                                key={ct}
                                                style={styles.selectedChip}>
                                                <Caption
                                                    style={
                                                        styles.selectedChipText
                                                    }>
                                                    {ct}
                                                </Caption>
                                                <Pressable
                                                    onPress={() =>
                                                        onRemoveCustomTag(ct)
                                                    }
                                                    hitSlop={4}>
                                                    <Icon
                                                        name="close"
                                                        size={14}
                                                        color="#888"
                                                    />
                                                </Pressable>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                {/* Custom tag input */}
                                <View style={styles.searchRow}>
                                    <Icon
                                        name="create-outline"
                                        size={16}
                                        color="#aaa"
                                        style={styles.searchIcon}
                                    />
                                    <TextInput
                                        style={styles.searchInput}
                                        placeholder={t('Add custom tag')}
                                        placeholderTextColor="#aaa"
                                        value={customTagText}
                                        onChangeText={setCustomTagText}
                                        onSubmitEditing={handleAddCustomTag}
                                        returnKeyType="done"
                                    />
                                    {customTagText.length > 0 && (
                                        <Pressable
                                            onPress={handleAddCustomTag}
                                            hitSlop={4}
                                            style={styles.addBtn}>
                                            <Icon
                                                name="add"
                                                size={18}
                                                color={Colors.accent}
                                            />
                                        </Pressable>
                                    )}
                                </View>
                            </View>

                            {/* Done */}
                            <Pressable
                                style={styles.doneButton}
                                onPress={onClose}>
                                <Body color="white" style={styles.doneText}>
                                    Done
                                </Body>
                            </Pressable>

                            <View style={styles.bottomSpacer} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)'
    },
    keyboardView: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    backdrop: {
        flex: 1
    },
    sheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 24,
        maxHeight: '85%'
    },
    handle: {
        width: 36,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#e0e0e0',
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 16
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12
    },
    headerColorBar: {
        width: 4,
        height: 36,
        borderRadius: 2
    },
    headerName: {
        fontSize: 17,
        fontWeight: '600'
    },
    section: {
        marginBottom: 20
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    sectionLabel: {
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8
    },
    xpHint: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20
    },
    stepperBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepperBtnDisabled: {
        opacity: 0.4
    },
    quantityText: {
        fontSize: 22,
        fontWeight: '600',
        minWidth: 30,
        textAlign: 'center'
    },
    selectedChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 100,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 5,
        gap: 4
    },
    selectedChipText: {
        fontSize: 13,
        color: '#333'
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 10,
        height: 40
    },
    searchIcon: {
        marginRight: 6
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#333',
        paddingVertical: 0
    },
    addBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.accentLight,
        justifyContent: 'center',
        alignItems: 'center'
    },
    brandResults: {
        marginTop: 4,
        borderRadius: 8,
        backgroundColor: '#fafafa',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#e8e8e8'
    },
    brandRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0'
    },
    brandName: {
        fontSize: 14,
        color: '#333'
    },
    doneButton: {
        backgroundColor: Colors.accent,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 4
    },
    doneText: {
        fontWeight: '600',
        fontSize: 16
    },
    bottomSpacer: {
        height: 40
    }
});

export default React.memo(TagDetailSheet);
