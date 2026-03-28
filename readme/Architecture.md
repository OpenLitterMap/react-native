# Architecture Review & Improvement Plan

**Last updated:** 2026-03-17 (all phases 0–4 complete)

## Current State

**App:** OpenLitterMap React Native v7.0.0
**Stack:** RN 0.84.1 (Fabric/New Architecture), React 19, Redux Toolkit, RNGH 2.30, Reanimated 4.3-rc

### What Works Well

| Area | Strength |
|---|---|
| Route structure | Auth stack vs app tabs. ADD_TAGS/SETTINGS/MY_UPLOADS are standard stack pushes. PERMISSION/UPDATE are fullScreenModal. |
| Auth bootstrap | Single source of truth via redux-persist. MainRoutes validates persisted token on mount. No direct AsyncStorage reads. |
| Reducer purity | All reducers are pure. No side effects in any slice. |
| Tagging | Layout-separated: ImageViewer fills screen, editor panel is absolute-bottom sibling. Draft model (`useTagDraft`) is local source of truth. No gesture conflicts. |
| HomeScreen | Decomposed: `useHomeBootstrap` (boot logic), `UploadModal` (extracted component), `useUploadPhotos` (upload orchestration). 259 lines. |
| Error handling | `ErrorBoundary` wraps NavigationContainer. Centralized `classifyError.js`. Per-endpoint timeouts in `apiClient.js`. |
| Persistence | Only `auth` + `photos.imagesArray` persisted. Tags cached with 7-day TTL. |
| i18n | 8 languages, string-key convention, litter taxonomy split |
| Interceptor | Promise-based 401 guard. No setTimeout hacks. |

### Remaining Issues (genuine, deferred)

#### 1. ~~MaterialTopTabNavigator used as bottom tabs~~ — RESOLVED
Switched to `@react-navigation/bottom-tabs` in v7.3.1. No more swipe gesture conflicts.

#### 2. No memoized selectors
Most screens use raw `useSelector`. Only `selectSelectedCount` is memoized. Low priority unless proven perf bottleneck.

#### 3. Upload modal state in Redux slice
`showUploadModal`/`showThankYouMessages` in `upload_flow_reducer` are UI concerns. Could move to component state. Works fine as-is.

#### 4. Photo-related slice overlap
Five slices touch the photo domain (`gallery`, `photos`, `uploads`, `uploadFlow`, `serverPhotos`). Current split works but boundaries aren't optimally clear. Candidates for future consolidation, not committed.

#### 5. `photos.swiperIndex` and `photos.editingPhotos` in Redux
These are transient tagging state. Candidates for moving into local hook state as the tagging refactor matures. Not urgent — currently functional.

#### 6. Stale `Avenir-Black.ttf` reference in Info.plist
`Info.plist` references a font file that doesn't exist. App uses Poppins. Cosmetic — causes a harmless launch warning.

#### 7. RCTSwiftUI duplicate class warnings
Debug-only warning from RN 0.84 + Xcode 26. `RCTSwiftUIContainerView` compiled into both `React.framework` and `debug.dylib`. Not actionable — expected to be fixed in a future RN patch.

---

## Current Priorities

No blocking issues. The app is stable across all core workflows. Potential next steps ranked by value:

1. **Ship / test on device** — all architecture work is done, runtime QA on real hardware is the highest value next step
2. **BUG-11** — TopTeamsScreen fake 3s loading (known, low priority)
3. **Selector memoization** — only if profiling reveals perf issues
4. **Bottom tab migration** — evaluate `createBottomTabNavigator` if tab swipe conflicts surface

---

## Persistence Architecture

### redux-persist

| Slice | Persisted | Transform |
|---|---|---|
| `auth` | Full (token + user) | None |
| `photos` | `imagesArray` only | Filters out `editing`/`uploaded-without-uri`. Clears `editingPhotos`, `swiperIndex` |
| All others (12 slices) | Not persisted | Start fresh on boot |

### AsyncStorage (manual, outside Redux)

| Key | Written by | Purpose |
|---|---|---|
| `'tags_cache_v5'` | `tags_reducer` | 7-day TTL cache, language-aware |
| `'i18next_lng'` | i18next detector | Language preference |

---

## Completed Phases

### Phase 0: Tagging (DONE)

Full redesign. Gesture boundary via layout separation. Draft model (`useTagDraft`). All Fabric crash patterns eliminated. All RNGH `Pressable` replaced with RN `Pressable`. All conditional mounts converted to always-mounted + opacity. Navigation deferred via `InteractionManager`. Pan gesture `.minDistance(15)`.

