# Bug Audit Fixes (BUG-34 through BUG-45) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 12 bugs identified in the 2026-03-16 code audit.

**Architecture:** These are independent bug fixes across reducers, utils, and screens. Each task targets a single file (or two tightly-coupled files). No cross-task dependencies — all tasks can be executed in parallel.

**Tech Stack:** React Native, Redux Toolkit (createSlice/createAsyncThunk), react-native-permissions, i18next, axios

**Note:** No test suite exists in this project (Jest configured but zero test files). Steps reference manual verification instead.

---

## Chunk 1: Reducer Fixes (BUG-34, BUG-35, BUG-36, BUG-39, BUG-40)

### Task 1: Add `getTeamMembers.rejected` handler (BUG-34)

**Files:**
- Modify: `reducers/team_reducer.js:385` (after `getTeamMembers.fulfilled` handler)

- [ ] **Step 1: Add the rejected handler**

Insert after the `.addCase(getTeamMembers.fulfilled, ...)` block (after line 385):

```javascript
.addCase(getTeamMembers.rejected, (state, action) => {
    state.teamsFormError = action.payload || 'Failed to load members';
})
```

- [ ] **Step 2: Verify the fix**

Run: `npx eslint reducers/team_reducer.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add reducers/team_reducer.js
git commit -m "fix: add getTeamMembers rejected handler (BUG-34)

Without this, a failed member fetch leaves loading state stuck
indefinitely — users see an infinite spinner."
```

---

### Task 2: Deduplicate location stack entries (BUG-35)

**Files:**
- Modify: `reducers/locations_reducer.js:80-87` (`fetchLocationChildren.fulfilled` handler)

- [ ] **Step 1: Add duplicate check before push**

Replace the fulfilled handler body (lines 80-87):

```javascript
.addCase(fetchLocationChildren.fulfilled, (state, action) => {
    state.childrenStatus = 'succeeded';
    state.children = action.payload.locations;
    // Prevent duplicate stack entries when re-entering the same location
    const parentId = action.payload.parent.id;
    const alreadyInStack = state.locationStack.some(
        entry => entry.id === parentId
    );
    if (!alreadyInStack) {
        state.locationStack.push({
            ...action.payload.parent,
            children: action.payload.locations
        });
    }
})
```

- [ ] **Step 2: Verify the fix**

Run: `npx eslint reducers/locations_reducer.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add reducers/locations_reducer.js
git commit -m "fix: prevent duplicate location stack entries (BUG-35)

Navigating back and re-entering the same location pushed a duplicate
to the stack, breaking breadcrumb navigation."
```

---

### Task 3: Rebuild tag display names on language change (BUG-36)

**Files:**
- Modify: `reducers/tags_reducer.js` — add `condition` bypass + invalidation on language change

The current `fetchAllTags` thunk bakes `i18n.t()` results into state at fetch time. When the user changes language, tags keep old-language display names. The fix: listen for language changes and re-fetch with `forceRefresh`.

**Approach:** The `SettingsScreen` already dispatches language changes. After `i18n.changeLanguage()`, dispatch `fetchAllTags({ forceRefresh: true })`. This re-runs the thunk which re-evaluates `i18n.t()` with the new language.

- [ ] **Step 1: Find where language is changed in SettingsScreen**

Read `screens/setting/SettingsScreen.js` and find the `i18n.changeLanguage` call.

- [ ] **Step 2: Dispatch `fetchAllTags({ forceRefresh: true })` after language change**

After the `i18n.changeLanguage(langCode)` call, add:

```javascript
dispatch(fetchAllTags({ forceRefresh: true }));
```

This forces a re-build of display names using the new language's translations.

- [ ] **Step 3: Verify the fix**

Run: `npx eslint screens/setting/SettingsScreen.js`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add screens/setting/SettingsScreen.js
git commit -m "fix: rebuild tag names when language changes (BUG-36)

