# Photo Picker Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove broad Android photo permissions (`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`) — rejected on Play v62 — by replacing the whole-library auto-scan with the system Photo Picker, backed by a persistent to-tag queue.

**Architecture:** The "Your Photos" inbox stops scanning the camera roll (`CameraRoll.getPhotos`) and instead renders not-yet-uploaded local photos from the already-persisted `photos.imagesArray`. Photos enter via the permission-free system Photo Picker (`react-native-image-picker` → `PickVisualMedia`), which already powers "Select More" + onboarding. `imagesArray` stays **geotagged-only** (existing tagger invariant); non-geotagged picks surface in a dismissible per-photo card. The entire `gallery` Redux slice, the `@react-native-camera-roll/camera-roll` dependency, and the gallery-permission screens are deleted.

**Tech Stack:** React Native 0.84, Redux Toolkit + redux-persist, `react-native-image-picker` v8, `@lodev09/react-native-exify`, Jest.

**Spec:** `docs/superpowers/specs/2026-06-08-photo-picker-migration-design.md`

---

## Dependency ordering note

Tasks are ordered so thow cahat deletions happen **after** every consumer is updated — some intermediate states between groups won't compile, so run the build/lint check at the **end of each phase**, not after every task. Phase 0 (GPS device-verify) is the gate: do not start Phase 1 until it passes.

## File structure

| File | Change | Responsibility after change |
|------|--------|------------------------------|
| `android/app/src/main/AndroidManifest.xml` | modify | No flagged media permissions |
| `reducers/photos_reducer.js` | modify | Add `selectInboxPhotos`; sever `gallery_reducer` coupling |
| `reducers/gallery_reducer.js` | **delete** | — |
| `reducers/index.js` | modify | Drop `gallery` from `rootReducer` |
| `store/index.js` | modify | Drop gallery persist; migration v3 strips the key |
| `utils/permissions/cameraRollPermission.js` | **delete** | — |
| `screens/permission/GalleryPermissionScreen.js` + `screens/permission/index.js` | **delete** | — |
| `routes/PermissionStack.tsx` | **delete** | — |
| `routes/MainRoutes.js` | modify | Remove `PERMISSION` route |
| `screens/home/homeComponents/useInbox.js` | rewrite | Inbox state from `imagesArray` |
| `screens/home/homeComponents/InboxSection.js` | modify | "Add Photos" primary; `InboxEmpty` rewrite; `NoGpsPicksCard`; drop `InboxFooter` |
| `screens/home/homeComponents/LimitedAccessBanner.js` | **delete** | — |
| `screens/home/homeComponents/index.js` | modify | Drop `InboxFooter`, `LimitedAccessBanner` exports |
| `screens/home/useHomeBootstrap.js` | modify | No permission/scan logic |
| `screens/home/HomeScreen.js` | modify | Picker→queue; no-GPS card; gallery refs gone |
| `screens/onboarding/OnboardingPermissionScreen.js` | modify | Camera-only (gallery path needs no permission) |
| `screens/onboarding/ChoosePathScreen.js`, `OnboardingCameraScreen.js` | modify | Gallery entry → `ONBOARDING_PHOTO` directly |
| `__tests__/reducers/galleryGeotagged.test.js` | **delete** | — |
| `__tests__/reducers/inboxSelector.test.js` | **create** | Tests `selectInboxPhotos` |
| `__tests__/reducers/photosInbox.test.js` | modify | Drop obsolete camera-roll mock |
| `package.json` | modify | Drop camera-roll dep; version bump (BOOP) |
| `assets/langs/*/` | modify | Add "Add Photos" strings; remove dead gallery-permission strings |
| iOS: `Info.plist`, `package.json` perms, native version configs | modify | Drop PhotoLibrary perm; BOOP |
| `readme/*`, `CLAUDE.md`, memory | modify | Docs |

---

## Phase 0 — GPS device-verify (GATING)

> The Android Photo Picker can redact location EXIF. Everything downstream assumes geotags survive the picker. **Verify on a real device before building anything else.** This phase needs a physical Android device (ideally one Android 13 and one Android 14 device/emulator with a known-geotagged photo in the gallery).

### Task 0.1: Remove flagged permissions from the manifest

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml:12-16`

- [ ] **Step 1: Delete the three flagged permission lines**

Replace:

```xml
    <!-- Gallery Permissions -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
    <uses-permission android:name="android.permission.ACCESS_MEDIA_LOCATION" />
```

with (keep only `ACCESS_MEDIA_LOCATION`, which is not policy-flagged and is needed for EXIF GPS):

```xml
    <!-- Media location (for reading GPS EXIF from picked photos) -->
    <uses-permission android:name="android.permission.ACCESS_MEDIA_LOCATION" />
```

- [ ] **Step 2: Rebuild the Android app**

Run: `npm run android`
Expected: app builds and launches. The "Your Photos" auto-scan will now be empty/error (expected — removed next phase); the picker path is what we test.

### Task 0.2: Verify GPS survives the picker (manual, on-device)

- [ ] **Step 1: Confirm the test photo is geotagged**

On the device, open the same photo in Google Photos → "Details"; confirm it shows a map/location. (Or confirm it imports today on a build that still has the permission.)

- [ ] **Step 2: Temporarily log the GPS read in `handleSelectMore`**

In `screens/home/HomeScreen.js`, inside the `for (const asset of result.assets || [])` loop (around line 258), add a temporary log before the existing `readGpsFromExif` call result is used:

```js
const gps = await readGpsFromExif(asset.uri);
console.log('[GPS TEST] uri=', asset.uri, 'gps=', JSON.stringify(gps)); // TEMP — remove after Phase 0
```

- [ ] **Step 2b: Open the in-app dev console / `adb logcat` and tap "Select More" → pick the known-geotagged photo**

Run: `adb logcat | grep "GPS TEST"`
Expected (PASS): `gps= {"latitude":..,"longitude":..}` — picker preserves location; **GPS survives.**
Possible (FAIL): `gps= null` — picker redacted at the copy boundary.

- [ ] **Step 3: Decision gate**

- **PASS on both Android 13 & 14** → remove the temp log, proceed to Phase 1 unchanged.
- **FAIL** → the picker strips location. Apply the fallback in **Task 0.3** before continuing, then re-run this test.

- [ ] **Step 4: Remove the temporary log** (whether pass or fail).

### Task 0.3: (ONLY IF Task 0.2 FAILED) Selected-Photos fallback

> Skip entirely if GPS survived. This recovers GPS via Android 14 Selected Photos Access — Google permits `READ_MEDIA_VISUAL_USER_SELECTED` **without** the declaration.

- [ ] **Step 1: Add the permission to `android/app/src/main/AndroidManifest.xml`**

```xml
    <uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" />
