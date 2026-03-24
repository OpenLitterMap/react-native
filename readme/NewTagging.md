# NewTagging — Tagging Feature Redesign

> **Status: IMPLEMENTED (2026-03-17).** This document is the original design spec that guided the Phase 0 tagging refactor. The implementation is complete. For the current architecture, see `Architecture.md`. This document is retained as design rationale and historical context.

## Problem Statement (at time of design)

The `AddTagScreen` was a single 900-line component doing six jobs: image carousel, pinch/zoom gestures, keyboard/input ownership, overlay visibility, tag state editing, and server queue management. Under React Native 0.84 + Fabric (New Architecture), this produced:

- **Gesture conflicts**: RNGH's native gesture recognizers bypass `pointerEvents="box-none"`, so every overlay tap also fires the ImageViewer's single-tap gesture
- **Keyboard failures**: TextInput nested inside animated overlay trees loses focus unpredictably
- **Hidden controls**: Focus mode, keyboard state, browser visibility, and detail sheet all compete via independent booleans that can contradict each other
- **Fabric crashes**: `RCTComponentViewRegistry: Attempt to recycle a mounted view` when `key={safeIndex}` forces aggressive mount/unmount cycles during swipe transitions

These are architectural problems. Incremental patches (timestamp guards, ref hacks, stale-closure fixes) cannot resolve them.

## Design Decisions Already Made

- **No focus mode**: Overlays are always visible. Single-tap-to-hide is removed entirely, eliminating the core gesture conflict.
- **No `key={index}` remounting**: Editor subtrees stay mounted and update via props/effects.
- **Keep existing utilities**: `makeTagKey`, `parseTagKey`, `resolveTagEntry`, `buildTagsPayload`, `classifyError`, `getTagsFromBackend`, `isTagged`, `isGeotagged` are all correct and reusable.
- **Keep 3-slot image viewer concept**: The sliding-window viewer with prev/center/next slots works well for smooth swiping.
- **Keep Redux for queue and persistence**: Redux Toolkit + redux-persist for `imagesArray`, `editingPhotos`, `swiperIndex`. Not for micro-edits.

## Target Stack

From `package.json`:

| Dependency | Version | Relevance |
|---|---|---|
| `react-native` | 0.84.1 | Fabric/New Architecture enabled |
| `react` | ^19.2.3 | Concurrent features, automatic batching |
| `react-native-gesture-handler` | ^2.30.0 | Gesture composition API (`Gesture.Race`, `.simultaneousWithExternalGesture`) |
| `react-native-reanimated` | ^4.3.0-rc.0 | Shared values, `useAnimatedStyle`, `runOnJS` |
| `react-native-actions-sheet` | ^10.1.2 | **Available for bottom sheets** — browser and detail editors |
| `react-native-safe-area-context` | ^5.4.0 | Insets for top/bottom chrome |
| `@shopify/flash-list` | ^2.0.0 | Performant lists for search results |
| `@reduxjs/toolkit` | ^2.2.6 | State management for queue/persistence |

Key insight: **`react-native-actions-sheet` is already a dependency** but unused in tagging. It provides proper bottom sheet presentation that lives outside the main view tree — no mount/unmount churn, no gesture conflicts, native keyboard avoidance.

## Architecture: Four Layers

### Layer A: Queue (`useTaggingQueue`)

**File**: `screens/addTag/hooks/useTaggingQueue.js`

Owns which photo is active, prefetching, trimming, save/delete/advance.

```js
const {
    photos,           // full array (gallery or editing queue)
    activePhoto,      // current photo object
    activeIndex,      // clamped index
    isEditMode,       // server photos vs gallery photos
    goNext,           // advance index (clamps)
    goPrev,           // go back (clamps)
    saveCurrent,      // POST tags to server (edit mode)
    deleteCurrent,    // DELETE photo from server (edit mode)
    advanceOrClose,   // advance queue or goBack if last photo
} = useTaggingQueue(navigation);
```

**Critical rule**: Queue mutation (trim, remove, prefetch) happens only AFTER the active photo has settled — never during swipe animation. This prevents Fabric view recycling crashes.

Reads from Redux: `state.photos.imagesArray`, `state.photos.editingPhotos`, `state.photos.swiperIndex`, `state.serverPhotos.untaggedCount`.

Dispatches to Redux: `changeSwiperIndex`, `trimEditingPhotos`, `removeEditingPhoto`, `clearEditingPhoto`, `fetchAndLoadUntagged`.

