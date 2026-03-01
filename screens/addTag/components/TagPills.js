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

if (Platform.OS === 'android') {
    UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const MAX_QUANTITY = 10;

const TagPills = ({
    tags,
    entriesByCloId,
    typeEntriesByKey,
    onRemove,
    onUpdateQuantity
}) => {
    const [expandedKey, setExpandedKey] = useState(null);
    const prevTagCount = useRef(tags?.length || 0);

    const tagCount = tags?.length || 0;
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

    if (!tags || tags.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <View style={styles.pillsWrap}>
                {tags.map(tag => {
                    const tagKey = `${tag.cloId}-${tag.typeId || ''}`;
                    const entry = tag.typeId
                        ? typeEntriesByKey?.[`${tag.cloId}-${tag.typeId}`] ||
                          entriesByCloId[tag.cloId]
                        : entriesByCloId[tag.cloId];
                    const name = entry?.displayName || `#${tag.cloId}`;
                    const category = entry?.isMultiCategory
                        ? entry.categoryDisplayName
                        : null;
                    const label = category ? `${name} · ${category}` : name;
                    const qty = tag.quantity;
                    const isExpanded = expandedKey === tagKey;
                    const categoryColor = getCategoryColor(entry?.categoryKey);

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
                        </View>
                    );
                })}
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
    removeBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 2
    }
});

export default React.memo(TagPills);