```

- [ ] **Step 2: Request it before opening the picker.** In `screens/home/HomeScreen.js` `handleSelectMore`, before `launchImageLibrary`, on `Platform.OS === 'android' && Platform.Version >= 34`, request `PERMISSIONS.ANDROID.READ_MEDIA_VISUAL_USER_SELECTED` via `react-native-permissions` (`request`). Then re-run Task 0.2.

- [ ] **Step 3: If GPS still null**, stop and escalate — RNIP's cache copy is redacted even with selected access; the fix is to read GPS from the original `content://` URI (requires a native probe or a picker that returns the original). Report findings to the spec's "Open questions"; do not proceed blindly.

- [ ] **Step 4: Commit Phase 0**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "fix(android): remove broad media permissions; GPS-via-picker verified on-device"
```

---

## Phase 1 — Inbox data source (selector + reducer coupling)

### Task 1.1: Replace `selectCameraPhotos` with `selectInboxPhotos` (TDD)

**Files:**
- Test: `__tests__/reducers/inboxSelector.test.js` (create)
- Modify: `reducers/photos_reducer.js:745-760`

- [ ] **Step 1: Write the failing test**

Create `__tests__/reducers/inboxSelector.test.js`:

```js
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}));
jest.mock('../../utils/config', () => ({IS_PRODUCTION: false, URL: 'http://localhost:8000'}));
jest.mock('../../utils/apiClient', () => ({
    __esModule: true,
    default: {get: jest.fn(), post: jest.fn(), put: jest.fn()}
}));

import {selectInboxPhotos} from '../../reducers/photos_reducer';

const mk = imagesArray => ({photos: {imagesArray}});

describe('selectInboxPhotos (photos_reducer)', () => {
    it('returns local, non-uploaded, geotagged photos newest-first', () => {
        const r = selectInboxPhotos(mk([
            {id: 1, uri: 'a', lat: 1, lon: 2, date: 100, uploaded: false, type: 'gallery'},
            {id: 2, uri: 'b', lat: 3, lon: 4, date: 200, uploaded: false, type: 'image/jpeg'}
        ]));
        expect(r.map(p => p.uri)).toEqual(['b', 'a']);
        expect(r[0]).toMatchObject({hasGps: true, fromCamera: true});
        expect(r[1].fromCamera).toBe(false);
    });

    it('excludes uploaded photos and ones without coordinates', () => {
        const r = selectInboxPhotos(mk([
            {id: 1, uri: 'a', lat: 1, lon: 2, date: 100, uploaded: true, type: 'gallery'},
            {id: 2, uri: 'b', lat: null, lon: null, date: 200, uploaded: false, type: 'gallery'},
            {id: 3, uri: 'c', lat: 5, lon: 6, date: 300, uploaded: false, type: 'gallery'}
        ]));
        expect(r.map(p => p.uri)).toEqual(['c']);
    });
});
```

- [ ] **Step 2: Run it — verify it fails**

Run: `npm test -- inboxSelector`
Expected: FAIL — `selectInboxPhotos` is not exported from `photos_reducer`.

- [ ] **Step 3: Replace the selector**

First confirm `selectCameraPhotos` is only consumed by `useInbox` (which is rewritten in Task 1.3):
Run: `grep -rn "selectCameraPhotos" --include="*.js" --include="*.ts" --include="*.tsx" screens reducers`
Expected: only `reducers/photos_reducer.js` (the definition) and `screens/home/homeComponents/useInbox.js`. If anything else appears, update it to `selectInboxPhotos` too.

In `reducers/photos_reducer.js`, replace the `selectCameraPhotos` selector (lines 745-760) with:

```js
/**
 * Local photos awaiting tagging/upload (camera captures + picker imports),
 * newest-first. imagesArray is geotagged-only — non-geotagged picks never enter
 * it (see HomeScreen handleSelectMore) — so every inbox photo is mappable.
 */
export const selectInboxPhotos = createSelector(
    [selectImagesArray],
    images =>
        images
            .filter(img => img.uri && !img.uploaded && img.lat != null)
            .map(img => ({
                id: img.id,
                uri: img.uri,
                date: img.date,
                lat: img.lat,
                lon: img.lon,
                hasGps: true,
                fromCamera: img.type !== 'gallery'
            }))
            .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
);
```

- [ ] **Step 4: Run it — verify it passes**

Run: `npm test -- inboxSelector`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add reducers/photos_reducer.js __tests__/reducers/inboxSelector.test.js
git commit -m "feat(home): selectInboxPhotos sources the inbox from imagesArray"
```

### Task 1.2: Sever the `photos_reducer` → `gallery_reducer` coupling

**Files:**
- Modify: `reducers/photos_reducer.js:6` (remove import) and `:685-689` (remove extraReducer case)