### Layer B: Viewer (`TagPhotoViewer`)

**File**: `screens/addTag/components/TagPhotoViewer.js`

Pure image viewer. Knows nothing about tags, keyboard, browser, or server.

```jsx
<TagPhotoViewer
    photos={photos}
    activeIndex={activeIndex}
    onRequestIndexChange={goToIndex}
/>
```

**Gestures** (RNGH v2 composition):
- Double-tap: toggle zoom to 2x
- Pinch: zoom in/out
- Pan (zoomed): move within zoomed image
- Pan (scale=1): horizontal swipe to change image

**No single-tap gesture**. No `onToggleFocus`. No focus mode.

Refactored from current `ImageViewer.js`:
- Remove `singleTapGesture` entirely
- Remove `onToggleFocus` / `onZoomChange` props
- Remove `notifyToggleFocus` / `notifyZoomReset` callbacks
- Keep 3-slot sliding window, pinch, pan, double-tap, strip animation
- `commitIndexChange` calls `onRequestIndexChange` directly — no shared value reads on JS thread

### Layer C: Draft (`useTagDraft`)

**File**: `screens/addTag/hooks/useTagDraft.js`

Local editable state for the active photo's tags. **Not Redux** — `useReducer` or plain `useState`.

```js
const {
    currentTags,       // [{cloId, typeId, quantity, materials, brands, customTags, picked_up}]
    currentCustomTags, // ['string', ...]
    addTag,            // (cloId, typeId) => void
    removeTag,         // (cloId, typeId) => void
    updateQuantity,    // (cloId, typeId, qty) => void
    toggleMaterial,    // (cloId, typeId, materialId) => void
    addBrand,          // (cloId, typeId, brandId) => void
    removeBrand,       // (cloId, typeId, brandId) => void
    addCustomTag,      // (cloId, typeId, text) => void  (per-tag custom)
    removeCustomTag,   // (cloId, typeId, text) => void
    addImageCustomTag, // (text) => void  (image-level custom)
    removeImageCustomTag, // (text) => void
    setPickedUp,       // (cloId, typeId, value) => void
    buildPayload,      // () => tagsArray for API
    isDirty,           // has unsaved changes
    resetDraft,        // re-initialize from photo
} = useTagDraft(activePhoto, defaultPickedUp);
```

**Lifecycle**:
- Initialized from `activePhoto.tags` and `activePhoto.customTags` when `activePhoto.id` changes
- All edits are local — no Redux dispatches per tap
- On save: `buildPayload()` produces the API-ready array, then queue layer dispatches to server
- On gallery mode "Done": draft is committed back to Redux via a single `updatePhotoTags(imageIndex, draft)` action

**Why local state**: Eliminates rerender noise across the entire Redux subscriber tree on every tag tap. Image viewer, queue, and suggestions don't re-render when user increments a quantity.

### Layer D: UI Shell (`AddTagScreen` + components)

**File**: `screens/addTag/AddTagScreen.js` (orchestrator only, ~150 lines)

```
AddTagScreen
 ├── useTaggingQueue()
 ├── useTagDraft(activePhoto)
 ├── useTaggingMode()
 │
 ├── TaggingLayout (flex column, no absolute positioning)
 │    ├── TagTopBar
 │    │    ├── Back button
 │    │    ├── Progress indicator (dots or "3/12")
 │    │    ├── Delete button (edit mode)
 │    │    └── XP badge
 │    │
 │    ├── TagPhotoViewer (flex: 1, takes remaining space)
 │    │
 │    ├── TagSuggestionsRow (horizontal scroll, always mounted)
 │    │
 │    ├── TagPillsRow (flex-wrap pills, always mounted)
 │    │
 │    └── TagComposerBar (KeyboardAvoidingView wraps this)
 │         ├── Browse button
 │         ├── Search TextInput (always mounted)
 │         ├── Search results dropdown
 │         └── Save/Next button
 │
 ├── TagBrowserSheet (react-native-actions-sheet)
 └── TagDetailSheet (react-native-actions-sheet)
```

## Interaction Mode State Machine

Replace the current boolean soup with a single finite mode:

```js
// useTaggingMode.js
type TaggingMode = 'viewing' | 'typing' | 'browsing' | 'editingDetail' | 'saving';
```

All visibility is derived:

