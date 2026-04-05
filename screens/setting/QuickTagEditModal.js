import React, {useCallback, useEffect, useMemo, useState} from 'react';
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
import {useDispatch, useSelector} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Body, Caption, Colors} from '../components';
import {resolveTagEntry, MAX_QUANTITY_TRUSTED, MAX_QUANTITY_DEFAULT} from '../addTag/components/tagUtils';
import {updateQuickTag, removeQuickTag} from '../../reducers/quick_tags_reducer';

const MAX_SEARCH_RESULTS = 10;

const QuickTagEditModal = ({
    visible,
    preset,
    entriesByCloId,
    typeEntriesByKey,
    onClose
}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const materialsById = useSelector(state => state.tags.materialsById);
    const brandsById = useSelector(state => state.tags.brandsById);
    const isTrusted = useSelector(state => state.auth.user?.verification_required === false);
    const maxQuantity = isTrusted ? MAX_QUANTITY_TRUSTED : MAX_QUANTITY_DEFAULT;

    const [customName, setCustomName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [pickedUp, setPickedUp] = useState(null);
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [materialQuery, setMaterialQuery] = useState('');
    const [brandQuery, setBrandQuery] = useState('');

    // Reset state when preset changes
    useEffect(() => {
        if (preset) {
            setCustomName(preset.customName ?? '');
            setQuantity(preset.quantity || 1);
            setPickedUp(preset.picked_up);
            setSelectedMaterials([...(preset.materials || [])]);
            setSelectedBrands((preset.brands || []).map(b => ({...b})));
            setMaterialQuery('');
            setBrandQuery('');
        }
    }, [preset]);

    const entry = useMemo(() => {
        if (!preset) return null;
        return resolveTagEntry(preset.cloId, preset.typeId, entriesByCloId, typeEntriesByKey);
    }, [preset, entriesByCloId, typeEntriesByKey]);

    const tagName = entry?.displayName || '?';
    const categoryName = entry?.categoryDisplayName || '';

    const materialsArray = useMemo(
        () => materialsById
            ? Object.values(materialsById).sort((a, b) => a.name.localeCompare(b.name))
            : [],
        [materialsById]
    );

    const brandsArray = useMemo(
        () => brandsById
            ? Object.values(brandsById).sort((a, b) => a.name.localeCompare(b.name))
            : [],
        [brandsById]
    );

    const filteredMaterials = useMemo(() => {
        if (!materialQuery.trim()) return [];
        const q = materialQuery.trim().toLowerCase();
        return materialsArray
            .filter(m => m.name.toLowerCase().startsWith(q))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, MAX_SEARCH_RESULTS);
    }, [materialsArray, materialQuery]);

    const filteredBrands = useMemo(() => {
        if (!brandQuery.trim()) return [];
        const q = brandQuery.trim().toLowerCase();
        return brandsArray
            .filter(b => b.name.toLowerCase().startsWith(q) || b.key.toLowerCase().startsWith(q))
            .sort((a, b) => a.name.localeCompare(b.name))
            .slice(0, MAX_SEARCH_RESULTS);
    }, [brandsArray, brandQuery]);

    const selectedMaterialSet = useMemo(
        () => new Set(selectedMaterials),
        [selectedMaterials]
    );

    const selectedBrandSet = useMemo(
        () => new Set(selectedBrands.map(b => b.id)),
        [selectedBrands]
    );

    const handleToggleMaterial = useCallback((id) => {
        setSelectedMaterials(prev => {
            if (prev.includes(id)) {
                return prev.filter(m => m !== id);
            }
            return [...prev, id];
        });
    }, []);

    const handleToggleBrand = useCallback((id) => {
        setSelectedBrands(prev => {
            if (prev.some(b => b.id === id)) {
                return prev.filter(b => b.id !== id);
            }
            return [...prev, {id, quantity: 1}];
        });
    }, []);

    const handleSave = useCallback(() => {
        if (!preset) return;
        const trimmedName = customName.trim();
        dispatch(updateQuickTag({
            id: preset.id,
            changes: {
                customName: trimmedName || null,
                quantity,
                picked_up: pickedUp,
                materials: selectedMaterials,
                brands: selectedBrands
            }
        }));
        onClose();
    }, [dispatch, preset, customName, quantity, pickedUp, selectedMaterials, selectedBrands, onClose]);

    const handleDelete = useCallback(() => {
        if (!preset) return;
        dispatch(removeQuickTag({id: preset.id}));
        onClose();
    }, [dispatch, preset, onClose]);

    if (!preset) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={false}
            onRequestClose={onClose}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={onClose} hitSlop={12}>
                        <Icon name="close" size={24} color={Colors.text} />
                    </Pressable>
                    <View style={styles.headerCenter}>
                        <Body family="semiBold" numberOfLines={1}>
                            {customName.trim() || tagName}
                        </Body>
                        <Caption color="muted">{categoryName}</Caption>
                    </View>
                    <Pressable onPress={handleSave} hitSlop={12}>
                        <Body color="accent" family="semiBold">
                            {t('Save')}
                        </Body>
                    </Pressable>
                </View>

                <KeyboardAvoidingView
                    style={styles.scroll}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={0}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled">

                    {/* Custom Name */}
                    <View style={styles.section}>
                        <Caption color="muted" family="semiBold" style={styles.sectionTitle}>
                            {t('Custom Name')}
                        </Caption>
                        <TextInput
                            style={styles.searchInput}
                            placeholder={tagName}
                            placeholderTextColor={Colors.muted}
                            value={customName}
                            onChangeText={setCustomName}
                            autoCorrect={false}
                            maxLength={60}
                        />
                    </View>

                    {/* Quantity */}
                    <View style={styles.section}>
                        <Caption color="muted" family="semiBold" style={styles.sectionTitle}>
                            {t('Quantity')}
                        </Caption>
                        <View style={styles.quantityRow}>
                            <Pressable
                                style={styles.quantityBtn}
                                onPress={() => setQuantity(q => Math.max(1, q - 1))}
                                disabled={quantity <= 1}>
                                <Icon
                                    name="remove"
                                    size={20}
                                    color={quantity <= 1 ? Colors.muted : Colors.text}
                                />
                            </Pressable>
                            <Body family="semiBold" style={styles.quantityValue}>
                                {quantity}
                            </Body>
                            <Pressable
                                style={styles.quantityBtn}
                                onPress={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
                                disabled={quantity >= maxQuantity}>
                                <Icon
                                    name="add"
                                    size={20}
                                    color={quantity >= maxQuantity ? Colors.muted : Colors.text}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* Picked Up */}
                    <View style={styles.section}>
                        <Caption color="muted" family="semiBold" style={styles.sectionTitle}>
                            {t('Picked Up')}
                        </Caption>
                        <View style={styles.pickedUpRow}>
                            {[
                                {value: null, label: t('Default')},
                                {value: true, label: t('Yes')},
                                {value: false, label: t('No')}
                            ].map(opt => (
                                <Pressable
                                    key={String(opt.value)}
                                    style={[
                                        styles.pickedUpOption,
                                        pickedUp === opt.value && styles.pickedUpOptionActive
                                    ]}
                                    onPress={() => setPickedUp(opt.value)}>
                                    <Caption
                                        color={pickedUp === opt.value ? 'white' : 'text'}
                                        family="medium">
                                        {opt.label}
                                    </Caption>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* Materials */}
                    <View style={styles.section}>
                        <Caption color="muted" family="semiBold" style={styles.sectionTitle}>
                            {t('Materials')} ({selectedMaterials.length})
                        </Caption>
                        {selectedMaterials.length > 0 && (
                            <View style={styles.chipWrap}>
                                {selectedMaterials.map(id => {
                                    const mat = materialsById?.[id];
                                    return (
                                        <Pressable
                                            key={id}
                                            style={styles.selectedChip}
                                            onPress={() => handleToggleMaterial(id)}>
                                            <Caption color="white" family="medium">
                                                {mat?.name || `#${id}`}
                                            </Caption>
                                            <Icon name="close" size={12} color={Colors.white} />
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('Search materials')}
                            placeholderTextColor={Colors.muted}
                            value={materialQuery}
                            onChangeText={setMaterialQuery}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {filteredMaterials.map(mat => {
                            const isSelected = selectedMaterialSet.has(mat.id);
                            return (
                                <Pressable
                                    key={mat.id}
                                    style={[styles.searchRow, isSelected && styles.searchRowSelected]}
                                    onPress={() => handleToggleMaterial(mat.id)}>
                                    <Body family="medium">{mat.name}</Body>
                                    {isSelected && (
                                        <Icon name="checkmark" size={18} color={Colors.accent} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Brands */}
                    <View style={styles.section}>
                        <Caption color="muted" family="semiBold" style={styles.sectionTitle}>
                            {t('Brands')} ({selectedBrands.length})
                        </Caption>
                        {selectedBrands.length > 0 && (
                            <View style={styles.chipWrap}>
                                {selectedBrands.map(b => {
                                    const brand = brandsById?.[b.id];
                                    return (
                                        <Pressable
                                            key={b.id}
                                            style={styles.selectedChip}
                                            onPress={() => handleToggleBrand(b.id)}>
                                            <Caption color="white" family="medium">
                                                {brand?.name || `#${b.id}`}
                                            </Caption>
                                            <Icon name="close" size={12} color={Colors.white} />
                                        </Pressable>
                                    );
                                })}
                            </View>
                        )}
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('Search brands')}
                            placeholderTextColor={Colors.muted}
                            value={brandQuery}
                            onChangeText={setBrandQuery}
                            autoCorrect={false}
                            autoCapitalize="none"
                        />
                        {filteredBrands.map(brand => {
                            const isSelected = selectedBrandSet.has(brand.id);
                            return (
                                <Pressable
                                    key={brand.id}
                                    style={[styles.searchRow, isSelected && styles.searchRowSelected]}
                                    onPress={() => handleToggleBrand(brand.id)}>
                                    <Body family="medium">{brand.name}</Body>
                                    {isSelected && (
                                        <Icon name="checkmark" size={18} color={Colors.accent} />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable style={styles.deleteButton} onPress={handleDelete}>
                        <Icon name="trash-outline" size={16} color={Colors.error} />
                        <Caption color="error" family="medium">
                            {t('Remove')}
                        </Caption>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 56,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
        gap: 12
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center'
    },
    scroll: {
        flex: 1
    },
    scrollContent: {
        padding: 16,
        gap: 24
    },
    section: {
        gap: 8
    },
    sectionTitle: {
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 11
    },
    quantityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    quantityBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center'
    },
    quantityValue: {
        fontSize: 20,
        minWidth: 30,
        textAlign: 'center'
    },
    pickedUpRow: {
        flexDirection: 'row',
        gap: 8
    },
    pickedUpOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: '#f0f0f0'
    },
    pickedUpOptionActive: {
        backgroundColor: Colors.accent
    },
    chipWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    selectedChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
        backgroundColor: Colors.accent
    },
    searchInput: {
        backgroundColor: '#f5f5f5',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#050916',
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0'
    },
    searchRowSelected: {
        backgroundColor: Colors.accentLight
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e0e0e0',
        alignItems: 'center'
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8
    }
});

export default QuickTagEditModal;
