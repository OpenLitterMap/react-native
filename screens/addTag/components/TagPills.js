import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
    LayoutAnimation,
    Platform,
    Pressable,
    StyleSheet,
    UIManager,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {makeTagKey, resolveTagEntry, MAX_QUANTITY} from './tagUtils';

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const TagPills = ({
    tags,
    customTags,
    entriesByCloId,
    typeEntriesByKey,
    onRemove,
    onRemoveCustomTag,
    onUpdateQuantity,
    onOpenDetail
}) => {
    const [expandedKey, setExpandedKey] = useState(null);
    const prevTagCount = useRef(tags?.length || 0);

    const tagCount = (tags?.length || 0) + (customTags?.length || 0);
    useEffect(() => {
        if (tagCount !== prevTagCount.current) {
            LayoutAnimation.configureNext(
                LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
            );
            prevTagCount.current = tagCount;
        }
    }, [tagCount]);

    const handlePillPress = useCallback(key => {
        LayoutAnimation.configureNext(
            LayoutAnimation.create(150, 'easeInEaseOut', 'opacity')
        );
        setExpandedKey(prev => (prev === key ? null : key));
    }, []);

    const handleRemove = useCallback(
        (cloId, typeId) => {
            setExpandedKey(null);
            onRemove(cloId, typeId);
        },
        [onRemove]
    );

    const handleIncrement = useCallback(
        (cloId, typeId, currentQty) => {
            if (currentQty < MAX_QUANTITY) {
                onUpdateQuantity(cloId, typeId, currentQty + 1);
            }
        },
        [onUpdateQuantity]
    );

    const handleDecrement = useCallback(
        (cloId, typeId, currentQty) => {
            if (currentQty <= 1) {
                setExpandedKey(null);
                onRemove(cloId, typeId);
            } else {
                onUpdateQuantity(cloId, typeId, currentQty - 1);
            }
        },
        [onRemove, onUpdateQuantity]
    );

    const hasCustomTags = customTags && customTags.length > 0;

    if ((!tags || tags.length === 0) && !hasCustomTags) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.pillsWrap}>
                {tags.map(tag => {
                    const tagKey = makeTagKey(tag.cloId, tag.typeId);
                    const entry = resolveTagEntry(
                        tag.cloId,
                        tag.typeId,
                        entriesByCloId,
                        typeEntriesByKey
                    );
                    const name = entry?.displayName || tag._displayName || `#${tag.cloId}`;
                    const category = entry?.isMultiCategory
                        ? entry.categoryDisplayName
                        : null;
                    const label = category ? `${name} · ${category}` : name;
                    const qty = tag.quantity;
                    const isExpanded = expandedKey === tagKey;
                    const categoryColor = getCategoryColor(entry?.categoryKey || tag._categoryKey);

                    if (isExpanded) {
                        return (
                            <View
                                key={tagKey}
                                style={[
                                    styles.pillExpanded,
                                    {borderLeftColor: categoryColor}
                                ]}>
                                <Pressable
                                    style={styles.stepperBtn}
                                    onPress={() =>
                                        handleDecrement(
                                            tag.cloId,
                                            tag.typeId,
                                            qty
                                        )
                                    }
                                    hitSlop={4}>
                                    <Icon
                                        name={
                                            qty <= 1
                                                ? 'trash-outline'
                                                : 'remove'
                                        }
                                        size={16}
                                        color={
                                            qty <= 1
                                                ? Colors.error
                                                : Colors.white
                                        }
                                    />
                                </Pressable>

                                <Pressable
                                    style={styles.expandedBody}
                                    onPress={() => handlePillPress(tagKey)}>
                                    <Caption
                                        color="white"
                                        family="medium"
                                        style={styles.pillText}>
                                        {label}
                                    </Caption>
                                    <View style={styles.qtyInline}>
                                        <Caption
                                            color="white"
                                            family="semiBold"
                                            style={styles.qtyInlineText}>
                                            {qty}
                                        </Caption>
                                    </View>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.stepperBtn,
                                        qty >= MAX_QUANTITY &&
                                            styles.stepperBtnDisabled
                                    ]}
                                    onPress={() =>
                                        handleIncrement(
                                            tag.cloId,
                                            tag.typeId,
                                            qty
                                        )
                                    }
                                    disabled={qty >= MAX_QUANTITY}
                                    hitSlop={4}>
                                    <Icon
                                        name="add"
                                        size={16}
                                        color={
                                            qty >= MAX_QUANTITY
                                                ? 'rgba(255,255,255,0.3)'
                                                : Colors.white
                                        }
                                    />
                                </Pressable>

                                <Pressable
                                    style={styles.detailBtn}
                                    onPress={() =>
                                        onOpenDetail && onOpenDetail(tag)
                                    }
                                    hitSlop={4}>
                                    <Icon
                                        name="ellipsis-horizontal"
                                        size={14}
                                        color={Colors.white}
                                    />
                                </Pressable>

                                <Pressable
                                    style={styles.removeBtn}
                                    onPress={() =>
                                        handleRemove(tag.cloId, tag.typeId)
                                    }
                                    hitSlop={4}>
                                    <Icon
                                        name="close"
                                        size={14}
                                        color={Colors.white}
                                    />
                                </Pressable>
                            </View>
                        );
                    }

                    return (
                        <View key={tagKey} style={styles.pillWrapper}>
                            <Pressable
                                style={({pressed}) => [
                                    styles.pill,
                                    {borderLeftColor: categoryColor},
                                    pressed && styles.pillPressed
                                ]}
                                onPress={() => handlePillPress(tagKey)}>
                                <Caption
                                    color="white"
                                    family="medium"
                                    style={styles.pillText}>
                                    {label}
                                </Caption>
                                <Pressable
                                    onPress={() =>
                                        handleRemove(tag.cloId, tag.typeId)
                                    }
                                    hitSlop={6}
                                    style={styles.closeBtn}>
                                    <Icon
                                        name="close"
                                        size={13}
                                        color="rgba(255,255,255,0.7)"
                                    />
                                </Pressable>
                            </Pressable>
                            {qty > 1 && (
                                <View style={styles.qtyBadge}>
                                    <Caption
                                        color="accent"
                                        family="semiBold"
                                        style={styles.qtyBadgeText}>
                                        {qty}
                                    </Caption>
                                </View>
                            )}
                            {(tag.materials?.length > 0 ||
                                tag.brands?.length > 0 ||
                                tag.customTags?.length > 0) && (
                                <View style={styles.extrasDot} />
                            )}
                        </View>
                    );
                })}
                {hasCustomTags &&
                    customTags.map(ct => (
                        <View key={`custom-${ct}`} style={styles.pillWrapper}>
                            <View style={[styles.pill, styles.customPillColor]}>
                                <Icon
                                    name="pricetag-outline"
                                    size={12}
                                    color="rgba(255,255,255,0.8)"
                                />
                                <Caption
                                    color="white"
                                    family="medium"
                                    style={styles.pillText}>
                                    {ct}
                                </Caption>
                                <Pressable
                                    onPress={() =>
                                        onRemoveCustomTag &&
                                        onRemoveCustomTag(ct)
                                    }
                                    hitSlop={6}
                                    style={styles.closeBtn}>
                                    <Icon
                                        name="close"
                                        size={13}
                                        color="rgba(255,255,255,0.7)"
                                    />
                                </Pressable>
                            </View>
                        </View>
                    ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 8
    },
    pillsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    pillWrapper: {
        position: 'relative'
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 100,
        borderLeftWidth: 3,
        paddingLeft: 10,
        paddingRight: 6,
        paddingVertical: 6,
        height: 34,
        gap: 4
    },
    customPillColor: {
        backgroundColor: '#6366f1',
        borderLeftWidth: 0
    },
    pillPressed: {
        backgroundColor: '#229954'
    },
    pillText: {
        fontSize: 13
    },
    closeBtn: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    qtyBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: Colors.accent
    },
    qtyBadgeText: {
        fontSize: 10,
        lineHeight: 13
    },
    pillExpanded: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.accent,
        borderRadius: 100,
        borderLeftWidth: 3,
        paddingLeft: 2,
        paddingRight: 2,
        height: 38,
        gap: 2
    },
    expandedBody: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        gap: 6
    },
    qtyInline: {
        minWidth: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4
    },
    qtyInlineText: {
        fontSize: 12,
        lineHeight: 15
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0,0,0,0.15)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    stepperBtnDisabled: {
        opacity: 0.5
    },
    detailBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 2
    },
    removeBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 2
    },
    extrasDot: {
        position: 'absolute',
        bottom: -3,
        right: -3,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#f59e0b',
        borderWidth: 1.5,
        borderColor: Colors.accent
    }
});

export default React.memo(TagPills);