| Mode | Keyboard | Browser Sheet | Detail Sheet | Gestures | Input |
|---|---|---|---|---|---|
| `viewing` | closed | closed | closed | enabled | blurred |
| `typing` | open | closed | closed | disabled | focused |
| `browsing` | closed | open | closed | disabled | blurred |
| `editingDetail` | closed | closed | open | disabled | blurred |
| `saving` | closed | closed | closed | disabled | disabled |

**Transitions**:
- `viewing` → tap search input → `typing`
- `typing` → select tag or dismiss keyboard → `viewing`
- `viewing` → tap browse button → `browsing`
- `browsing` → close sheet → `viewing`
- `viewing` → tap tag pill detail → `editingDetail`
- `editingDetail` → close sheet → `viewing`
- any → save pressed → `saving`
- `saving` → complete → `viewing` (or advance to next photo)

Impossible states are eliminated. No focus mode boolean. No keyboard tracking listener. No `pendingCustomTag`. No `showBrowser` boolean.

## Layout: Flex Column, Not Absolute Overlay

Current layout uses absolute positioning with `pointerEvents="box-none"`:

```
[ImageViewer - absolute fill]
[Overlay - absolute fill, box-none]
  [Top gradient]
  [Arrow buttons]
  [Bottom gradient]
    [TagPills]
    [TagSuggestions]
    [TagSearchBar]
    [CategoryBrowser]
    [Bottom controls]
```

New layout uses a simple flex column:

```
[View - flex: 1, column]
  [TagTopBar - fixed height]
  [TagPhotoViewer - flex: 1]
  [TagSuggestionsRow - fixed height, conditional]
  [TagPillsRow - wrapping, conditional]
  [TagComposerBar - fixed height]
```

**Why**: No gesture conflicts. The viewer only receives gestures in its own bounds. The controls below it are regular React Native views that work normally — TextInput focuses, Pressable fires, keyboard avoids.

The image gets less vertical space than the current full-screen overlay approach, but the controls actually work.

## Bottom Sheets for Browser and Detail

Move `CategoryBrowser` and `TagDetailSheet` into `react-native-actions-sheet` bottom sheets:

```jsx
import ActionSheet from 'react-native-actions-sheet';

// In AddTagScreen
<ActionSheet
    id="tag-browser"
    gestureEnabled
    closable
    onClose={() => setMode('viewing')}>
    <CategoryBrowser ... />
</ActionSheet>

<ActionSheet
    id="tag-detail"
    gestureEnabled
    closable
    onClose={() => setMode('viewing')}>
    <TagDetailEditor ... />
</ActionSheet>
```

**Why**:
- Bottom sheets live outside the main view tree — no mount/unmount impact on Fabric
- Built-in gesture handling (drag to close) that doesn't conflict with the image viewer
- Native keyboard avoidance
- `react-native-actions-sheet` ^10.1.2 is already in `package.json`

## Suggestions: Pure Derivation

```js
const suggestions = useMemo(() => {
    return selectSuggestedTags(photos, activeIndex, draft.currentTags);
}, [photos, activeIndex, draft.currentTags]);
```

Where `selectSuggestedTags` is a pure function (extracted from current `TagSuggestions` useMemo):
- Iterates other photos' tags
- Filters out tags already in draft
- Sorts by frequency
- Returns top 10

The `TagSuggestionsRow` component:
- Always mounted
- Receives stable array
- Calls `draft.addTag(cloId, typeId)` on press
- No gesture handler — uses React Native `Pressable` (not RNGH)

## What Gets Deleted

| Current File/Code | Reason |
|---|---|
| `focusMode` state + `overlayOpacity` animation | No focus mode |
| `handleToggleFocus`, `handleZoomChange` | No focus mode |
| `lastOverlayTapTime` guard | No gesture conflict to guard against |
| `keyboardVisible` state + listeners | Mode machine handles this |
| `showBrowser` state | Mode machine |
| `pendingCustomTag` state | Composer bar owns this internally |
| `key={safeIndex}` on any component | No forced remounts |
| Absolute overlay with `pointerEvents="box-none"` | Flex column layout |
| `LinearGradient` overlays | Not needed without overlay-on-image model |
| Arrow navigation buttons | Swipe is sufficient; or keep as simple row below image |
| Per-tap Redux dispatches for tag edits | Local draft model |

## What Gets Kept