Tag display names were baked at fetch time using i18n.t(). Changing
language left stale names until app restart."
```

---

### Task 4: Apply `editTagsOnPhoto.fulfilled` server response (BUG-39)

**Files:**
- Modify: `reducers/images_reducer.js:735-737` (`editTagsOnPhoto.fulfilled` handler)

The fulfilled handler currently discards the server response. It should update the photo's tags in the uploads list (if the photo is in `uploads_reducer`'s state). However, `editTagsOnPhoto` is dispatched from MyUploads and the edited photo lives in the uploads slice, not images slice. The images reducer can't update uploads state.

**Correct approach:** The response should be handled where the photo lives. Since `editTagsOnPhoto` is called from the MyUploads screen and the photo is in `uploads_reducer`, add a handler there.

- [ ] **Step 1: Check if uploads_reducer has a handler for editTagsOnPhoto**

Read `reducers/uploads_reducer.js` and check for `editTagsOnPhoto` references.

- [ ] **Step 2: Import editTagsOnPhoto in uploads_reducer and add fulfilled handler**

In `reducers/uploads_reducer.js`, add to the imports:

```javascript
import { editTagsOnPhoto } from './images_reducer';
```

Add in the `extraReducers` builder:

```javascript
.addCase(editTagsOnPhoto.fulfilled, (state, action) => {
    const { photoId, photoTags } = action.payload;
    if (state.uploads?.data) {
        const photo = state.uploads.data.find(p => p.id === photoId);
        if (photo && photoTags) {
            photo.new_tags = photoTags;
        }
    }
})
```

- [ ] **Step 3: Verify the fix**

Run: `npx eslint reducers/uploads_reducer.js`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add reducers/uploads_reducer.js
git commit -m "fix: apply editTagsOnPhoto response to uploads state (BUG-39)

The server's updated tags were discarded, leaving stale data in the
My Uploads list until manual refresh."
```

---

### Task 5: Allow `fetchUserLocations` retry after transient failure (BUG-40)

**Files:**
- Modify: `reducers/uploads_reducer.js:171-174` (`fetchUserLocations.rejected` handler)

Currently sets `userLocations = []` on failure, permanently hiding location filters. Instead, set a `locationsError` field so the UI can show a retry option, while keeping `userLocations` as `null` (unfetched) so a re-fetch is possible.

- [ ] **Step 1: Add `locationsError` to initial state**

In `reducers/uploads_reducer.js`, add to `initialState`:

```javascript
locationsError: null
```

- [ ] **Step 2: Update the rejected handler**

Replace lines 171-174:

```javascript
.addCase(fetchUserLocations.rejected, (state, action) => {
    state.locationsError = action.payload || 'Failed to load locations';
})
```

And clear the error on success (add to the fulfilled handler at line 168-169):

```javascript
.addCase(fetchUserLocations.fulfilled, (state, action) => {
    state.userLocations = action.payload;
    state.locationsError = null;
})
```

- [ ] **Step 3: Check if any component guards on `userLocations === null`**

Search for `userLocations` usage in screens to ensure `null` (unfetched) vs `[]` (empty) is handled.

- [ ] **Step 4: Verify the fix**

Run: `npx eslint reducers/uploads_reducer.js`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add reducers/uploads_reducer.js
git commit -m "fix: allow location filter retry after transient failure (BUG-40)

Previously set userLocations=[] on failure, permanently hiding filters.
Now keeps null so the fetch can be retried."
```

---

## Chunk 2: Utility & Permission Fixes (BUG-37, BUG-38, BUG-43, BUG-44, BUG-45)

### Task 6: Request ACCESS_MEDIA_LOCATION on Android 29–32 (BUG-37)

**Files:**
- Modify: `utils/permissions/cameraRollPermission.js:23-27`

On Android 29–32 (scoped storage), `READ_EXTERNAL_STORAGE` doesn't grant EXIF GPS access from `content://` URIs. Need to also request `ACCESS_MEDIA_LOCATION`.

- [ ] **Step 1: Update the Android < 33 branch in requestCameraRollPermission**

Replace lines 23-27 in `requestCameraRollPermission`:

```javascript
} else if (Platform.Version >= 29) {
    // Android 29-32: scoped storage requires both permissions
    result = await request(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
    );

    if (result !== 'granted') {
        return 'denied';
    }

    const mediaLocation = await request(
        PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
    );

    return mediaLocation === 'granted' ? 'granted' : 'limited';
} else {
    // Android < 29: full file access, no scoped storage
    result = await request(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
    );
}
```

- [ ] **Step 2: Update the Android < 33 branch in checkCameraRollPermission**

Replace lines 78-79 in `checkCameraRollPermission`:

