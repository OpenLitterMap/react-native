# Mobile Upload
> OpenLitterMap React Native v7.0

## Overview
The upload flow lets users select photos from their gallery, tag them with the v5 tagging system, and upload them to the OpenLitterMap backend. Photos are uploaded one at a time with progress tracking. A pre-upload validation step filters out photos without valid GPS coordinates. Tagged photos use a two-step upload: photo first, then tags via a separate API call.

## Files
- `screens/home/HomeScreen.js` — Main upload screen, orchestrates the upload flow with GPS validation
- `screens/home/homeComponents/UploadButton.js` — Upload trigger button
- `screens/home/homeComponents/UploadImagesGrid.js` — 3-column image grid display
- `screens/home/homeComponents/ActionButton.js` — FAB for gallery/delete actions
- `reducers/photos_reducer.js` — Local image state (imagesArray, tagging, swiperIndex)
- `reducers/upload_flow_reducer.js` — Upload phase, counters, modal state, `uploadImage`/`postTagsToPhoto` thunks
- `reducers/uploads_reducer.js` — Photo deletion thunk (`deleteUploadPhoto`)
- `utils/isGeotagged.js` — GPS validation (rejects null, undefined, and 0,0 coordinates)
- `utils/isTagged.js` — Checks for tags or custom tags

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `uploadImage` | POST | `/api/v3/upload` | FormData (photo, lat, lon, date, picked_up, model) | multipart/form-data, returns `photo_id` |
| `postTagsToPhoto` | POST | `/api/v3/tags` | `{photo_id, tags[], picked_up}` | v5 tags with CLO IDs, materials, brands, custom tags |
| `getUntaggedImages` | GET | `/api/v3/user/photos?tagged=false&per_page=100` | — | Fetches user's untagged uploads |
| `deleteUploadPhoto` | POST | `/api/profile/photos/delete` | `{ "photoid": <id> }` | Deletes photo from server and local state |

## Upload Flow (Two-Step)
1. User selects photos from gallery (GalleryScreen)
2. Photos appear in `UploadImagesGrid` on HomeScreen
3. User taps an image → navigates to `AddTagScreen` to tag it
4. User adds v5 tags (stored as `[{ cloId, quantity, materials, brands, customTags }]` per image)
5. User taps upload button → `uploadPhotos()` called
6. **Pre-upload GPS validation**: filters images through `isGeotagged()`
7. If any photos skipped, Alert shows skip count with Cancel/Continue
8. Modal shows with progress counter (`uploaded / totalToUpload`)
9. **For each gallery image:**
   - **Step 1**: Upload photo via `uploadImage` (FormData with photo + GPS, NO tags)
   - Image stays in state with `uploaded: true` and server `photo_id`
   - **Step 2**: POST tags via `postTagsToPhoto` (photo_id + resolved tags)
   - On success: image removed from state, `tagged++`
   - On failure: image stays for retry (uploaded=true, tags intact)
10. **For uploaded images with v5 tags**: POST tags directly via `postTagsToPhoto`
11. On completion, result modal shows upload summary (success/failure counts)
12. User can cancel mid-upload via cancel button (AbortController aborts in-flight request)

## Tag Payload Resolution
At upload time, `buildTagsPayload(img)` (from `utils/buildTagsPayload.js`) converts each tag into the POST format:

```json
{
    "category_litter_object_id": 1,
    "litter_object_type_id": null,
    "quantity": 3,
    "picked_up": true,
    "materials": [1, 5],
    "brands": [{ "id": 42, "quantity": 1 }],
    "custom_tags": ["near café"]
}
```

- `materials` — Array of material IDs from `tag.materials`
- `brands` — Array of `{ id, quantity }` from `tag.brands`
- `custom_tags` — Array of strings from `tag.customTags`
- Image-level custom tags (`img.customTags`) are merged into the first tag entry's `custom_tags` array

## GPS Validation
Before upload, `uploadPhotos()` filters images:
- Non-uploaded images must pass `isGeotagged()` — requires non-null, non-zero lat/lon
- Uploaded images (`uploaded === true`) are always considered valid (GPS managed server-side)
- `isGeotagged()` rejects: null/undefined coordinates, 0,0 (Null Island)

## Image Types & Upload State
- **type** — Origin of the image: `'gallery'` (phone camera roll), `'camera'` (in-app capture), `'web'` (server/web app)
- **uploaded** — Boolean. `true` = photo binary is on the server, `false` = local only

After a gallery image is uploaded, `type` stays `'gallery'` but `uploaded` becomes `true`. All server-state routing (skip binary upload, tag-only path, server deletion, GPS bypass) uses the `uploaded` boolean, not `type`.

## Redux State

### `state.photos` (persisted — imagesArray only)
```
{
    imagesArray: array,       // All images (each has tags, customTags, picked_up, etc.)
    swiperIndex: number,      // Currently selected image index in AddTagScreen
}
```

### `state.uploadFlow` (not persisted)
```
{
    totalToUpload: number,
    uploaded: number,
    uploadFailed: number,
    tagged: number,
    taggedFailed: number,
    uploadPhase: 'idle' | 'uploading' | 'tagging',
    currentUploadIndex: number,
    uploadAbortReason: null | 'token-expired' | 'cancelled',
    failedCounts: { alreadyUploaded, invalidCoordinates, timeout, network, server, unknown },
    showUploadModal: boolean,
    showThankYouMessages: boolean,
}
```

## Error Handling
Upload failures are classified by `classifyError()` in `utils/classifyError.js`:
- `photo-already-uploaded` — Duplicate detection (422)
- `invalid-coordinates` — lat=0, lon=0 (422)
- `timeout` — Connection timed out (ECONNABORTED)
- `network` — No internet connection
- `server` — Server error (5xx)
- `unauthorized` — Session expired (401) — triggers abort via `setUploadAbortReason('token-expired')`
- `unknown` — Other errors

On 401, the axios interceptor signals the upload loop to stop gracefully. After re-login, a recovery alert lets the user retry with preserved photos.

Tag POST failures increment `taggedFailed`. The image stays in state for retry.

## Cancel Behavior
Cancel uses an `AbortController` to abort the in-flight axios request, then resets `uploadPhase` to `idle` and closes the modal. The upload loop checks `isUploadCancelled` ref before each iteration and early-returns after a cancel to prevent the result modal from re-appearing.

## Retry Behavior
If tag POST fails after a successful photo upload:
- Image stays in `imagesArray` with `uploaded: true` and `tags` intact
- On next upload attempt, the loop routes it to the "uploaded + tags" path
- Tags are posted directly via `postTagsToPhoto` (no re-upload of the photo)

## Photo Deletion
Uploaded images on HomeScreen are deleted via `deleteUploadPhoto` (from `uploads_reducer.js`), which calls `POST /api/profile/photos/delete` with `{ "photoid": <id> }`. The image is also removed from local `imagesArray` via `deleteImage`. Non-uploaded images are removed from local state only (no server call needed).
