# Animated Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stat numbers on HomeScreen count up/down smoothly when values change after pull-to-refresh.

**Architecture:** A single `useAnimatedCount` hook uses Reanimated's `withTiming` on the UI thread, bridges values back to JS via `useAnimatedReaction` + `runOnJS(setState)`. Returns a formatted string that drops into existing `Title` components unchanged. No new UI components.

**Tech Stack:** react-native-reanimated (already installed), useSharedValue, withTiming, useAnimatedReaction, runOnJS

---

### Task 1: Create `useAnimatedCount` hook

**Files:**
- Create: `screens/components/useAnimatedCount.js`

- [ ] **Step 1: Create the hook file**

```js
import {useEffect, useRef, useState} from 'react';
import {Easing, runOnJS, useAnimatedReaction, useSharedValue, withTiming} from 'react-native-reanimated';

const defaultFormatter = n => Math.round(n).toLocaleString();

/**
 * Animates a number from its previous value to a new target.
 * Returns a formatted string that updates on each animation frame.
 *
 * @param {number} targetValue - The current number (from Redux)
 * @param {object} [options]
 * @param {number} [options.duration=800] - Animation duration in ms
 * @param {function} [options.formatter] - Format number → string (default: toLocaleString)
 * @returns {string} Formatted display string
 */
export default function useAnimatedCount(targetValue, {duration = 800, formatter = defaultFormatter} = {}) {
    const safeTarget = typeof targetValue === 'number' && isFinite(targetValue) ? targetValue : 0;
    const prevRef = useRef(safeTarget);
    const animatedValue = useSharedValue(safeTarget);
    const [displayValue, setDisplayValue] = useState(() => formatter(safeTarget));

    useEffect(() => {
        if (prevRef.current === safeTarget) return;
        prevRef.current = safeTarget;
        animatedValue.value = withTiming(safeTarget, {
            duration,
            easing: Easing.out(Easing.cubic)
        });
    }, [safeTarget, duration, animatedValue]);

    useAnimatedReaction(
        () => animatedValue.value,
        (val) => {
            runOnJS(setDisplayValue)(formatter(val));
        }
    );

    return displayValue;
}
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx react-native start --reset-cache` (if Metro is not running), then check the bundler output for errors in the new file.

- [ ] **Step 3: Commit**

```bash
git add screens/components/useAnimatedCount.js
git commit -m "feat: add useAnimatedCount hook for animated stat numbers"
```

---

### Task 2: Integrate into CommunityStats

**Files:**
- Modify: `screens/components/CommunityStats.js`

The `StatCell` component currently renders `value.toLocaleString()` or `formatCount(value)` directly. Since hooks can't be called inside a non-component function passed as JSX, we need to convert `StatCell` from an inline arrow to a proper component that can call the hook.

- [ ] **Step 1: Import the hook and convert StatCell**

Replace the entire `StatCell` component (lines 14-21) and add the import:

```js
// Add to imports at top:
import useAnimatedCount from './useAnimatedCount';
```

Replace `StatCell`:

```js
const StatCell = ({value, label, color, exact, active, onPress}) => {
    const formatter = exact
        ? n => Math.round(n).toLocaleString()
        : formatCount;
    const display = useAnimatedCount(value, {formatter});

    return (
        <Pressable style={[styles.stat, active && styles.statActive]} onPress={onPress}>
            <Title style={[styles.statValue, {color}]}>
                {display}
            </Title>
            <Caption style={[styles.statLabel, active && {color}]}>{label}</Caption>
        </Pressable>
    );
};
```

Note: `formatCount` already rounds internally (`Math.floor` for k+, `.toFixed(1)` for M+), but receives a float during animation. Update `formatCount` to handle non-integer input:

```js
const formatCount = (n) => {
    const rounded = Math.round(n);
    if (rounded >= 1000000) return `${(rounded / 1000000).toFixed(1)}M+`;
    if (rounded >= 1000) return `${Math.floor(rounded / 1000).toLocaleString()}k+`;
    return rounded.toLocaleString();
};
```

- [ ] **Step 2: Test pull-to-refresh on HomeScreen**

Pull down on HomeScreen. The three Global Impact numbers (Tags, Photos, People) should animate smoothly when values change. On first mount, numbers should appear instantly without animation.

- [ ] **Step 3: Commit**

```bash
git add screens/components/CommunityStats.js
git commit -m "feat: animate Global Impact stat numbers on refresh"
```

---

### Task 3: Integrate into YourImpactSection

**Files:**
- Modify: `screens/home/homeComponents/YourImpactSection.js`

- [ ] **Step 1: Import the hook and replace static values**

Add import:

```js
import useAnimatedCount from '../../components/useAnimatedCount';
```

Inside `YourImpactSection`, after the destructuring of `user` (after line 29), add:

```js
    const animatedTags = useAnimatedCount(totalTags);
    const animatedPhotos = useAnimatedCount(totalImages);
    const animatedXp = useAnimatedCount(xp);
```

Replace the three `Title` elements in the stats row (lines 41, 45, 49):

Line 41: `{totalTags.toLocaleString()}` → `{animatedTags}`

Line 45: `{totalImages.toLocaleString()}` → `{animatedPhotos}`

Line 49: `{xp.toLocaleString()}` → `{animatedXp}`

- [ ] **Step 2: Test pull-to-refresh**

Pull down on HomeScreen. Your Impact stats (Tags, Photos, XP) should animate smoothly. First mount shows values instantly.

- [ ] **Step 3: Commit**

```bash
git add screens/home/homeComponents/YourImpactSection.js
git commit -m "feat: animate Your Impact stat numbers on refresh"
```
