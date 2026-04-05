import React, {useCallback, useRef, useState} from 'react';
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useDispatch, useSelector, shallowEqual} from 'react-redux';
import {useTranslation} from 'react-i18next';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    runOnJS
} from 'react-native-reanimated';
import {Swipeable} from 'react-native-gesture-handler';
import {Body, Caption, Colors, Header} from '../components';
import {resolveTagEntry} from '../addTag/components/tagUtils';
import {
    removeQuickTag,
    reorderQuickTags,
    setPresets
} from '../../reducers/quick_tags_reducer';
import {resolveDefaultQuickTags} from '../../utils/defaultQuickTags';
import api from '../../utils/apiClient';
import QuickTagEditModal from './QuickTagEditModal';

const ROW_HEIGHT = 64;

// --- Draggable Row ---

const DraggableRow = React.memo(({
    item,
    index,
    totalCount,
    entriesByCloId,
    typeEntriesByKey,
    onDelete,
    onEdit,
    onDragStart,
    onDragEnd,
    isDragging,
    draggedIndex,
    dragTranslateY
}) => {
    const {t} = useTranslation();
    const entry = resolveTagEntry(
        item.cloId,
        item.typeId,
        entriesByCloId,
        typeEntriesByKey
    );
    const name = item.customName || entry?.displayName || item.name || '?';
    const category = entry?.categoryDisplayName || '';
    const hasMaterials = item.materials?.length > 0;
    const hasBrands = item.brands?.length > 0;

    const animatedStyle = useAnimatedStyle(() => {
        if (isDragging && draggedIndex.value === index) {
            // This is the item being dragged
            return {
                transform: [{translateY: dragTranslateY.value}],
                zIndex: 100,
                shadowColor: '#000',
                shadowOffset: {width: 0, height: 4},
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 8
            };
        }

        // Shift other items out of the way
        if (isDragging && draggedIndex.value >= 0) {
            const dragIdx = draggedIndex.value;
            const currentDragPosition = dragIdx + Math.round(dragTranslateY.value / ROW_HEIGHT);
            const clampedPos = Math.max(0, Math.min(totalCount - 1, currentDragPosition));

            let shift = 0;
            if (dragIdx < index && clampedPos >= index) {
                shift = -ROW_HEIGHT;
            } else if (dragIdx > index && clampedPos <= index) {
                shift = ROW_HEIGHT;
            }

            return {
                transform: [{translateY: withTiming(shift, {duration: 200})}],
                zIndex: 0
            };
        }

        return {
            transform: [{translateY: withTiming(0, {duration: 200})}],
            zIndex: 0
        };
    });

    const panGesture = Gesture.Pan()
        .activateAfterLongPress(200)
        .onStart(() => {
            runOnJS(onDragStart)(index);
        })
        .onUpdate((e) => {
            dragTranslateY.value = e.translationY;
        })
        .onEnd(() => {
            runOnJS(onDragEnd)();
        });

    const renderRightActions = () => (
        <Pressable
            style={styles.deleteAction}
            onPress={() => onDelete(item.id)}>
            <Icon name="trash-outline" size={20} color={Colors.white} />
        </Pressable>
    );

    return (
        <Animated.View style={[styles.rowAnimated, animatedStyle]}>
            <Swipeable
                renderRightActions={renderRightActions}
                overshootRight={false}>
                <View style={styles.row}>
                    <GestureDetector gesture={panGesture}>
                        <Animated.View style={styles.dragHandle}>
                            <Icon name="reorder-three" size={22} color={Colors.muted} />
                        </Animated.View>
                    </GestureDetector>
                    <Pressable
                        style={styles.rowContent}
                        onPress={() => onEdit(item)}>
                        <Body family="medium" numberOfLines={1}>
                            {name}
                        </Body>
                        <Caption color="muted" numberOfLines={1}>
                            {category}
                            {item.quantity > 1 ? ` · ${t('qty')} ${item.quantity}` : ''}
                            {hasMaterials ? ` · ${t('{{count}} material', {count: item.materials.length})}` : ''}
                            {hasBrands ? ` · ${t('{{count}} brand', {count: item.brands.length})}` : ''}
                        </Caption>
                    </Pressable>
                    <Pressable onPress={() => onEdit(item)} hitSlop={8}>
                        <Icon
                            name="chevron-forward-outline"
                            size={20}
                            color={Colors.muted}
                        />
                    </Pressable>
                </View>
            </Swipeable>
        </Animated.View>
    );
});