- [ ] **Step 1: Remove the import**

Delete line 6: `import {dismissPhotos} from './gallery_reducer';`

- [ ] **Step 2: Remove the `dismissPhotos` extraReducer case**

Delete this block (lines ~685-689):

```js
            // Remove dismissed photos from imagesArray too
            .addCase(dismissPhotos, (state, action) => {
                const uris = new Set(action.payload);
                state.imagesArray = state.imagesArray.filter(img => !uris.has(img.uri));
            })
```

(`dismissPhotos` was inbox-dismiss for scanned photos; the new inbox deletes via `deleteImage`.)

- [ ] **Step 3: Update `__tests__/reducers/photosInbox.test.js`**

Remove the now-unnecessary mocks + comment (lines ~12-14):

```js
// Native modules pulled in transitively via gallery_reducer — not needed here.
jest.mock('@react-native-camera-roll/camera-roll', () => ({CameraRoll: {}}));
jest.mock('@lodev09/react-native-exify', () => ({}));
```

- [ ] **Step 4: Run the photos tests**

Run: `npm test -- photosInbox inboxSelector`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add reducers/photos_reducer.js __tests__/reducers/photosInbox.test.js
git commit -m "refactor(photos): drop gallery_reducer dependency"
```

### Task 1.3: Rewrite `useInbox` to source from `imagesArray`

**Files:**
- Rewrite: `screens/home/homeComponents/useInbox.js`

- [ ] **Step 1: Replace the whole file** with:

```js
import {useCallback, useMemo, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {selectInboxPhotos, selectTaggedUris, deleteImage} from '../../../reducers/photos_reducer';

/**
 * Inbox state for the "Your Photos" queue. Photos are local, not-yet-uploaded
 * camera captures + picker imports (all geotagged) read from photos.imagesArray.
 * Lifted out of InboxSection so HomeScreen's virtualized list shares one
 * selection state between the header controls and the grid items.
 */
export default function useInbox(onTapPhoto) {
    const dispatch = useDispatch();

    const recentPhotos = useSelector(selectInboxPhotos);
    const taggedUris = useSelector(selectTaggedUris);

    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedUris, setSelectedUris] = useState(new Set());

    const handlePhotoPress = useCallback((photo) => {
        if (isSelecting) {
            setSelectedUris(prev => {
                const next = new Set(prev);
                if (next.has(photo.uri)) {
                    next.delete(photo.uri);
                } else {
                    next.add(photo.uri);
                }
                return next;
            });
        } else {
            onTapPhoto(photo);
        }
    }, [isSelecting, onTapPhoto]);

    const handleToggleDelete = useCallback(() => {
        setIsSelecting(prev => !prev);
        setSelectedUris(new Set());
    }, []);

    const handleDeleteSelected = useCallback(() => {
        if (selectedUris.size === 0) return;
        for (const photo of recentPhotos) {
            if (selectedUris.has(photo.uri)) {
                dispatch(deleteImage(photo.id));
            }
        }
        setSelectedUris(new Set());
        setIsSelecting(false);
    }, [dispatch, selectedUris, recentPhotos]);

    return {
        visiblePhotos: recentPhotos,
        taggedUris,
        isSelecting,
        selectedUris,
        handlePhotoPress,
        handleToggleDelete,
        handleDeleteSelected
    };
}
```

(Removed: gallery import, `getPhotosFromCameraroll`, `dismissPhotos`, paging/`visibleCount`/`hasMorePages`/`isLoading`/`totalGalleryPhotos`, `selectCameraPhotos` merge, `LOAD_MORE`. The grid now shows the whole queue — FlashList virtualizes it.)

- [ ] **Step 2: Commit** (build verified at end of Phase 2)

```bash
git add screens/home/homeComponents/useInbox.js
git commit -m "refactor(home): useInbox reads the queue from imagesArray"
```

---

## Phase 2 — HomeScreen + InboxSection rework

### Task 2.1: Rewrite `InboxSection.js` (controls, empty state, no-GPS card; drop footer)

**Files:**
- Modify: `screens/home/homeComponents/InboxSection.js`

- [ ] **Step 1: `InboxControls` — rename the action to "Add Photos"**

Change the accent button label (line ~85) from `{t('Select More')}` to `{t('Add Photos')}`, and rename the prop `onSelectMore` → `onAddPhotos` throughout `InboxControls` (signature line ~66 and `onPress`).

- [ ] **Step 2: Replace `InboxEmpty` entirely** — it becomes the primary first-run screen (all old permission/scan branches are dead). Replace the whole `InboxEmpty` component (lines ~102-166) with:

```jsx
/** Inbox empty state — the primary first-run call to action. */
export const InboxEmpty = ({onAddPhotos}) => {
    const {t} = useTranslation();
    return (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
                <Icon name="images-outline" size={48} color={Colors.accent} />
            </View>
            <Body style={styles.emptyTitle}>
                {t('Add your litter photos to start tagging')}
            </Body>
            <Caption color="muted" style={styles.emptyText}>
                {t('Choose litter photos from your gallery — only the photos you pick are uploaded.')}
            </Caption>
            <Pressable onPress={onAddPhotos} style={styles.addPhotosPrimary}>
                <Icon name="add" size={18} color={Colors.white} />
                <Body style={styles.addPhotosPrimaryText}>{t('Add Photos')}</Body>
            </Pressable>
        </View>
    );
};
```

- [ ] **Step 3: Delete `InboxFooter`** (lines ~168-183) entirely (no paging).

- [ ] **Step 4: Add `NoGpsPicksCard`** — append this component (per §3b: dismissible, one row per non-geotagged pick):

```jsx
/** Per-photo notice for picks that had no GPS (can't be mapped). Dismissible. */
export const NoGpsPicksCard = ({picks, onDismiss}) => {
    const {t} = useTranslation();
    if (!picks || picks.length === 0) return null;
    return (
        <View style={styles.noGpsCard}>
            <View style={styles.noGpsHeader}>
                <Icon name="location-outline" size={16} color={Colors.error} />
                <Body style={styles.noGpsTitle}>{t("Couldn't add — no location data")}</Body>
                <Pressable onPress={onDismiss} hitSlop={8} style={styles.noGpsDismiss}>
                    <Icon name="close" size={18} color={Colors.muted} />
                </Pressable>
            </View>
            {picks.map(p => (
                <View key={p.uri} style={styles.noGpsRow}>
                    <Image source={{uri: p.uri}} style={styles.noGpsThumb} />
                    <Caption color="muted" numberOfLines={1} style={styles.noGpsName}>
                        {p.filename || t('Photo')}
                    </Caption>
                    <Caption style={styles.noGpsTag}>{t('No location data')}</Caption>
                </View>
            ))}
        </View>
    );
};
```

- [ ] **Step 5: Add the styles** used above to the `StyleSheet.create` block (`emptyIconCircle`, `emptyTitle`, `addPhotosPrimary`, `addPhotosPrimaryText`, `noGpsCard`, `noGpsHeader`, `noGpsTitle`, `noGpsDismiss`, `noGpsRow`, `noGpsThumb`, `noGpsName`, `noGpsTag`). Keep `emptyContainer`/`emptyText`; remove now-unused `manageAccessButton`/`manageAccessText`/`grantAccessButton`/`grantAccessText`/`emptyHint`/`showOlderButton`/`showOlderText` and the `Linking`/`Platform`/`ActivityIndicator` imports if no longer referenced.

```js
    emptyIconCircle: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(39,174,96,0.08)',
        justifyContent: 'center', alignItems: 'center', marginBottom: 16
    },
    emptyTitle: {
        fontSize: 16, fontWeight: '600', color: Colors.text ?? '#222',
        textAlign: 'center', marginBottom: 6
    },
    addPhotosPrimary: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: Colors.accent, paddingHorizontal: 24, paddingVertical: 12,
        borderRadius: 24, marginTop: 18
    },
    addPhotosPrimaryText: {color: Colors.white, fontSize: 15, fontWeight: '600'},
    noGpsCard: {
        marginHorizontal: 16, marginBottom: 12, padding: 12,
        borderRadius: 12, borderWidth: 1, borderColor: Colors.error,
        backgroundColor: 'rgba(231,76,60,0.06)'
    },
    noGpsHeader: {flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8},
    noGpsTitle: {flex: 1, fontSize: 13, fontWeight: '600', color: Colors.error},
    noGpsDismiss: {padding: 2},
    noGpsRow: {flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4},
    noGpsThumb: {width: 36, height: 36, borderRadius: 6, backgroundColor: Colors.accentLight},
    noGpsName: {flex: 1, fontSize: 12},
    noGpsTag: {fontSize: 11, color: Colors.error, fontWeight: '600'}
