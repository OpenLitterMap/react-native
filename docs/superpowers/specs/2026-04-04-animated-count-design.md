# Animated Count on HomeScreen

## Context

HomeScreen shows static stat numbers (Global Impact: total tags/photos/people; Your Impact: tags/photos/XP). When the user pulls to refresh and new data arrives, the numbers should count up from the old value to the new value over ~800ms.

## Design

### Hook: `useAnimatedCount(targetValue, duration?)`

A reusable hook that animates from the previous value to the new target using Reanimated's `withTiming` on the UI thread, then bridges the intermediate values back to JS via `useAnimatedReaction` + `runOnJS` to update a React state string.

**Signature:**
```js
function useAnimatedCount(targetValue: number, duration?: number): string
```

- `targetValue` — the current number to display (from Redux)
- `duration` — animation duration in ms (default 800)
- Returns a formatted string (`toLocaleString()`) that updates ~48 times over the animation

**Internal mechanics:**
1. Initialise `prevRef` and `useSharedValue` to `targetValue` on first render — no animation on mount
2. Initialise `useState(formatter(targetValue))` so the first render shows the correct formatted value immediately
3. On subsequent target changes (prevRef.current !== targetValue): `animatedValue.value = withTiming(newTarget, {duration, easing: Easing.out(Easing.cubic)})`, update prevRef
4. `useAnimatedReaction` watches `animatedValue`, calls `runOnJS(updateDisplay)(Math.round(val))` on each frame
5. `updateDisplay` formats and calls `setDisplayValue` — throttled to skip every other frame if needed (see performance note)
6. Returns `displayValue` (a regular React state string)

**Performance note:** 6+ stats animate simultaneously after pull-to-refresh. At 48 frames × 6 stats = ~288 re-renders in 800ms. Each component is tiny (just a Title), so this is likely fine. If frame drops occur, throttle the `runOnJS` callback to every 2nd or 3rd frame (~20-30 updates over 800ms still looks smooth).

**No new components.** The hook returns a plain string. Callers pass it to the existing `Title` component. Title doesn't need to know about animation.

### Integration points

**CommunityStats.js** — `StatCell` component renders stat values. Replace `value.toLocaleString()` / `formatCount(value)` with `useAnimatedCount(value)`. The `formatCount` abbreviation (k+/M+) should be applied to the rounded value inside the hook's JS callback when a `formatter` function is provided.

**YourImpactSection.js** — Same pattern for `totalTags`, `totalImages`, `xp`.

### Hook signature refinement

For CommunityStats, values use `formatCount()` (abbreviates to "8k+", "2.5M+"). For YourImpactSection, values use `toLocaleString()`. To support both without duplicating the hook:

```js
function useAnimatedCount(targetValue, { duration = 800, formatter = defaultFormatter } = {}): string
```

Where `defaultFormatter = (n) => Math.round(n).toLocaleString()`.

### Trigger

Pull-to-refresh dispatches `getStats()` and `fetchUser()`. When Redux updates `state.stats.totalTags` etc., the new value flows as a prop to the stat component, which passes it to `useAnimatedCount`. The ref detects the change and kicks off the animation. No extra wiring.

### Edge cases

- **First render:** Initialise ref AND shared value to `targetValue`. `useState` gets `formatter(targetValue)`. No animation — avoids unwanted 0→9000 count-up on mount.
- **Value unchanged after refresh:** ref === target, skip (no withTiming call)
- **Value decreases:** animate down (same withTiming, just a lower target)
- **Value is 0 or null:** display "0", no animation

### File

`screens/components/useAnimatedCount.js`
