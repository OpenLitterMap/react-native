import React, {useCallback, useState} from 'react';
import {
    Pressable,
    StyleSheet,
    View
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {Caption, Colors} from '../../components';
import {getCategoryColor} from './categoryColors';
import {makeTagKey, resolveTagEntry, MAX_QUANTITY} from './tagUtils';

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
    const safeTags = Array.isArray(tags) ? tags : [];
    const hasCustom = Array.isArray(customTags) && customTags.length > 0;

    const handlePillPress = useCallback(key => {
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

    if (safeTags.length === 0 && !hasCustom) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.pillsWrap}>
                {safeTags.map(tag => {
                    const tagKey = makeTagKey(tag.cloId, tag.typeId);
                    const entry = resolveTagEntry(
                        tag.cloId,
                        tag.typeId,
                        entriesByCloId,
                        typeEntriesByKey
                    );
                    const name = entry?.displayName || tag.fallbackDisplayName || `#${tag.cloId}`;
                    const category = entry?.isMultiCategory
                        ? entry.categoryDisplayName
                        : null;
                    const label = category ? `${name} · ${category}` : name;
                    const qty = Math.max(1, Number(tag.quantity) || 1);
                    const isExpanded = expandedKey === tagKey;
                    const categoryColor = getCategoryColor(entry?.categoryKey || tag.fallbackCategoryKey);

                    return (
                        <View key={tagKey} style={styles.pillWrapper}>
                            <Pressable
                                style={({pressed}) => [
                                    styles.pill,
                                    isExpanded && styles.pillExpanded,
                                    {borderLeftColor: categoryColor},
                                    pressed && !isExpanded && styles.pillPressed
                                ]}
                                onPress={() => handlePillPress(tagKey)}>
                                {isExpanded && (
                                    <Pressable
                                        style={styles.inlineBtn}
                                        onPress={() =>
                                            handleDecrement(tag.cloId, tag.typeId, qty)
                                        }
                                        hitSlop={4}>
                                        <Icon
                                            name={qty <= 1 ? 'trash-outline' : 'remove'}
                                            size={16}
                                            color={qty <= 1 ? Colors.error : Colors.white}
                                        />
                                    </Pressable>
                                )}
                                <Caption
                                    color="white"
                                    family="medium"
                                    numberOfLines={1}
                                    style={styles.pillText}>
                                    {label}
                                </Caption>
                                {isExpanded && (
                                    <View style={styles.qtyInline}>
                                        <Caption
                                            color="white"
                                            family="semiBold"
                                            style={styles.qtyInlineText}>
                                            {qty}
                                        </Caption>
                                    </View>
                                )}
                                {isExpanded && (
                                    <Pressable
                                        style={[
                                            styles.inlineBtn,
                                            qty >= MAX_QUANTITY && styles.inlineBtnDisabled
                                        ]}
                                        onPress={() =>
                                            handleIncrement(tag.cloId, tag.typeId, qty)
                                        }
                                        disabled={qty >= MAX_QUANTITY}
                                        hitSlop={4}>
                                        <Icon
                                            name="add"
                                            size={16}
                                            color={qty >= MAX_QUANTITY ? 'rgba(255,255,255,0.3)' : Colors.white}
                                        />
                                    </Pressable>
                                )}
                                {isExpanded && (
                                    <Pressable
                                        style={styles.inlineBtn}
                                        onPress={() => onOpenDetail && onOpenDetail(tag)}
                                        hitSlop={4}>
                                        <Icon
                                            name="ellipsis-horizontal"
                                            size={14}
                                            color={Colors.white}
                                        />
                                    </Pressable>
                                )}
                                {isExpanded && (
                                    <Pressable
                                        style={styles.inlineBtnDanger}
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
                                )}
                            </Pressable>
                            {!isExpanded && qty > 1 && (
                                <View style={styles.qtyBadge}>
                                    <Caption
                                        color="accent"
                                        family="semiBold"
                                        style={styles.qtyBadgeText}>
                                        {qty}
                                    </Caption>
                                </View>
                            )}
                            {!isExpanded && (tag.materials?.length > 0 ||
                                tag.brands?.length > 0 ||
                                tag.customTags?.length > 0) && (
                                <View style={styles.extrasDot} />
                            )}
                        </View>
                    );
                })}
                {hasCustom &&
                    customTags.map((ct, i) => (
                        <View key={`custom-${ct}-${i}`} style={styles.pillWrapper}>
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
        fontSize: 13,
        flexShrink: 1
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
        paddingLeft: 4,
        paddingRight: 4,
        height: 38,
        gap: 3
    },
    inlineBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center'
    },
    inlineBtnDisabled: {
        opacity: 0.4
    },
    inlineBtnDanger: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'rgba(231,76,60,0.7)',
        justifyContent: 'center',
        alignItems: 'center'
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
