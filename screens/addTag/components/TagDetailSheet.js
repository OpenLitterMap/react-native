import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    InteractionManager,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import {Body, Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {MAX_QUANTITY_DEFAULT} from './tagUtils';
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
    onSetPickedUp,
    onClose,
    maxQuantity = MAX_QUANTITY_DEFAULT
}) => {
    const {t} = useTranslation();
    const [materialQuery, setMaterialQuery] = useState('');
    const [brandQuery, setBrandQuery] = useState('');
    const [customTagText, setCustomTagText] = useState('');
    const scrollRef = useRef(null);
    const materialsSectionYRef = useRef(0);
    const brandsSectionYRef = useRef(0);
    const [isMaterialFocused, setIsMaterialFocused] = useState(false);
    const [isBrandFocused, setIsBrandFocused] = useState(false);

    // Reset search inputs when the sheet opens
    useEffect(() => {
        if (visible) {
            setMaterialQuery('');
            setBrandQuery('');
            setCustomTagText('');
        }
    }, [visible]);

    const categoryColor = getCategoryColor(tagEntry?.categoryKey || tag?.fallbackCategoryKey);
    const tagName = tagEntry?.displayName || tag?.fallbackDisplayName || `#${tag?.cloId}`;
    const categoryName = tagEntry?.categoryDisplayName || tag?.fallbackCategoryName || '';

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

    const handleCreateBrandAsCustomTag = () => {
        const trimmed = brandQuery.trim();
        if (trimmed) {
            onAddCustomTag(`brand:${trimmed}`);
            setBrandQuery('');
        }
    };

    const handleCreateMaterialAsCustomTag = () => {
        const trimmed = materialQuery.trim();
        if (trimmed) {
            onAddCustomTag(`material:${trimmed}`);
            setMaterialQuery('');
        }
    };

    const scrollToSection = useCallback(y => {
        InteractionManager.runAfterInteractions(() => {
            scrollRef.current?.scrollTo({
                y: Math.max(0, y - 8),
                animated: true
            });
        });
    }, []);

    const scrollMaterialsIntoView = useCallback(() => {
        scrollToSection(materialsSectionYRef.current);
    }, [scrollToSection]);

    const handleMaterialFocus = useCallback(() => {
        setIsMaterialFocused(true);
        scrollMaterialsIntoView();
        setTimeout(scrollMaterialsIntoView, 150);
        setTimeout(scrollMaterialsIntoView, 350);
    }, [scrollMaterialsIntoView]);

    const handleMaterialBlur = useCallback(() => {
        setIsMaterialFocused(false);
    }, []);

    const scrollBrandsIntoView = useCallback(() => {
        scrollToSection(brandsSectionYRef.current);
    }, [scrollToSection]);

    const handleBrandFocus = useCallback(() => {
        setIsBrandFocused(true);
        scrollBrandsIntoView();
        setTimeout(scrollBrandsIntoView, 150);
        setTimeout(scrollBrandsIntoView, 350);
    }, [scrollBrandsIntoView]);

    const handleBrandBlur = useCallback(() => {
        setIsBrandFocused(false);
    }, []);

    const showBrandCreateOption =
        brandQuery.trim().length > 0 && brandResults.length === 0;
    const showMaterialCreateOption =
        materialQuery.trim().length > 0 && materialResults.length === 0;

    // Always render the Modal shell — let `visible` prop control native presentation.
    // Avoids full subtree mount/unmount churn that causes Fabric recycler crashes.
    const qty = tag?.quantity || 1;

    // Swipe-down-to-close gesture
    const translateY = useSharedValue(0);
    const scrollAtTop = useRef(true);

    const dismissSheet = useCallback(() => {
        Keyboard.dismiss();
        onClose();
    }, [onClose]);

    // Reset translateY when sheet opens
    useEffect(() => {
        if (visible) translateY.value = 0;
    }, [visible, translateY]);

    const swipeGesture = Gesture.Pan()
        .activeOffsetY(12)
        .failOffsetX([-20, 20])
        .onUpdate(e => {
            // Only allow dragging down, and only when scroll is at top
            if (e.translationY > 0 && scrollAtTop.current) {
                translateY.value = e.translationY;
            }
        })
        .onEnd(e => {
            if (e.translationY > 80 || (e.translationY > 30 && e.velocityY > 500)) {
                translateY.value = withTiming(600, {duration: 200});
                runOnJS(dismissSheet)();
            } else {
                translateY.value = withSpring(0, {damping: 20, stiffness: 300});
            }
        });

    const sheetAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{translateY: translateY.value}]
    }));

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible && tag != null}
            onRequestClose={dismissSheet}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}>
                    <Pressable style={styles.backdrop} onPress={dismissSheet} />
                    <GestureDetector gesture={swipeGesture}>
                        <Animated.View style={[styles.sheet, sheetAnimatedStyle]}>
                            <ScrollView
                                ref={scrollRef}
                                showsVerticalScrollIndicator={false}
                                bounces={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={styles.scrollContent}
                                onScroll={e => { scrollAtTop.current = e.nativeEvent.contentOffset.y <= 1; }}
                                scrollEventThrottle={16}
                                onContentSizeChange={() => {
                                    if (isMaterialFocused) {
                                        scrollMaterialsIntoView();
                                    }
                                    if (isBrandFocused) {
                                        scrollBrandsIntoView();
                                    }
                                }}>
                                <View style={styles.handle} />

                                {/* Content guard: tag can be null during Modal close animation.
                                Sheet/ScrollView/handle stay mounted; only content is gated. */}
                                {!tag ? <View style={styles.bottomSpacer} /> : <>

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
                                                onPress={() => {
                                                    if (qty <= 1) {
                                                        onClose();
                                                    }
                                                    onUpdateQuantity(
                                                        tag.cloId,
                                                        tag.typeId,
                                                        qty - 1
                                                    );
                                                }}>
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
                                                    qty >= maxQuantity &&
                                                styles.stepperBtnDisabled
                                                ]}
                                                onPress={() =>
                                                    onUpdateQuantity(
                                                        tag.cloId,
                                                        tag.typeId,
                                                        qty + 1
                                                    )
                                                }
                                                disabled={qty >= maxQuantity}>
                                                <Icon
                                                    name="add"
                                                    size={18}
                                                    color={
                                                        qty >= maxQuantity
                                                            ? '#ccc'
                                                            : '#333'
                                                    }
                                                />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {/* Picked Up */}
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <Caption style={styles.sectionLabel}>
                                                {t('Picked Up')}
                                            </Caption>
                                            <Caption
                                                style={styles.xpHint}
                                                color="accent">
                                                +5 XP
                                            </Caption>
                                        </View>
                                        <View style={styles.pickedUpRow}>
                                            <Pressable
                                                style={[
                                                    styles.pickedUpOption,
                                                    tag.picked_up === true && styles.pickedUpOptionActive
                                                ]}
                                                onPress={() => onSetPickedUp(tag.cloId, tag.typeId, true)}>
                                                <Icon name="checkmark" size={16} color={tag.picked_up === true ? Colors.white : '#666'} />
                                                <Caption style={{color: tag.picked_up === true ? Colors.white : '#666'}}>
                                                    {t('Yes')}
                                                </Caption>
                                            </Pressable>
                                            <Pressable
                                                style={[
                                                    styles.pickedUpOption,
                                                    tag.picked_up === false && styles.pickedUpOptionNo
                                                ]}
                                                onPress={() => onSetPickedUp(tag.cloId, tag.typeId, false)}>
                                                <Icon name="close" size={16} color={tag.picked_up === false ? Colors.white : '#666'} />
                                                <Caption style={{color: tag.picked_up === false ? Colors.white : '#666'}}>
                                                    {t('No')}
                                                </Caption>
                                            </Pressable>
                                            <Pressable
                                                style={[
                                                    styles.pickedUpOption,
                                                    (tag.picked_up === null || tag.picked_up === undefined) && styles.pickedUpOptionNull
                                                ]}
                                                onPress={() => onSetPickedUp(tag.cloId, tag.typeId, null)}>
                                                <Icon name="help" size={16} color={(tag.picked_up === null || tag.picked_up === undefined) ? Colors.white : '#666'} />
                                                <Caption style={{color: (tag.picked_up === null || tag.picked_up === undefined) ? Colors.white : '#666'}}>
                                                    {t('Unknown')}
                                                </Caption>
                                            </Pressable>
                                        </View>
                                    </View>

                                    {/* Materials */}
                                    <View
                                        style={styles.section}
                                        onLayout={event => {
                                            materialsSectionYRef.current = event.nativeEvent.layout.y;
                                        }}>
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
                                                onFocus={handleMaterialFocus}
                                                onBlur={handleMaterialBlur}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <Pressable
                                                onPress={() => setMaterialQuery('')}
                                                hitSlop={4}
                                                style={{opacity: materialQuery.length > 0 ? 1 : 0}}
                                                disabled={materialQuery.length === 0}>
                                                <Icon
                                                    name="close-circle"
                                                    size={16}
                                                    color="#ccc"
                                                />
                                            </Pressable>
                                        </View>

                                        {/* Material results — container always mounted to avoid
                                    Fabric churn while typing with active keyboard session */}
                                        <View style={materialResults.length > 0 ? styles.brandResults : undefined}>
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

                                        {/* Create custom tag from material search — always mounted */}
                                        <Pressable
                                            style={[styles.createCustomRow, {display: showMaterialCreateOption ? 'flex' : 'none'}]}
                                            onPress={handleCreateMaterialAsCustomTag}
                                            disabled={!showMaterialCreateOption}>
                                            <View style={styles.createCustomLeft}>
                                                <Icon
                                                    name="pricetag-outline"
                                                    size={16}
                                                    color="#6366f1"
                                                />
                                                <Caption style={styles.createCustomText}>
                                                    {t('Create')}{' '}
                                                    <Caption style={styles.createCustomTag}>
                                                        material:{materialQuery.trim()}
                                                    </Caption>
                                                </Caption>
                                            </View>
                                            <Icon
                                                name="add-circle-outline"
                                                size={18}
                                                color="#6366f1"
                                            />
                                        </Pressable>
                                    </View>

                                    {/* Brands */}
                                    <View
                                        style={styles.section}
                                        onLayout={event => {
                                            brandsSectionYRef.current = event.nativeEvent.layout.y;
                                        }}>
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
                                                onFocus={handleBrandFocus}
                                                onBlur={handleBrandBlur}
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                            />
                                            <Pressable
                                                onPress={() => setBrandQuery('')}
                                                hitSlop={4}
                                                style={{opacity: brandQuery.length > 0 ? 1 : 0}}
                                                disabled={brandQuery.length === 0}>
                                                <Icon
                                                    name="close-circle"
                                                    size={16}
                                                    color="#ccc"
                                                />
                                            </Pressable>
                                        </View>

                                        {/* Brand results */}
                                        {/* Brand results — container always mounted */}
                                        <View style={brandResults.length > 0 ? styles.brandResults : undefined}>
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

                                        {/* Create custom tag from brand search — always mounted */}
                                        <Pressable
                                            style={[styles.createCustomRow, {display: showBrandCreateOption ? 'flex' : 'none'}]}
                                            onPress={handleCreateBrandAsCustomTag}
                                            disabled={!showBrandCreateOption}>
                                            <View style={styles.createCustomLeft}>
                                                <Icon
                                                    name="pricetag-outline"
                                                    size={16}
                                                    color="#6366f1"
                                                />
                                                <Caption style={styles.createCustomText}>
                                                    {t('Create')}{' '}
                                                    <Caption style={styles.createCustomTag}>
                                                        brand:{brandQuery.trim()}
                                                    </Caption>
                                                </Caption>
                                            </View>
                                            <Icon
                                                name="add-circle-outline"
                                                size={18}
                                                color="#6366f1"
                                            />
                                        </Pressable>
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
                                                maxLength={100}
                                            />
                                            <Pressable
                                                onPress={handleAddCustomTag}
                                                hitSlop={4}
                                                style={[styles.addBtn, {opacity: customTagText.length > 0 ? 1 : 0}]}
                                                disabled={customTagText.length === 0}>
                                                <Icon
                                                    name="add"
                                                    size={18}
                                                    color={Colors.accent}
                                                />
                                            </Pressable>
                                        </View>
                                    </View>

                                    {/* Done / Create Tag */}
                                    <Pressable
                                        style={styles.doneButton}
                                        onPress={() => {
                                            if (customTagText.trim()) {
                                                handleAddCustomTag();
                                            }
                                            if (brandQuery.trim() && brandResults.length === 0) {
                                                handleCreateBrandAsCustomTag();
                                            }
                                            if (materialQuery.trim() && materialResults.length === 0) {
                                                handleCreateMaterialAsCustomTag();
                                            }
                                            Keyboard.dismiss();
                                            onClose();
                                        }}>
                                        <Body color="white" style={styles.doneText}>
                                            {customTagText.trim() ||
                                        (brandQuery.trim() && brandResults.length === 0) ||
                                        (materialQuery.trim() && materialResults.length === 0)
                                                ? t('Create Tag')
                                                : t('Done')}
                                        </Body>
                                    </Pressable>

                                    <View style={styles.bottomSpacer} />
                                </>}
                            </ScrollView>
                        </Animated.View>
                    </GestureDetector>
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
    scrollContent: {
        paddingBottom: 40
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
    createCustomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginTop: 4,
        borderRadius: 8,
        backgroundColor: '#f0edff'
    },
    createCustomLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1
    },
    createCustomText: {
        fontSize: 13,
        color: '#6366f1'
    },
    createCustomTag: {
        fontSize: 13,
        color: '#6366f1',
        fontWeight: '600'
    },
    pickedUpRow: {
        flexDirection: 'row',
        gap: 8
    },
    pickedUpOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: '#f0f0f0'
    },
    pickedUpOptionActive: {
        backgroundColor: Colors.accent
    },
    pickedUpOptionNo: {
        backgroundColor: Colors.error
    },
    pickedUpOptionNull: {
        backgroundColor: '#999'
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