```

- [ ] **Step 6: Commit** (build at end of phase)

```bash
git add screens/home/homeComponents/InboxSection.js
git commit -m "feat(home): Add Photos primary CTA, first-run empty state, no-GPS card"
```

### Task 2.2: Delete `LimitedAccessBanner` and fix the barrel

**Files:**
- Delete: `screens/home/homeComponents/LimitedAccessBanner.js`
- Modify: `screens/home/homeComponents/index.js`

- [ ] **Step 1: Delete the file**

Run: `git rm screens/home/homeComponents/LimitedAccessBanner.js`

- [ ] **Step 2: Update the barrel** `screens/home/homeComponents/index.js` — change the InboxSection export line to drop `InboxFooter`, and remove the `LimitedAccessBanner` export line:

```js
export { NUM_COLUMNS, InboxThumbnail, InboxControls, InboxEmpty, NoGpsPicksCard } from './InboxSection';
```
(delete: `export { default as LimitedAccessBanner } from './LimitedAccessBanner';`)

- [ ] **Step 3: Commit**

```bash
git add screens/home/homeComponents/
git commit -m "chore(home): remove obsolete LimitedAccessBanner + InboxFooter"
```

### Task 2.3: Simplify `useHomeBootstrap.js`

> Done **before** the HomeScreen rework (Task 2.4) because the two change together — HomeScreen consumes this hook's new `refreshAll` return. The new hook drops the `cameraRollPermission` / `gallery_reducer` imports; those files still exist (deleted in Phase 3), they're just no longer referenced here.

**Files:**
- Rewrite: `screens/home/useHomeBootstrap.js`

- [ ] **Step 1: Replace the whole file** with the permission/scan-free version:

```js
import {useEffect, useCallback} from 'react';
import {Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import DeviceInfo from 'react-native-device-info';
import {setDeviceModel} from '../../reducers/settings_reducer';
import {checkAppVersion} from '../../reducers/shared_reducer';
import {fetchUntaggedCount} from '../../reducers/server_photos_reducer';
import {fetchAllTags} from '../../reducers/tags_reducer';
import {getStats} from '../../reducers/stats_reducer';

/**
 * Boot logic for HomeScreen — device model, data fetching, version check.
 * (Photos enter via the system picker, so there is no camera-roll permission
 * or scan to manage here.)
 */
export default function useHomeBootstrap(navigation) {
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.token);
    const user = useSelector(state => state.auth.user);
    const appVersion = useSelector(state => state.shared?.appVersion);

    const refreshAll = useCallback(async () => {
        const fetches = [dispatch(getStats())];
        if (!user?.enable_admin_tagging) {
            fetches.push(dispatch(fetchUntaggedCount()));
        }
        await Promise.allSettled(fetches);
    }, [dispatch, user?.enable_admin_tagging]);

    // On mount + auth change: fetch data, check version
    useEffect(() => {
        dispatch(setDeviceModel(DeviceInfo.getModel()));
        if (token) {
            dispatch(getStats());
            if (!user?.enable_admin_tagging) {
                dispatch(fetchUntaggedCount());
            }
        }
        dispatch(fetchAllTags());
        if (!__DEV__ && appVersion === null) {
            dispatch(checkAppVersion());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Navigate to update screen if a newer version is available
    useEffect(() => {
        if (!appVersion) return;
        const currentVersion = DeviceInfo.getVersion();
        const latestVersion = appVersion[Platform.OS]?.version;
        if (latestVersion) {
            const latest = latestVersion.split('.');
            const current = currentVersion.split('.');
            const max = Math.max(latest.length, current.length);
            for (let i = 0; i < max; i++) {
                const l = parseInt(latest[i], 10) || 0;
                const c = parseInt(current[i], 10) || 0;
                if (l > c) { navigation.navigate('UPDATE'); return; }
                if (l < c) return;
            }
        }
    }, [appVersion, navigation]);

    return {refreshAll};
}
```

- [ ] **Step 2: Commit** (build verified at the end of Task 2.4)

```bash
git add screens/home/useHomeBootstrap.js
git commit -m "refactor(home): bootstrap no longer manages photo permission/scan"
```

### Task 2.4: Rework `HomeScreen.js`

**Files:**
- Modify: `screens/home/HomeScreen.js`

- [ ] **Step 1: Fix imports.** Delete `import {selectInboxPhotos} from '../../reducers/gallery_reducer';` (line 26) — HomeScreen no longer needs that selector (`useInbox` provides the photos). Remove `InboxFooter` and `LimitedAccessBanner` from the `./homeComponents` import (lines 39-50); add `NoGpsPicksCard`.

- [ ] **Step 2: Fix `pendingUploadCount`** (lines 97-101) — `state.gallery` no longer exists:

```js
    const pendingUploadCount = useMemo(
        () => images.filter(img => isTagged(img)).length,
        [images]
    );
```
(delete the `dismissedUris` selector line 97 and its use.)

- [ ] **Step 3: Update `useHomeBootstrap` destructure** (line 62) — it returns only `{refreshAll}` after Task 3.1:

```js
    const {refreshAll} = useHomeBootstrap(navigation);
```

- [ ] **Step 4: Update `handleRefresh`** (lines 223-234) — no camera roll:

```js
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await refreshAll();
        setRefreshing(false);
    }, [refreshAll]);
```

- [ ] **Step 5: Add no-GPS card state + rewrite `handleSelectMore`** (lines 236-309). Add near the other `useState` (line ~105): `const [noGpsPicks, setNoGpsPicks] = useState([]);` Then replace `handleSelectMore`:

```js
    /** "Add Photos" — system picker; geotagged picks enter the queue,
        non-geotagged surface in the dismissible no-GPS card (§3b). */
    const handleSelectMore = useCallback(async () => {
        let result;
        try {
            result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 0, // 0 = multi-select (PickMultipleVisualMedia)
                includeExtra: true,
                quality: 1
            });
        } catch {
            Alert.alert(t('Error!'), t('Something went wrong. Please try again.'));
            return;
        }
        if (result.didCancel) return;
        if (result.errorCode) {
            Alert.alert(t('Error!'), result.errorMessage || t('Something went wrong. Please try again.'));
            return;
        }

        const imported = [];
        const skipped = [];
        for (const asset of result.assets || []) {
            // react-native-image-picker doesn't return GPS — read from EXIF
            const gps = await readGpsFromExif(asset.uri);
            if (gps && isValidGpsCoords(gps.latitude, gps.longitude)) {
                imported.push({
                    id: asset.id || `picked_${asset.uri}`,
                    uri: asset.uri,
                    filename: asset.fileName || `picked_${Date.now()}.jpg`,
                    lat: gps.latitude,
                    lon: gps.longitude,
                    date: asset.timestamp
                        ? Math.floor(new Date(asset.timestamp).getTime() / 1000)
                        : Math.floor(Date.now() / 1000),
                    type: 'gallery',
                    platform: 'mobile',
                    customTags: [],
                    uploaded: false
                });
            } else {
                skipped.push({uri: asset.uri, filename: asset.fileName});
            }
        }

        // Non-geotagged → per-photo card (not the queue; queue stays geotagged-only)
        setNoGpsPicks(skipped);

        if (imported.length > 0) {
            dispatch(addImages({images: imported, picked_up: null}));
        }
    }, [dispatch, t]);