// --- Main Screen ---

const QuickTagsSettingsScreen = ({navigation}) => {
    const dispatch = useDispatch();
    const {t} = useTranslation();
    const presets = useSelector(state => state.quickTags.presets);
    const {entriesByCloId, typeEntriesByKey, objectEntries, brandsById} = useSelector(
        state => state.tags,
        shallowEqual
    );

    const [editingPreset, setEditingPreset] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    const draggedIndex = useSharedValue(-1);
    const dragTranslateY = useSharedValue(0);
    const presetsRef = useRef(presets);
    presetsRef.current = presets;

    const handleDelete = useCallback(
        (id) => {
            dispatch(removeQuickTag({id}));
        },
        [dispatch]
    );

    const handleResetDefaults = useCallback(() => {
        Alert.alert(
            t('Reset to Defaults'),
            t('This will replace all your quick tags with the default set.'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {
                    text: t('Reset'),
                    style: 'destructive',
                    onPress: () => {
                        const defaults = resolveDefaultQuickTags(objectEntries, brandsById);
                        dispatch(setPresets(defaults));
                    }
                }
            ]
        );
    }, [dispatch, objectEntries, brandsById, t]);

    const token = useSelector(state => state.auth.token);
    const [isLoadingTopTags, setIsLoadingTopTags] = useState(false);

    const handleUseMyTopTags = useCallback(() => {
        Alert.alert(
            t('Use My Top Tags'),
            t('This will replace your quick tags with your most-tagged items.'),
            [
                {text: t('Cancel'), style: 'cancel'},
                {
                    text: t('Use My Tags'),
                    onPress: async () => {
                        setIsLoadingTopTags(true);
                        try {
                            const response = await api.get('/api/v3/user/top-tags', {
                                token,
                                params: {limit: 20}
                            });
                            const tags = response.data?.tags || [];
                            if (tags.length === 0) {
                                Alert.alert(t('No Tags Yet'), t('You haven\'t tagged enough items yet. Keep tagging to build your personal presets!'));
                                return;
                            }
                            const presets = tags.map(tag => {
                                const entry = resolveTagEntry(
                                    tag.clo_id,
                                    tag.type_id,
                                    entriesByCloId,
                                    typeEntriesByKey
                                );
                                return {
                                    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
                                    cloId: tag.clo_id,
                                    typeId: tag.type_id ?? null,
                                    name: entry?.displayName ?? null,
                                    customName: null,
                                    quantity: 1,
                                    picked_up: null,
                                    materials: [],
                                    brands: tag.brand_id ? [{id: tag.brand_id, quantity: 1}] : []
                                };
                            });
                            dispatch(setPresets(presets));
                        } catch (error) {
                            if (__DEV__) console.log('[QuickTags] top tags fetch failed:', error.message);
                            Alert.alert(t('Error'), t('Failed to load your top tags. Please try again.'));
                        } finally {
                            setIsLoadingTopTags(false);
                        }
                    }
                }
            ]
        );
    }, [dispatch, token, t]);

    const handleDragStart = useCallback((index) => {
        draggedIndex.value = index;
        dragTranslateY.value = 0;
        setIsDragging(true);
    }, [draggedIndex, dragTranslateY]);

    const handleDragEnd = useCallback(() => {
        const fromIndex = draggedIndex.value;
        const offset = Math.round(dragTranslateY.value / ROW_HEIGHT);
        const toIndex = Math.max(0, Math.min(presetsRef.current.length - 1, fromIndex + offset));

        if (fromIndex !== toIndex && fromIndex >= 0) {
            const ids = presetsRef.current.map(p => p.id);
            const [moved] = ids.splice(fromIndex, 1);
            ids.splice(toIndex, 0, moved);
            dispatch(reorderQuickTags({orderedIds: ids}));
        }

        draggedIndex.value = -1;
        dragTranslateY.value = withTiming(0, {duration: 150});
        setIsDragging(false);
    }, [dispatch, draggedIndex, dragTranslateY]);

    return (
        <View style={styles.container}>
            <Header
                leftContent={
                    <Pressable onPress={() => navigation.goBack()}>
                        <Icon
                            name="chevron-back-outline"
                            color={Colors.white}
                            size={24}
                        />
                    </Pressable>
                }
                title={t('Quick Tags')}
            />
            <View style={styles.descriptionBox}>
                <Caption color="muted" style={styles.descriptionText}>
                    {t('Quick tags appear as shortcuts when tagging photos. Star any tag to add it here, or customise the default quantity, materials and picked up status.')}
                </Caption>
            </View>
            {presets.length === 0 ? (
                <View style={styles.emptyState}>
                    <Icon name="star-outline" size={48} color={Colors.muted} />
                    <Body color="muted" style={styles.emptyTitle}>
                        {t('No quick tags yet')}
                    </Body>
                    <Caption color="muted" style={styles.emptyHint}>
                        {t('Tap the star icon on any tag to add it here')}
                    </Caption>
                    <Pressable
                        style={styles.resetButton}
                        onPress={handleResetDefaults}>
                        <Caption color="accent" family="semiBold">
                            {t('Reset to Defaults')}
                        </Caption>
                    </Pressable>
                    <Pressable
                        style={styles.resetButton}
                        onPress={handleUseMyTopTags}
                        disabled={isLoadingTopTags}>
                        <Caption color="accent" family="semiBold">
                            {isLoadingTopTags ? t('Loading...') : t('Use My Top Tags')}
                        </Caption>
                    </Pressable>
                </View>
            ) : (
                <ScrollView
                    contentContainerStyle={styles.listContent}
                    scrollEnabled={!isDragging}>
                    {presets.map((item, index) => (
                        <DraggableRow
                            key={item.id}
                            item={item}
                            index={index}
                            totalCount={presets.length}
                            entriesByCloId={entriesByCloId}
                            typeEntriesByKey={typeEntriesByKey}
                            onDelete={handleDelete}
                            onEdit={setEditingPreset}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            isDragging={isDragging}
                            draggedIndex={draggedIndex}
                            dragTranslateY={dragTranslateY}
                        />
                    ))}
                    <View style={styles.footerButtons}>
                        <Pressable
                            style={styles.footerButton}
                            onPress={handleUseMyTopTags}
                            disabled={isLoadingTopTags}>
                            <Icon name="trophy-outline" size={16} color={Colors.accent} />
                            <Caption color="accent" family="semiBold">
                                {isLoadingTopTags ? t('Loading...') : t('Use My Top Tags')}
                            </Caption>
                        </Pressable>
                        <Pressable
                            style={styles.footerButton}
                            onPress={handleResetDefaults}>
                            <Icon name="refresh-outline" size={16} color={Colors.accent} />
                            <Caption color="accent" family="semiBold">
                                {t('Reset to Defaults')}
                            </Caption>
                        </Pressable>
                    </View>
                </ScrollView>
            )}

            <QuickTagEditModal
                visible={editingPreset != null}
                preset={editingPreset}
                entriesByCloId={entriesByCloId}
                typeEntriesByKey={typeEntriesByKey}
                onClose={() => setEditingPreset(null)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7'
    },
    descriptionBox: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0'
    },
    descriptionText: {
        fontSize: 13,
        lineHeight: 18
    },
    listContent: {
        paddingBottom: 40
    },
    rowAnimated: {
        backgroundColor: '#fff'
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingRight: 16,
        height: ROW_HEIGHT,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#e0e0e0',
        gap: 12
    },
    dragHandle: {
        width: 44,
        height: ROW_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center'
    },
    rowContent: {
        flex: 1,
        gap: 2
    },
    deleteAction: {
        backgroundColor: Colors.error,
        justifyContent: 'center',
        alignItems: 'center',
        width: 72
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        gap: 12
    },
    emptyTitle: {
        fontSize: 16,
        textAlign: 'center'
    },
    emptyHint: {
        textAlign: 'center'
    },
    resetButton: {
        marginTop: 16,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: Colors.accent
    },
    footerButtons: {
        gap: 4,
        paddingBottom: 20
    },
    footerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12
    }
});

export default QuickTagsSettingsScreen;