```javascript
} else if (Platform.Version >= 29) {
    const readStorage = await check(
        PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE
    );

    if (readStorage !== 'granted') {
        return 'denied';
    }

    const mediaLocation = await check(
        PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION
    );

    return mediaLocation === 'granted' ? 'granted' : 'limited';
} else {
    return await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
}
```

- [ ] **Step 3: Verify the fix**

Run: `npx eslint utils/permissions/cameraRollPermission.js`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add utils/permissions/cameraRollPermission.js
git commit -m "fix: request ACCESS_MEDIA_LOCATION on Android 29-32 (BUG-37)

Scoped storage on Android 29-32 requires this permission to read
EXIF GPS data from content:// URIs. Without it, photos appear
non-geotagged even when they have GPS."
```

---

### Task 7: Clamp swiperIndex safely when array becomes empty (BUG-38)

**Files:**
- Modify: `reducers/images_reducer.js:549-562` (`deleteImage` reducer)

When the last image is deleted, `swiperIndex` becomes 0 but `imagesArray` is empty. Any code reading `imagesArray[swiperIndex]` gets `undefined`.

- [ ] **Step 1: Fix the deleteImage reducer**

Replace lines 549-562:

```javascript
deleteImage(state, action) {
    const index = state.imagesArray.findIndex(
        delImg => delImg.id === action.payload
    );

    if (index !== -1) {
        state.imagesArray.splice(index, 1);
        // Keep swiperIndex in bounds
        if (state.imagesArray.length === 0) {
            state.swiperIndex = 0;
        } else if (index < state.swiperIndex) {
            state.swiperIndex--;
        } else if (state.swiperIndex >= state.imagesArray.length) {
            state.swiperIndex = state.imagesArray.length - 1;
        }
    }
},
```

This is functionally identical (Math.max(0, -1) = 0), but the explicit `length === 0` branch makes intent clear and prevents future misuse. The real protection is that callers should check `imagesArray.length > 0` before accessing by index — verify this in the AddTagScreen.

- [ ] **Step 2: Check AddTagScreen guards on empty array**

Search for `imagesArray[swiperIndex]` in AddTagScreen to ensure it handles the empty case.

- [ ] **Step 3: Verify the fix**

Run: `npx eslint reducers/images_reducer.js`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add reducers/images_reducer.js
git commit -m "fix: handle swiperIndex when last image deleted (BUG-38)

Explicit empty-array branch prevents undefined access when all
images are removed."
```

---

### Task 8: Validate cloId in buildTagsPayload (BUG-43)

**Files:**
- Modify: `utils/buildTagsPayload.js:8-19`

- [ ] **Step 1: Add cloId validation**

Replace lines 8-19:

```javascript
const tags = (img.tags || [])
    .filter(tag => tag.cloId != null)
    .map(tag => ({
        category_litter_object_id: tag.cloId,
        litter_object_type_id: tag.typeId ?? null,
        quantity: tag.quantity,
        picked_up: tag.picked_up ?? null,
        materials: tag.materials || [],
        brands: (tag.brands || []).map(b => ({
            id: b.id,
            quantity: b.quantity || 1
        })),
        custom_tags: tag.customTags || []
    }));
```

The `.filter(tag => tag.cloId != null)` silently drops malformed tags rather than sending `undefined` to the backend.

- [ ] **Step 2: Verify the fix**

Run: `npx eslint utils/buildTagsPayload.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/buildTagsPayload.js
git commit -m "fix: filter out tags with missing cloId in buildTagsPayload (BUG-43)

Prevents sending category_litter_object_id: undefined to the backend,
which would produce a cryptic server error."
```

---

### Task 9: Guard `extra_tags` iteration in getTagsFromBackend (BUG-44)

**Files:**
- Modify: `utils/getTagsFromBackend.js:30-31`

- [ ] **Step 1: Add Array.isArray guard**

Replace line 30:

```javascript
if (Array.isArray(apiTag.extra_tags)) {
```

(was: `if (apiTag.extra_tags) {`)

- [ ] **Step 2: Verify the fix**

Run: `npx eslint utils/getTagsFromBackend.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/getTagsFromBackend.js
git commit -m "fix: guard extra_tags iteration with Array.isArray (BUG-44)

Prevents crash if backend returns extra_tags as null or non-iterable."
```