```

(Note: picks now stay on the home queue — we no longer `navigate('ADD_TAGS')` on add. The user taps a queue tile to tag.)

- [ ] **Step 6: Simplify `handleTapInboxPhoto`** (lines 192-219) — inbox photos are already in `imagesArray`, so just jump the swiper to it:

```js
    const handleTapInboxPhoto = useCallback((photo) => {
        if (!photo.hasGps) return; // only geotagged photos are mappable
        dispatch(clearEditingPhoto());
        const idx = images.findIndex(img => img.uri === photo.uri);
        dispatch(changeSwiperIndex(idx >= 0 ? idx : 0));
        navigation.navigate('ADD_TAGS');
    }, [dispatch, navigation, images]);
```

(Delete the old `recentPhotos = useSelector(selectInboxPhotos)` line at 192 — `useInbox` already selects them; `handleTapInboxPhoto` only needs `images`.)

- [ ] **Step 7: Update `listHeader`** (lines 330-355) — drop `LimitedAccessBanner`, rename `onSelectMore`→`onAddPhotos`, add the no-GPS card:

```jsx
    const listHeader = useMemo(() => (
        <View style={styles.gridBleed}>
            <CommunityStats />
            <YourImpactSection />
            <UntaggedSection
                onTagPhoto={handleTagUntaggedPhoto}
                onTagAll={handleTagAllUntagged}
            />
            <NoGpsPicksCard picks={noGpsPicks} onDismiss={() => setNoGpsPicks([])} />
            <InboxControls
                count={inbox.visiblePhotos.length}
                isSelecting={inbox.isSelecting}
                selectedCount={inbox.selectedUris.size}
                onToggleDelete={inbox.handleToggleDelete}
                onDeleteSelected={inbox.handleDeleteSelected}
                onAddPhotos={handleSelectMore}
            />
        </View>
    ), [
        handleTagUntaggedPhoto, handleTagAllUntagged, noGpsPicks,
        inbox.visiblePhotos.length, inbox.isSelecting, inbox.selectedUris.size,
        inbox.handleToggleDelete, inbox.handleDeleteSelected, handleSelectMore
    ]);
