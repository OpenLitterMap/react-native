import React, {useCallback, useMemo, useRef, useEffect} from 'react';
import {ScrollView, StyleSheet, useWindowDimensions, View} from 'react-native';
import {Pressable} from 'react-native';
import {Caption, Colors} from '../../components';
import {isTagged} from '../../../utils/isTagged';

const DOT_SIZE = 6;
const ACTIVE_DOT_SIZE = 10;
const DOT_GAP = 6;
const BAR_THRESHOLD = 30;

/**
 * Compact progress bar for large image sets (30+).
 * Shows a tappable track with position indicator and count text.
 */
const ProgressBar = React.memo(({currentIndex, total, taggedCount, onIndexChange}) => {
    const {width: screenWidth} = useWindowDimensions();
    const trackWidth = screenWidth - 48; // 24px padding each side

    const handlePress = useCallback(
        e => {
            const tapX = e.nativeEvent.locationX;
            const ratio = Math.max(0, Math.min(1, tapX / trackWidth));
            const newIndex = Math.round(ratio * (total - 1));
            onIndexChange(newIndex);
        },
        [trackWidth, total, onIndexChange]
    );

    const fillRatio = total > 1 ? currentIndex / (total - 1) : 0;

    return (
        <View style={styles.container}>
            <Pressable onPress={handlePress} style={styles.barWrapper}>
                <View style={[styles.track, {width: trackWidth}]}>
                    <View
                        style={[
                            styles.trackFill,
                            {width: fillRatio * trackWidth}
                        ]}
                    />
                    <View
                        style={[
                            styles.thumb,
                            {left: Math.max(0, fillRatio * trackWidth - 5)}
                        ]}
                    />
                </View>
            </Pressable>
            <Caption color="muted" family="medium" style={styles.progressText}>
                {currentIndex + 1} / {total}  ·  {taggedCount} tagged
            </Caption>
        </View>
    );
});

const ImageProgressDots = ({images, currentIndex, onIndexChange}) => {
    const scrollRef = useRef(null);

    const taggedStatuses = useMemo(() => {
        return images.map(isTagged);
    }, [images]);

    const taggedCount = useMemo(() => {
        return taggedStatuses.filter(Boolean).length;
    }, [taggedStatuses]);

    if (images.length <= 1) {
        return null;
    }

    // Large sets: show compact progress bar instead of dots
    if (images.length > BAR_THRESHOLD) {
        return (
            <ProgressBar
                currentIndex={currentIndex}
                total={images.length}
                taggedCount={taggedCount}
                onIndexChange={onIndexChange}
            />
        );
    }

    return (
        <DotsView
            images={images}
            currentIndex={currentIndex}
            taggedStatuses={taggedStatuses}
            taggedCount={taggedCount}
            onIndexChange={onIndexChange}
            scrollRef={scrollRef}
        />
    );
};

const DotsView = React.memo(({images, currentIndex, taggedStatuses, taggedCount, onIndexChange, scrollRef}) => {
    // Scroll to keep current dot visible
    useEffect(() => {
        if (scrollRef.current && images.length > 15) {
            const dotWidth = ACTIVE_DOT_SIZE + DOT_GAP;
            const offset = Math.max(0, currentIndex * dotWidth - 60);
            scrollRef.current.scrollTo({x: offset, animated: true});
        }
    }, [currentIndex, images.length, scrollRef]);

    const handleDotPress = useCallback(
        index => {
            onIndexChange(index);
        },
        [onIndexChange]
    );

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
});

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
    },
    barWrapper: {
        paddingVertical: 8,
        paddingHorizontal: 24
    },
    track: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'visible'
    },
    trackFill: {
        height: 4,
        backgroundColor: Colors.accent,
        borderRadius: 2
    },
    thumb: {
        position: 'absolute',
        top: -3,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.white,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.6)'
    }
});

export default React.memo(ImageProgressDots);
