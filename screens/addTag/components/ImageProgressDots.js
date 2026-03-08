import React, {useCallback, useMemo, useRef, useEffect} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import {Caption, Colors} from '../../components';
import {isTagged} from '../../../utils/isTagged';

const DOT_SIZE = 6;
const ACTIVE_DOT_SIZE = 10;
const DOT_GAP = 6;

const ImageProgressDots = ({images, currentIndex, onIndexChange}) => {
    const scrollRef = useRef(null);

    const taggedStatuses = useMemo(() => {
        return images.map(isTagged);
    }, [images]);

    const taggedCount = useMemo(() => {
        return taggedStatuses.filter(Boolean).length;
    }, [taggedStatuses]);

    // Scroll to keep current dot visible
    useEffect(() => {
        if (scrollRef.current && images.length > 15) {
            const dotWidth = ACTIVE_DOT_SIZE + DOT_GAP;
            const offset = Math.max(0, currentIndex * dotWidth - 60);
            scrollRef.current.scrollTo({x: offset, animated: true});
        }
    }, [currentIndex, images.length]);

    const handleDotPress = useCallback(
        index => {
            onIndexChange(index);
        },
        [onIndexChange]
    );

    if (images.length <= 1) {
        return null;
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dotsRow}>
                {images.map((_, index) => {
                    const isCurrent = index === currentIndex;
                    const tagged = taggedStatuses[index];

                    return (
                        <Pressable
                            key={index}
                            onPress={() => handleDotPress(index)}
                            hitSlop={4}
                            style={[
                                styles.dot,
                                isCurrent && styles.dotActive,
                                tagged && styles.dotTagged,
                                isCurrent && tagged && styles.dotActiveTagged
                            ]}
                        />
                    );
                })}
            </ScrollView>
            <Caption color="muted" family="medium" style={styles.progressText}>
                {taggedCount}/{images.length} tagged
            </Caption>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: 4
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: DOT_GAP,
        paddingHorizontal: 8
    },
    dot: {
        width: DOT_SIZE,
        height: DOT_SIZE,
        borderRadius: DOT_SIZE / 2,
        backgroundColor: 'rgba(255,255,255,0.3)'
    },
    dotActive: {
        width: ACTIVE_DOT_SIZE,
        height: ACTIVE_DOT_SIZE,
        borderRadius: ACTIVE_DOT_SIZE / 2,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)'
    },
    dotTagged: {
        backgroundColor: Colors.accent
    },
    dotActiveTagged: {
        backgroundColor: Colors.accent,
        borderColor: Colors.white
    },
    progressText: {
        fontSize: 10
    }
});

export default React.memo(ImageProgressDots);
