# Mobile Upload
> The two-step auto-upload flow: GPS filter, photo binary, then the idempotent tag write.

## Overview
Photos enter the HomeScreen "Your Photos" inbox via the **system photo picker** ("Add Photos", multi-select) and in-app camera captures — there is no camera-roll scan. The inbox is a persistent, geotagged-only queue backed by `photos.imagesArray`. Tapping a photo opens the tagging screen; on returning to HomeScreen the upload is auto-triggered. Uploads run one photo at a time. A pre-upload step still filters out any photo without valid GPS as defence. Tagged photos use a two-step upload: photo binary first, then tags via a separate idempotent call.

## Files
- `screens/home/HomeScreen.js` — Dashboard + upload orchestration (auto-uploads on focus after tagging)
- `screens/home/useUploadPhotos.js` — Upload loop hook (sequential upload, GPS filter, cancel, retry)
- `screens/home/homeComponents/InboxSection.js` — "Your Photos" inbox grid (tap to tag, Add Photos, delete)
- `screens/home/homeComponents/useInbox.js` — inbox state hook (selection + delete mode; the queue is the local `imagesArray`, no paging)
- `screens/home/homeComponents/UploadModal.js` — upload progress modal
- `reducers/photos_reducer.js` — Local image state (imagesArray, tagging, swiperIndex)
- `reducers/upload_flow_reducer.js` — Upload phase, counters, modal state, `uploadImage`/`addTagsToPhoto` thunks
- `reducers/server_photos_reducer.js` — Server-side untagged count + previews (`fetchUntaggedCount`, `fetchAllUntaggedPhotos`)
- `utils/buildTagsPayload.js` — Converts an image's tags into the backend CLO payload
- `utils/isServerPhotoId.js` — Guards the tag write: only a positive-integer server photo id is sent (blocks local/onboarding ids)
- `utils/isGeotagged.js` — GPS validation (rejects null, undefined, and 0,0 coordinates)
- `utils/isTagged.js` — Checks for tags or custom tags

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `uploadImage` | POST | `/api/v3/upload` | FormData (`photo`, `lat`, `lon`, `date`, `model`) | multipart/form-data, returns `photo_id`. No tags and no `picked_up` here — those go in the tag write. |
| `addTagsToPhoto` | PUT | `/api/v3/tags` | `{ photo_id, tags }` | Replace semantics (idempotent — safe to retry); guarded by `isServerPhotoId`. Tags carry CLO IDs, materials, brands, custom tags, and per-tag `picked_up`. |
| `fetchUntaggedCount` | GET | `/api/v3/user/photos/stats` **and** `/api/v3/user/photos?tagged=false&per_page=10` | — | One `Promise.all` — stats + a few preview tiles for the dashboard badge (`server_photos_reducer`). |
| `fetchAllUntaggedPhotos` | GET | `/api/v3/user/photos?tagged=false&per_page=50` | — | Paginates the full untagged queue into the editing flow. |

Photo deletion lives in `uploads_reducer` (`deleteUploadPhoto`) — see `MobileMyUploads.md`.

## Upload Flow (Two-Step)
Orchestrated by `useUploadPhotos.js`, auto-triggered from HomeScreen on focus after tagging.

1. **Filter** — Only images that are both geotagged (`isGeotagged`) and tagged (`isTagged`) are uploadable. If any tagged photos lack GPS, an Alert reports the skip count with Cancel/Continue.
2. **Per photo** — for a not-yet-uploaded photo: **(a)** POST the binary via `uploadImage` → server returns `photo_id`; **(b)** PUT the resolved tags via `addTagsToPhoto`. For an already-uploaded photo (retry path), the binary step is skipped and only the tag write runs.
3. **Idempotent short-circuit** — if `uploadImage` reports the photo is `already_uploaded` AND `tagged`, the tag write is skipped and the photo is cleared from the inbox (`removeTaggedPhoto`).
4. **Progress + result** — the modal shows a `uploaded / totalToUpload` counter while running, then a thank-you/result summary on completion.

### Untagged Preview Shortcut
The untagged preview tile on HomeScreen opens the tagging screen immediately with the tapped photo already shown. The full untagged queue is fetched in the background after navigation so the tap feels instant.

## Tag Payload Resolution
At upload time, `buildTagsPayload(img)` converts each tag to the CLO format: `category_litter_object_id`, `litter_object_type_id`, `quantity`, `picked_up` (per tag), `materials` (array of IDs), `brands` (`[{id, quantity}]`), and `custom_tags` (strings). Image-level custom tags (`img.customTags`) are merged into the first tag entry; an image with only custom tags sends `{ custom: true, key }` entries. See `utils/buildTagsPayload.js` for the exact shape.

## GPS Validation
Non-uploaded images must pass `isGeotagged()` (non-null, non-zero lat/lon — rejects 0,0 / Null Island). Already-uploaded images bypass the check (GPS is managed server-side).

## Image Types & Upload State
- **type** — Origin of the image: `'gallery'`, `'camera'`, or `'web'`.
- **uploaded** — Boolean: `true` = binary is on the server, `false` = local only.

After a gallery image uploads, `type` stays `'gallery'` but `uploaded` becomes `true`. All server-state routing (skip binary upload, tag-only path, deletion, GPS bypass) keys off the `uploaded` boolean, not `type`.

## Redux State
- `state.photos` (persisted — `imagesArray` only): local images with their tags/customTags/picked_up plus `swiperIndex`. See `reducers/photos_reducer.js`.
- `state.uploadFlow` (not persisted): upload phase (`idle`/`uploading`/`tagging`), progress counters, per-reason failure counts, abort reason, and modal flags. See `reducers/upload_flow_reducer.js`.

## Error Handling
Upload failures are classified by `classifyError()` (`utils/classifyError.js`) into: `photo-already-uploaded`, `invalid-photo-id`, `invalid-coordinates`, `timeout`, `network`, `server`, `unauthorized`, `unknown`.

- **`photo-already-uploaded`** — duplicate detected server-side; the stranded photo is dropped from the inbox (it's already on the server and can't be tagged without a live photo id).
- **`invalid-photo-id`** — the id can never be tagged: either `addTagsToPhoto` refused a non-integer id locally (no network call) or the backend rejected a valid-integer id with no live row. Permanent + non-reportable; the photo is dropped so the loop stops retrying it.
- **`unauthorized` (401)** — the axios interceptor signals the loop to stop via `setUploadAbortReason('token-expired')`. After re-login, a recovery flow lets the user retry with photos preserved.

## Cancel Behaviour
Cancel uses an `AbortController` to abort the in-flight axios request, resets `uploadPhase` to `idle`, and closes the modal. The loop checks `isUploadCancelled` before each iteration and early-returns after a cancel so the result modal can't re-appear.

## Retry Behaviour
If a tag write fails after a successful binary upload, the image stays in `imagesArray` with `uploaded: true` and `tags` intact. On the next attempt the loop routes it straight to the tag-only path. Because `PUT /api/v3/tags` is **replace** semantics, re-running the loop is idempotent — a lost-response retry can't double-tag or double-count XP. **Exception:** an `invalid-photo-id` rejection drops the photo instead of retrying; only transient errors (timeout/network/server) are retried.