---

### Task 10: Make formatKey Unicode-safe (BUG-45)

**Files:**
- Modify: `utils/formatKey.js:9-10`

- [ ] **Step 1: Replace regex with Unicode-aware version**

Replace lines 9-10:

```javascript
export const formatKey = (key) => {
    if (!key) return '';
    return key
        .replace(/_/g, ' ')
        .replace(/(^|\s)\S/g, l => l.toUpperCase());
};
```

`\S` matches any non-whitespace character including Unicode, vs `\w` which only matches `[a-zA-Z0-9_]`. The `(^|\s)` anchor replaces `\b` which has Unicode issues.

- [ ] **Step 2: Verify the fix**

Run: `npx eslint utils/formatKey.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/formatKey.js
git commit -m "fix: make formatKey Unicode-safe (BUG-45)

\b\w regex failed on non-ASCII characters. Now uses (^|\s)\S
which handles accented letters and other Unicode correctly."
```

---

## Chunk 3: Interceptor & Screen Fixes (BUG-41, BUG-42)

### Task 11: Make setupAxiosInterceptors idempotent (BUG-41)

**Files:**
- Modify: `utils/setupAxiosInterceptors.js`

- [ ] **Step 1: Add guard against multiple registrations**

Replace the entire file:

```javascript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../reducers/auth_reducer';
import { setUploadAbortReason } from '../reducers/images_reducer';

/**
 * Register a global axios response interceptor.
 * - Sets a 30-second default timeout for all requests
 * - On 401 responses: signals the upload loop to stop, then logs out
 */
let isLoggingOut = false;
let interceptorId = null;

export default function setupAxiosInterceptors(store) {
    // Global timeout — prevents uploads from hanging indefinitely
    axios.defaults.timeout = 30000;

    // Remove previous interceptor if any (idempotent for hot reload)
    if (interceptorId !== null) {
        axios.interceptors.response.eject(interceptorId);
    }

    interceptorId = axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response?.status === 401 && !isLoggingOut) {
                isLoggingOut = true;

                // If an upload is in progress, signal it to stop gracefully
                const state = store.getState();
                if (state.images?.uploadPhase !== 'idle') {
                    store.dispatch(setUploadAbortReason('token-expired'));
                }

                await AsyncStorage.removeItem('jwt').catch(() => {});
                store.dispatch(logout());

                // Reset after a tick so future 401s (after re-login) still work
                setTimeout(() => { isLoggingOut = false; }, 0);
            }
            return Promise.reject(error);
        }
    );
}
```

- [ ] **Step 2: Verify the fix**

Run: `npx eslint utils/setupAxiosInterceptors.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add utils/setupAxiosInterceptors.js
git commit -m "fix: make setupAxiosInterceptors idempotent (BUG-41)

Ejects previous interceptor before registering a new one, preventing
stacked 401 handlers during React Native hot reload."
```

---

### Task 12: Move useTranslation before useEffect in HomeScreen (BUG-42)

**Files:**
- Modify: `screens/home/HomeScreen.js:52,157-159`

- [ ] **Step 1: Move the hook call to the top of the component**

The `useTranslation()` call is currently at line 157, after all `useEffect` and `useSelector` hooks. Move it to line 57 (after `useWindowDimensions`).

Remove lines 157-159:
```javascript
    const {t} = useTranslation();
    const cancelText = t('Cancel');
    const deleteText = t('Delete');
```

Insert after line 56 (`const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = useWindowDimensions();`):
```javascript
    const {t} = useTranslation();
```

Then place the derived strings after the last `useSelector` call (after line 100):
```javascript
    const cancelText = t('Cancel');
    const deleteText = t('Delete');
```

- [ ] **Step 2: Verify the fix**

Run: `npx eslint screens/home/HomeScreen.js`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add screens/home/HomeScreen.js
git commit -m "fix: move useTranslation before useEffect hooks (BUG-42)

Hooks should be grouped at the top of the component before any
side effects, per React conventions."
```

---

## Post-Implementation

After all 12 tasks are complete:

- [ ] **Run full lint check:** `npm run lint`
- [ ] **Update AUDIT.md bug tracker** with BUG-34 through BUG-45 as FIXED
- [ ] **Final commit** with audit updates
