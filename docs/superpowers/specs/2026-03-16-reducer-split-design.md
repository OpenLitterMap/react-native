# Images Reducer Split — Design Spec

## Problem

`images_reducer.js` is 858 lines mixing three responsibilities: local gallery images, upload orchestration, and server untagged photos. This causes:
- Server images leaking into persisted `imagesArray` (stale data on rehydrate)
- Upload modal state split across `shared_reducer` and `images_reducer`
- Delete button showing when only server images exist
- Complex rehydrate transform to filter server images
- Difficulty reasoning about state changes

## Solution

Three sequential extractions, each producing a working app.

### Extraction 1: `server_photos_reducer`

**What moves:**
- State: `untaggedCount`, `untaggedPreview`, `editingPhoto`
- Thunks: `fetchUntaggedCount`, `fetchNextUntaggedPhoto`, `editTagsOnPhoto`
- Reducers: `loadPhotoForEditing`, `clearEditingPhoto`
- Not persisted

**Consumers to update:**
- `HomeScreen.js` — reads `untaggedCount`, `untaggedPreview`
- `AddTagScreen.js` — reads `editingPhoto`
- `UploadImagesGrid.js` — reads `untaggedCount`, `untaggedPreview`
- `MyUploads.js` — dispatches `loadPhotoForEditing`
- `uploads_reducer.js` — handles `editTagsOnPhoto.fulfilled`
- `store/index.js` — no persistence needed for this slice, but add to rootReducer

**Bug fixes baked in:**
- Clean separation means `imagesArray` never contains server images
- Rehydrate transform simplified (no `uploaded && !uri` filter needed)
- Delete button logic simplified (check `imagesArray.length > 0`, no `!img.uploaded` guard)

**Verification:** grep entire codebase for `state.images.editingPhoto`, `state.images.untaggedCount`, `state.images.untaggedPreview`, `loadPhotoForEditing`, `clearEditingPhoto`, `fetchUntaggedCount`, `fetchNextUntaggedPhoto`, `editTagsOnPhoto`. All must point to new slice.

### Extraction 2: `upload_reducer` (new, replaces current `uploads_reducer` name collision)

**Name:** `upload_reducer.js` (the current `uploads_reducer.js` handles My Uploads history — rename it to `upload_history_reducer.js` to avoid confusion, or keep as-is and name the new one `upload_flow_reducer.js`)

**Actually:** To avoid naming confusion with the existing `uploads_reducer.js` (My Uploads history), name the new slice `upload_flow_reducer.js`.

**What moves from images_reducer:**
- State: `uploadPhase`, `totalToUpload`, `uploaded`, `uploadFailed`, `tagged`, `taggedFailed`, `currentUploadIndex`, `uploadAbortReason`, `failedCounts`
- Thunks: `uploadImage`, `postTagsToPhoto`
- Reducers: `resetUploadState`, `setUploadPhase`, `setCurrentUploadIndex`, `setTotalToUpload`, `setUploadAbortReason`

**What moves from shared_reducer:**
- State: `showUploadModal`, `showThankYouMessages`
- Reducers: `cancelUpload`, `closeThankYouMessages`, `resetThankYouMessages`, `showThankYouMessagesAfterUpload`, `startUploading`

**Not persisted.**

**Consumers to update:**
- `HomeScreen.js` — primary consumer of all upload state + modal state
- `setupAxiosInterceptors.js` — reads `uploadPhase`, dispatches `setUploadAbortReason`
- `store/index.js` — add to rootReducer
- Remove upload actions from `shared_reducer` (it becomes app-version-only)

**Verification:** grep for `state.images.uploadPhase`, `state.images.uploaded`, `state.shared.showUploadModal`, all upload action imports from both old reducers. All must point to new slice.

### Extraction 3: `photos_reducer` (rename of images_reducer)

**What remains:**
- State: `imagesArray`, `swiperIndex`, `customTagError`
- Reducers: all tag operations (addTagV5, removeTagV5, updateTagQuantityV5, materials, brands, custom tags), `addImages`, `deleteImage`, `deleteSelectedImages`, `deselectAllImages`, `toggleSelectedImages`, `changeSwiperIndex`, `clearUploadedImages`, `togglePickedUp`, `setPickedUpOnTag`, `toggleMaterialOnTag`
- Selectors: `selectSelectedCount`
- Persisted (imagesArray only)

**Rename:** `images_reducer.js` → `photos_reducer.js`, slice name `images` → `photos`

**All `state.images.*` references → `state.photos.*`**

**Bug fixes baked in:**
- TAG-02: `updateTagQuantityV5` quantity cap (already applied, verify it's in new file)
- Rehydrate transform simplified: only filter `editing: true`, no server image filter needed
- Delete button: simple `imagesArray.length > 0` check (all items are local)

**Consumers to update:** Every file that imports from `images_reducer` or reads `state.images.*`. This is the largest change. Full grep required.

**Verification:** grep for `state.images.`, `from.*images_reducer`, `from.*'/images_reducer'`. Zero matches allowed after this step.

## Execution Order

1. Extract `server_photos_reducer` → test → commit
2. Extract `upload_flow_reducer` → test → commit
3. Rename remaining to `photos_reducer` → test → commit

Each step: create new file, move state/thunks/reducers, update all imports and selectors, grep to verify zero stale references, test app.

## Store Configuration After Split

```javascript
// store/index.js
const rootReducer = combineReducers({
    auth: authReducer,
    gallery: galleryReducer,
    leaderboards: leaderboardsReducer,
    locations: locationsReducer,
    photos: photosReducer,        // local gallery images + tagging (persisted)
    serverPhotos: serverPhotosReducer,  // untagged count/preview/editing (not persisted)
    settings: settingsReducer,
    shared: sharedReducer,        // app version only (after upload_flow extraction)
    stats: statsReducer,
    teams: teamReducer,
    uploadFlow: uploadFlowReducer,  // upload orchestration + modal (not persisted)
    uploads: uploadsReducer         // My Uploads history (not persisted)
});

// Persistence: whitelist only ['auth', 'photos']
```