### Phase 1: Auth (DONE)

Single persistence source (redux-persist). Removed dual AsyncStorage writes. Pure `logout()` reducer. No direct AsyncStorage reads in MainRoutes.

### Phase 2: Navigation (DONE)

ADD_TAGS, MY_UPLOADS, SETTING changed from `fullScreenModal` to standard stack push. PERMISSION and UPDATE remain as fullScreenModal.

### Phase 3: HomeScreen (DONE)

714 → 259 lines. Extracted `useHomeBootstrap` (boot logic) and `UploadModal` (progress/result UI).

### Phase 4: Resilience (DONE)

`ErrorBoundary` wrapping NavigationContainer. Per-endpoint timeouts (120s uploads, 15s auth, 30s default). Promise-based 401 interceptor guard.

---

## Architecture Reference

### Redux Slice Map

| Category | Slices | Persisted |
|---|---|---|
| Durable domain | `auth`, `photos`, `tags` | `auth` + `photos.imagesArray` |
| Workflow | `uploadFlow`, `gallery`, `serverPhotos` | No |
| Server-driven volatile | `uploads`, `teams`, `stats`, `leaderboards`, `locations`, `settings`, `shared` | No |

### Tagging Screen Layout

```
[Container - flex: 1, black]
  [ImageViewer - flex: 1, fills screen, GestureDetector here only]
  [TopBar - position: absolute, top: 0, zIndex: 10]
  [EditorPanel - position: absolute, bottom: 0, zIndex: 5, semi-transparent]
     ├── TagPills
     ├── TagSuggestions
     ├── TagSearchBar
     ├── CategoryBrowser (when open)
     └── Done/Next button (full width)
  [TagDetailSheet - Modal]
```

All layers are siblings. Editor touches cannot reach ImageViewer's gesture recognizers.

### Tagging File Structure

```
screens/addTag/
├── AddTagScreen.js              # Orchestrator (~430 lines)
├── hooks/
│   ├── useTaggingQueue.js       # Queue: active photo, navigation, save, delete
│   └── useTagDraft.js           # Local draft: useReducer for tag editing
├── components/
│   ├── ImageViewer.js           # Pinch, zoom, swipe only
│   ├── TagPills.js              # Current tags display
│   ├── TagSearchBar.js          # Search input + results
│   ├── TagSuggestions.js        # Suggestion chips from other images
│   ├── CategoryBrowser.js       # Browse-by-category grid
│   ├── TagDetailSheet.js        # Edit materials/brands/custom per tag
│   ├── ImageProgressDots.js     # Navigation dots
│   ├── tagUtils.js              # makeTagKey, parseTagKey, resolveTagEntry
│   └── categoryColors.js        # Category color mapping
```

### Save Flows

| Mode | Trigger | Flow |
|---|---|---|
| Edit mode | Save button | `getDraft()` → `buildTagsPayload({tags, customTags})` → PUT to server → advance |
| Gallery mode | Done/Next | `commitDraft(getDraft)` → Redux `imagesArray[index]` updated → advance |
| Gallery mode | Swipe | `commitDraft(getDraft)` → Redux updated → change index |
| Gallery mode | Back button | No commit (user abandoned editing) |

### Fabric Rules (RN 0.84)

- Never use `{condition && <Component>}` for views that toggle during animations/keyboard/gestures
- Always keep views mounted, control visibility via `opacity` or `display: 'none'`
- Never use RNGH `Pressable` for simple buttons — use RN's built-in `Pressable`
- Never share a `pointerEvents="box-none"` parent between a GestureDetector and interactive controls
- Defer `navigation.goBack()` via `InteractionManager.runAfterInteractions` after Redux dispatches

---

## Historical Findings

<details>
<summary>Click to expand resolved issues from the architecture review</summary>

### Auth bootstrap split (Phase 1)
Auth bootstrapped via 3 systems (redux-persist + AsyncStorage + MainRoutes). Fixed: single source via redux-persist.

### Duplicate user storage (Phase 1)
JWT and user stored in both redux-persist and manual AsyncStorage. Fixed: removed manual writes.

### Reducer side effects (Phase 1)
`logout()` called `AsyncStorage.removeItem()`. Fixed: pure reducer.

### Tagging gesture conflicts (Phase 0)
Full-screen GestureDetector competed with overlay controls. Fixed: layout separation.

### Tagging Fabric crashes (Phase 0C)
6 distinct crash patterns from conditional mount/unmount under Fabric. All fixed.

### Tagging save correctness (Phase 0A)
Save read from stale photo instead of draft. Fixed: all paths use `getDraft()`.

</details>
