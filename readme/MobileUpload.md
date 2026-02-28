# Mobile Upload
> OpenLitterMap React Native v7.0

## Overview
The upload flow lets users select photos from their gallery, tag them with the v5 tagging system, and upload them to the OpenLitterMap backend. Photos are uploaded one at a time with progress tracking. A pre-upload validation step filters out photos without valid GPS coordinates. Tagged photos use a two-step upload: photo first, then tags via a separate API call.

## Files
- `screens/home/HomeScreen.js` — Main upload screen, orchestrates the upload flow with GPS validation
- `screens/home/homeComponents/UploadButton.js` — Upload trigger button
- `screens/home/homeComponents/UploadImagesGrid.js` — 3-column image grid display
- `screens/home/homeComponents/ActionButton.js` — FAB for gallery/delete actions
- `reducers/images_reducer.js` — Image state management, v5 tag actions, and upload thunks
- `reducers/tags_reducer.js` — Tag data for resolving cloId → full payload at upload time
- `reducers/shared_reducer.js` — Upload modal and "thank you" message state
- `utils/isGeotagged.js` — GPS validation (rejects null, undefined, and 0,0 coordinates)
- `utils/isTagged.js` — Checks for v5 tags (`tagsV5`), v4 tags (`tags`), or custom tags

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `uploadImage` | POST | `/api/photos/upload/with-or-without-tags` | FormData (photo, lat, lon, date, picked_up, model) | multipart/form-data, returns `photo_id` |
| `postTagsToPhoto` | POST | `/api/v3/tags` | `{photo_id, tags[], picked_up}` | v5 tags with explicit object + category |
| `getUntaggedImages` | GET | `/api/v2/photos/get-untagged-uploads` | — | Fetches user's untagged uploads |
| `deleteWebImage` | DELETE | `/api/photos/delete` | `params: {photoId}` | |
| `uploadTagsToWebImage` | POST | `/api/v2/add-tags-to-uploaded-image` | `{photo_id, tags, custom_tags, picked_up}` | Legacy v4 fallback only |

## Upload Flow (Two-Step for v5 Tags)
1. User selects photos from gallery (GalleryScreen)
2. Photos appear in `UploadImagesGrid` on HomeScreen
3. User taps an image → navigates to `AddTagScreen` to tag it
4. User adds v5 tags (stored as `[{ cloId, quantity }]` per image)
5. User taps upload button → `uploadPhotos()` called
6. **Pre-upload GPS validation**: filters images through `isGeotagged()`
7. If any photos skipped, Alert shows skip count with Cancel/Continue
8. Modal shows with progress counter (`uploaded / totalToUpload`)
9. **For each gallery image with v5 tags:**
   - **Step 1**: Upload photo via `uploadImage` (FormData with photo + GPS, NO tags)
   - Image stays in state as "uploaded web" with server `photo_id`
   - **Step 2**: POST tags via `postTagsToPhoto` (photo_id + resolved tags)
   - On success: image removed from state, `tagged++`
   - On failure: image stays for retry (type=web, tagsV5 intact)
10. **For web images with v5 tags**: POST tags directly via `postTagsToPhoto`
11. On completion, "Thank You" modal shows with results summary
12. User can cancel mid-upload via cancel button

## Tag Payload Resolution
At upload time, `buildV5TagsPayload(img)` resolves each `{ cloId, quantity }` into the full POST format using `state.tags.entriesByCloId` and `state.tags.categoriesById`:

```json
{
    "object": { "id": 1, "key": "butts" },
    "category": { "id": 1, "key": "smoking" },
    "quantity": 3,
    "picked_up": true,
    "materials": [],
    "brands": [],
    "custom_tags": []
}
```

## GPS Validation
Before upload, `uploadPhotos()` filters images:
- Gallery images must pass `isGeotagged()` — requires non-null, non-zero lat/lon
- Web images (`type === 'web'`) are always considered valid (GPS managed server-side)
- `isGeotagged()` rejects: null/undefined coordinates, 0,0 (Null Island)

## Image Types
- **gallery** — Selected from phone camera roll, has local URI
- **web** — Previously uploaded to server (via web app or after first upload step), has server ID
- **camera** — Taken with in-app camera (currently disabled)

## Redux State (`state.images`)
```
{
    imagesArray: array,       // All images (each has tagsV5, tags, picked_up, etc.)
    swiperIndex: number,      // Currently selected image index in AddTagScreen
    totalToUpload: number,
    uploaded: number,
    uploadFailed: number,
    tagged: number,
    taggedFailed: number,
    failedCounts: { alreadyUploaded, invalidCoordinates, unknown }
}
```

## Error Handling
Upload failures are categorized:
- `photo-already-uploaded` — Duplicate detection
- `invalid-coordinates` — lat=0, lon=0 (rare with pre-upload filtering)
- `unknown` — Other server errors

Tag POST failures increment `taggedFailed`. The image stays in state for retry.

## Retry Behavior
If tag POST fails after a successful photo upload:
- Image stays in `imagesArray` as `type: 'web'` with `tagsV5` intact
- On next upload attempt, the loop routes it to the "web + v5 tags" path
- Tags are posted directly via `postTagsToPhoto` (no re-upload of the photo)