```

- [ ] **Step 8: Update `listEmpty`** (lines 357-368) — primary CTA only:

```jsx
    const listEmpty = useMemo(() => (
        <View style={styles.gridBleed}>
            <InboxEmpty onAddPhotos={handleSelectMore} />
        </View>
    ), [handleSelectMore]);
```

- [ ] **Step 9: Delete `listFooter`** (lines 370-379) and remove `ListFooterComponent={listFooter}` from the FlashList (line 405).

- [ ] **Step 10: Lint + build**

Run: `npm run lint`
Expected: no errors in `HomeScreen.js`, `InboxSection.js`, `useInbox.js` (e.g. no unused `selectInboxPhotos`/`InboxFooter`).
Run: `npm run android` and `npm run ios` — both build and launch.

- [ ] **Step 11: Commit**

```bash
git add screens/home/HomeScreen.js
git commit -m "feat(home): picker fills the queue; no-GPS card; drop gallery/scan refs"
```

---

## Phase 3 — Delete the gallery slice, permissions, routes; simplify bootstrap

### Task 3.1: Simplify `useHomeBootstrap.js` — DONE IN PHASE 2

> Moved to **Task 2.3** (it changes together with HomeScreen). No action here.

### Task 3.2: Delete the `gallery` slice and unwire it

**Files:**
- Delete: `reducers/gallery_reducer.js`
- Modify: `reducers/index.js`, `store/index.js`

- [ ] **Step 1: Confirm there are no remaining importers**

Run: `grep -rn "gallery_reducer\|from '.*gallery'\|state.gallery\|getPhotosFromCameraroll\|resetGallery\|dismissPhotos" --include="*.js" --include="*.ts" --include="*.tsx" screens reducers store routes utils __tests__`
Expected: only `__tests__/reducers/galleryGeotagged.test.js` (deleted next task) and `store/index.js` (fixed this task).

- [ ] **Step 2: Delete the slice**

Run: `git rm reducers/gallery_reducer.js`

- [ ] **Step 3: Remove from `reducers/index.js`** — delete the `gallery` import and its entry in `combineReducers`/`rootReducer`.

- [ ] **Step 4: Update `store/index.js`** — (a) delete the import on line 6 (`galleryInitialState`); (b) delete the `galleryTransform` block (lines 78-90); (c) in `persistConfig`, remove `'gallery'` from `whitelist` (line 136) and `galleryTransform` from `transforms` (line 137); (d) bump `version: 2` → `version: 3` (line 134); (e) add migration v3:

```js
    // v2: Add quickTags slice (auto-initializes, no-op migration)
    2: (state) => state,
    // v3: Remove the retired gallery slice (photo picker replaced the scan)
    3: (state) => {
        if (state?.gallery !== undefined) {
            const { gallery, ...rest } = state;
            return rest;
        }
        return state;
    }
```

- [ ] **Step 5: Commit** (build at end of phase)

```bash
git add reducers/gallery_reducer.js reducers/index.js store/index.js
git commit -m "refactor(store): delete gallery slice; persist migration v3 strips the key"
```

### Task 3.3: Delete the gallery-permission utility, screen, route, and stale test

**Files:**
- Delete: `utils/permissions/cameraRollPermission.js`, `screens/permission/GalleryPermissionScreen.js`, `screens/permission/index.js`, `routes/PermissionStack.tsx`, `__tests__/reducers/galleryGeotagged.test.js`
- Modify: `routes/MainRoutes.js`, `screens/index` barrel

- [ ] **Step 1: Confirm `cameraRollPermission` has no remaining importers**

Run: `grep -rn "cameraRollPermission\|GalleryPermissionScreen\|GALLERY_PERMISSION\|PermissionStack" --include="*.js" --include="*.ts" --include="*.tsx" screens routes`
Expected: only `OnboardingPermissionScreen.js` (fixed in Task 3.4) and the files being deleted/edited here.

> If `OnboardingPermissionScreen.js` still imports `cameraRollPermission`, do Task 3.4 **before** deleting the utility.

- [ ] **Step 2: Delete the files**

```bash
git rm utils/permissions/cameraRollPermission.js \
       screens/permission/GalleryPermissionScreen.js \
       screens/permission/index.js \
       routes/PermissionStack.tsx \
       __tests__/reducers/galleryGeotagged.test.js