| Current Code | Destination |
|---|---|
| `makeTagKey`, `parseTagKey`, `resolveTagEntry` | `screens/addTag/components/tagUtils.js` (unchanged) |
| `buildTagsPayload` | `utils/buildTagsPayload.js` (unchanged) |
| `categoryColors`, `getCategoryColor` | `screens/addTag/components/categoryColors.js` (unchanged) |
| 3-slot image viewer (Slide, SlideImage, zoom, pan, swipe) | `TagPhotoViewer.js` (cleaned up) |
| `TagPills` component | `TagPillsRow.js` (remove `key` prop, always mounted) |
| `TagSearchBar` component | Integrated into `TagComposerBar.js` |
| `CategoryBrowser` component | Wrapped in ActionSheet |
| `TagDetailSheet` component | Wrapped in ActionSheet |
| `addTagV5` / `removeTagV5` reducer logic | Replicated in `useTagDraft` as local state |
| `fetchAndLoadUntagged`, `editTagsOnPhoto` thunks | Used by `useTaggingQueue` |
| `photos_reducer` queue actions | Used by `useTaggingQueue` |

## File Structure

```
screens/addTag/
├── AddTagScreen.js              # Orchestrator (~150 lines)
├── hooks/
│   ├── useTaggingQueue.js       # Queue management
│   ├── useTagDraft.js           # Local tag editing state
│   └── useTaggingMode.js        # Finite UI mode machine
├── components/
│   ├── TagPhotoViewer.js        # Image viewer (gestures only)
│   ├── TagTopBar.js             # Back, progress, XP, delete
│   ├── TagSuggestionsRow.js     # Horizontal suggestion chips
│   ├── TagPillsRow.js           # Current tags display
│   ├── TagComposerBar.js        # Search input + browse + save
│   ├── TagBrowserSheet.js       # ActionSheet wrapper for CategoryBrowser
│   ├── TagDetailSheet.js        # ActionSheet wrapper for tag detail editor
│   ├── CategoryBrowser.js       # (existing, reused)
│   ├── ImageProgressDots.js     # (existing, reused)
│   ├── tagUtils.js              # (existing, unchanged)
│   └── categoryColors.js        # (existing, unchanged)
└── index.js                     # Barrel export
```

## Migration Plan

### Phase 1: Stabilize (unblock current crashes)

**ImageViewer.js:**
- Remove `singleTapGesture` from composed gesture
- Remove `onToggleFocus` prop, `notifyToggleFocus` callback
- Remove `onZoomChange` prop, `notifyZoomReset` callback
- Composed gesture becomes: `Gesture.Race(doubleTapGesture, Simultaneous(pinch, pan))`

**AddTagScreen.js:**
- Remove all focus mode code: `focusMode` state, `overlayOpacity` shared value, `overlayAnimatedStyle`, `handleToggleFocus`, `handleZoomChange`, `lastOverlayTapTime` ref and all timestamp guards
- Remove `onToggleFocus` and `onZoomChange` props from `<ImageViewer>`
- Overlay `Animated.View` → plain `View` with `pointerEvents="box-none"` (always visible)
- Remove `key={safeIndex}` from TagPills → eliminates Fabric crash
- Strip `handleIndexChange` to index-update only (no `trimEditingPhotos`, no `fetchAndLoadUntagged`)
- Move prefetch/trim into a `useEffect` on `safeIndex` that runs after settle
- Keep Redux dispatches for tag edits (refactor to local draft in Phase 2)

**Design principle** (from ChatGPT): This screen is a **tag editor first** and a **photo viewer second**. The interaction model optimizes for tapping chips, opening keyboard, editing tags, and saving — not immersive image viewing.

**Goal**: App works. Tags render. Keyboard opens. No crashes.

### Phase 2: Extract hooks

- Build `useTaggingQueue` — extract queue logic from AddTagScreen
- Build `useTaggingMode` — replace boolean soup with finite state machine
- Build `useTagDraft` — local editing state, stop per-tap Redux dispatches
- AddTagScreen becomes a thin orchestrator

**Goal**: Clean separation of concerns. ~150 line orchestrator.

### Phase 3: Bottom sheets

- Move CategoryBrowser into `TagBrowserSheet` (ActionSheet)
- Move TagDetailSheet into ActionSheet wrapper
- Remove inline expanding sections

**Goal**: No mount/unmount churn in main tree for secondary editors.

### Phase 4: Polish

- Refine TagComposerBar (search + browse button + save)
- XP estimate derived from draft
- Suggestion computation as pure selector
- Arrow navigation (if desired) as simple row
- Animation polish (pill add/remove transitions)

**Goal**: Production-ready tagging UX.
