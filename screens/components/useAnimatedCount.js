import {useCallback, useEffect, useRef, useState} from 'react';
import {cancelAnimation, Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming} from 'react-native-reanimated';

const defaultFormatter = n => Math.round(n).toLocaleString();

/**
 * Animates a number from its previous value to a new target.
 * Returns a formatted string that updates on each animation frame.
 *
 * @param {number} targetValue - The current number (from Redux)
 * @param {object} [options]
 * @param {number} [options.duration=3000] - Animation duration in ms
 * @param {function} [options.formatter] - Format number → string (must be referentially stable or module-level)
 * @returns {string} Formatted display string
 */
export default function useAnimatedCount(targetValue, {duration = 3000, formatter = defaultFormatter} = {}) {
    const safeTarget = typeof targetValue === 'number' && isFinite(targetValue) ? targetValue : 0;
    const prevRef = useRef(safeTarget);
    const formatterRef = useRef(formatter);
    formatterRef.current = formatter;
    const mountedRef = useRef(true);
    const animatedValue = useSharedValue(safeTarget);
    const [displayValue, setDisplayValue] = useState(() => formatter(safeTarget));

    // Guard against setState on unmounted component
    const updateDisplay = useCallback((val) => {
        if (mountedRef.current) {
            setDisplayValue(formatterRef.current(val));
        }
    }, []);

    useEffect(() => {
        if (prevRef.current === safeTarget) return;
        prevRef.current = safeTarget;
        animatedValue.value = withTiming(safeTarget, {
            duration,
            easing: Easing.out(Easing.cubic)
        });
    }, [safeTarget, duration, animatedValue]);

    // Cancel animation and mark unmounted on cleanup
    useEffect(() => {
        return () => {
            mountedRef.current = false;
            cancelAnimation(animatedValue);
        };
    }, [animatedValue]);

    useAnimatedReaction(
        () => animatedValue.value,
        (val, prev) => {
            if (val !== prev) {
                runOnJS(updateDisplay)(val);
            }
        }
    );

    return displayValue;
}