```

- [ ] **Step 3: Remove the `PERMISSION` route** from `routes/MainRoutes.js` — delete the import (line 11) and the `<Stack.Screen name="PERMISSION" .../>` line (line 93).

- [ ] **Step 4: Remove the `permission` re-export** from the `screens/index` barrel (`screens/index.js` or `.ts`) — grep `grep -n "permission" screens/index*` and delete the `GalleryPermissionScreen` export line. Also delete the now-empty `screens/permission/` directory if nothing else lives there.

- [ ] **Step 5: Commit**

```bash
git add -A routes/ screens/ utils/ __tests__/
git commit -m "chore: remove gallery-permission screen, route, util, and stale test"
```

### Task 3.4: Onboarding gallery path needs no permission

**Files:**
- Modify: `screens/onboarding/OnboardingPermissionScreen.js`, `screens/onboarding/ChoosePathScreen.js`, `screens/onboarding/OnboardingCameraScreen.js`

- [ ] **Step 1: Send gallery entry points straight to the picker screen.**
  - `screens/onboarding/ChoosePathScreen.js:58` — change `navigation.navigate('ONBOARDING_PERMISSION', {path: 'gallery'})` → `navigation.navigate('ONBOARDING_PHOTO', {path: 'gallery'})`.
  - `screens/onboarding/OnboardingCameraScreen.js:59` — change `navigation.replace('ONBOARDING_PERMISSION', {path: 'gallery'})` → `navigation.replace('ONBOARDING_PHOTO', {path: 'gallery'})`.

- [ ] **Step 2: Make `OnboardingPermissionScreen` camera-only.** Remove the `cameraRollPermission` import (lines 18-21). The screen now only handles the camera path; delete the gallery branches:
  - In the mount `useEffect` (lines 56-84): delete the entire `else { ... }` block (lines 68-82) so only the `isCamera` branch remains, falling through to `setScreenState('request')`.
  - In `recheckPermission` (lines 98-118): delete the `else { ... }` block (lines 107-117).
  - In `handleRequestPermission` (lines 120-146): delete the `else { ... }` block (lines 135-145).
  - Delete the now-unreachable `gallery_no_gps` (lines 324-359) and `gallery_denied` (lines 288-322) render branches and the `isGalleryUsable` helper (lines 51-52).
  - In `switchPath` (lines 154-157): the camera→gallery fallback should now go to the picker: `navigation.replace('ONBOARDING_PHOTO', {path: 'gallery'})`.
  - Leave the pre-permission/blocked/`location_denied`/`camera_denied` camera screens and the `isCamera ? ... : ...` ternaries intact (the `: gallery` sides are dead but harmless; simplify if trivial).

- [ ] **Step 3: Lint + build the onboarding flow**

Run: `npm run lint`
Expected: no unused-import / undefined errors in the three files.
Run: `npm run android` — walk onboarding: Choose "from photos" → picker opens directly (no permission prompt) → pick a geotagged photo → ONBOARDING_TAG.

- [ ] **Step 4: Commit**

```bash
git add screens/onboarding/
git commit -m "refactor(onboarding): gallery path uses the picker, no permission step"
```

### Task 3.5: Remove the `@react-native-camera-roll/camera-roll` dependency

**Files:**
- Modify: `package.json`, `ios/Podfile.lock`

- [ ] **Step 1: Confirm zero references**

Run: `grep -rn "camera-roll\|CameraRoll" --include="*.js" --include="*.ts" --include="*.tsx" screens reducers store routes utils __tests__`
Expected: no matches.

- [ ] **Step 2: Remove the dependency**

Run: `npm uninstall @react-native-camera-roll/camera-roll`
Then: `cd ios && bundle exec pod install && cd ..`

- [ ] **Step 3: Build both platforms**

Run: `npm run ios` and `npm run android`
Expected: both build and launch; autolinking no longer includes camera-roll.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json ios/Podfile.lock
git commit -m "chore: drop @react-native-camera-roll/camera-roll (scan removed)"
```

---

## Phase 4 — iOS permission cleanup, i18n, docs, version (BOOP)

### Task 4.1: iOS — drop the photo-library permission

**Files:**
- Modify: `ios/openlittermap/Info.plist`, `package.json` (`reactNativePermissionsIOS`)

- [ ] **Step 1: Remove `NSPhotoLibraryUsageDescription`** (key + its `<string>`) from `ios/openlittermap/Info.plist` (around line 59). Keep `NSCameraUsageDescription` and the location keys. (PHPicker, used by RNIP on iOS, needs no usage description.)

- [ ] **Step 2: Remove `"PhotoLibrary"`** from the `reactNativePermissionsIOS` array in `package.json`. Keep `Camera`, `LocationAccuracy`, `LocationWhenInUse`.

- [ ] **Step 3: Reinstall pods + build iOS**

Run: `cd ios && bundle exec pod install && cd .. && npm run ios`
Expected: builds; picking a photo on iOS shows PHPicker with no permission prompt; GPS reads via EXIF.

- [ ] **Step 4: Commit**

```bash
git add ios/openlittermap/Info.plist package.json ios/Podfile.lock
git commit -m "chore(ios): drop photo-library permission (PHPicker is permission-free)"
```

### Task 4.2: i18n — add picker strings, remove dead gallery-permission strings

**Files:**
- Modify: `assets/langs/{en,ar,de,es,fr,ie,nl,pt}/{en,ar,...}.json`

- [ ] **Step 1: Add new keys to `assets/langs/en/en.json`** (key = value; keep file A–Z sorted):

```
"Add Photos": "Add Photos",
"Add your litter photos to start tagging": "Add your litter photos to start tagging",
"Choose litter photos from your gallery — only the photos you pick are uploaded.": "Choose litter photos from your gallery — only the photos you pick are uploaded.",
"Couldn't add — no location data": "Couldn't add — no location data",
"No location data": "No location data"
```

- [ ] **Step 2: Translate those 5 keys into the other 7 languages** (`ar, de, es, fr, ie, nl, pt`), following the existing entries' tone, inserted A–Z. (See `readme/Translations.md` for the workflow.)

- [ ] **Step 3: Remove dead strings.** For each candidate below, grep the repo; if it has **no** remaining `t('...')` reference, delete the key from all 8 language files:

```
"Allow photo access to see your recent photos here."
"Photo access is turned off. Enable it in Settings to get started."
"No photos available yet. Open Settings to choose which photos OpenLitterMap can access."
"Manage Photo Access"
"Grant Access"
"Load more photos"
"Select Photos To Tag & Upload"
"Select More"
"Gallery Access"
"Gallery Access Required"
"Gallery Access Needed"
"Allow access"
"Photo access is needed to upload litter photos with location data. You can enable it in Settings."
"Photo access is needed to select litter photos. You can try again or take a new photo instead."
"Your photos are accessible but location data is blocked. Enable \"Media location\" in Settings so we can read where photos were taken."
"Photo location access needed"
```
Run for each: `grep -rn "THE STRING" --include="*.js" --include="*.tsx" screens routes` — delete only if zero hits. (Some, e.g. `"skipped (no GPS data)."`, were only in the old `handleSelectMore` batch alert — now removed — and can also go if unreferenced.)

- [ ] **Step 4: Verify i18n integrity**

Run: `node -e "for (const l of ['en','ar','de','es','fr','ie','nl','pt']) JSON.parse(require('fs').readFileSync('assets/langs/'+l+'/'+l+'.json'))" && echo OK`
Expected: `OK` (all parse).
Run: `npm run lint`

- [ ] **Step 5: Commit**

```bash
git add assets/langs/
git commit -m "i18n: add Add-Photos strings; remove dead gallery-permission strings"
```

### Task 4.3: Docs

**Files:**
- Modify: `readme/MobileGallery.md`, `readme/MobilePermissions.md`, `CLAUDE.md`, `readme/changelog/2026-06-09.md`, memory

- [ ] **Step 1: Rewrite `readme/MobileGallery.md`** — remove the scan/EXIF-fallback/pagination/`dismissedUris` narrative; document the picker-driven persistent queue, the geotagged-only invariant, and the no-GPS card.

- [ ] **Step 2: Update `readme/MobilePermissions.md`** — Android no longer requests `READ_MEDIA_IMAGES`/storage; document the picker (no permission) + `ACCESS_MEDIA_LOCATION` for EXIF; iOS uses PHPicker (no `NSPhotoLibraryUsageDescription`).

- [ ] **Step 3: Update `CLAUDE.md`** — Core User Flow (no auto-scan inbox), slice table (remove `gallery`, 15→14), file-org (remove `screens/permission/`, `gallery_reducer`), and the dependency list (drop camera-roll).

- [ ] **Step 4: Add a changelog line** to `readme/changelog/2026-06-09.md`:

```
- v7.10.0 — Removed broad photo permissions (Play policy); migrated to the system photo picker with a persistent to-tag queue + per-photo no-GPS handling.
```

- [ ] **Step 5: Update memory** — in `MEMORY.md` add a one-line pointer; write a `project_photo_picker_migration.md` memory capturing the decision (picker over appeal), the GPS gate outcome, and the geotagged-only-queue invariant.

- [ ] **Step 6: Commit**

```bash
git add readme/ CLAUDE.md
git commit -m "docs: photo picker migration (gallery/permissions/CLAUDE/changelog)"
```

### Task 4.4: Version bump (BOOP)

**Files:**
- Modify: `package.json`, `ios/openlittermap.xcodeproj/project.pbxproj`, `android/app/build.gradle`

- [ ] **Step 1: Bump to 7.10.0** (minor — behaviour change driven by a compliance fix):
  - `package.json` `version`: `7.9.0` → `7.10.0`
  - iOS: both `MARKETING_VERSION` → `7.10.0`; bump `CURRENT_PROJECT_VERSION` (e.g. 78→79 — verify current value first)
  - Android (`android/app/build.gradle:95-96`): `versionCode 62` → `63`, `versionName "7.9.0"` → `"7.10.0"`

- [ ] **Step 2: Verify the in-app version matches**

Run: `grep -n "MARKETING_VERSION\|CURRENT_PROJECT_VERSION" ios/openlittermap.xcodeproj/project.pbxproj` and `grep -n "versionCode\|versionName" android/app/build.gradle`
Expected: all `*VERSION`/`versionName` read `7.10.0`; `versionCode 63`.

- [ ] **Step 3: Commit**

```bash
git add package.json ios/openlittermap.xcodeproj/project.pbxproj android/app/build.gradle
git commit -m "chore: bump to v7.10.0 (Android versionCode 63)"
```

---

## Final verification

- [ ] `npm run lint` — clean.
- [ ] `npm test` — all suites pass (`inboxSelector`, `photosInbox`, `addTagsToPhoto`, `authSession`).
- [ ] `grep -rn "READ_MEDIA_IMAGES\|READ_EXTERNAL_STORAGE\|WRITE_EXTERNAL_STORAGE" android/app/src/main/AndroidManifest.xml` — no matches.
- [ ] `grep -rn "camera-roll\|CameraRoll\|gallery_reducer\|state.gallery" --include="*.js" --include="*.ts" --include="*.tsx" screens reducers store routes utils` — no matches.
- [ ] On a real Android device: empty queue shows the "Add Photos" primary screen; "Add Photos" multi-selects; geotagged picks land in the queue and persist across a restart; a non-geotagged pick shows the dismissible no-GPS card; tagging a queued photo uploads it and clears it.
- [ ] iOS builds and the picker works with no permission prompt.

## Success criteria (from spec)

- No flagged permissions in the merged Android manifest.
- Geotagged pick imports with coordinates on a real device.
- Queue persists picks + captures; tagging → auto-upload clears them.
- Empty queue shows the inviting primary "Add Photos" screen (§3a).
- Non-geotagged pick shows a per-photo no-GPS card (§3b); no silent drop / batch alert.
- Lint + tests pass; no dangling gallery/camera-roll references; iOS & Android build.
