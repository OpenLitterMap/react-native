# Mobile Gallery (the "Your Photos" inbox)

> The to-tag queue on the HomeScreen dashboard: fed by gallery import (native MediaStore on Android, system picker on iOS), geotagged-only, tap-to-tag.

## Overview
There is no separate gallery screen and **no camera-roll scan**. The **"Your
Photos"** inbox is a section of the HomeScreen dashboard that renders the
local, **not-yet-uploaded** photos already held in `photos.imagesArray` — the
same persisted array the tagger and uploader use. Photos enter the queue two
ways: **in-app camera captures** and **gallery imports**. The gallery path is
platform-split (see below): **Android** uses a native **MediaStore** picker that
preserves GPS, **iOS** uses the system photo picker. The whole dashboard is one
virtualized `FlashList`: the fixed sections (stats, untagged, the no-GPS card,
inbox controls) sit in `ListHeaderComponent`, and the queue photos are the list
`data` (flex-sized square tiles, even gutters, inset 16px).

## Geotagged-only invariant
`imagesArray` is **geotagged-only**. Every photo in the queue has valid GPS, so
every tile is mappable/uploadable and the tagger can never dead-end on an
un-uploadable photo. Non-geotagged picks **never enter the queue** — they are
surfaced separately in the dismissible no-GPS card (see below). This invariant
is enforced at the import boundary (`partitionByGps`) and assumed by
`selectInboxPhotos`.

## Files
- `utils/pickGeotaggedPhotos.js` — **platform-dispatch seam**: Android → native `OlmGallery.pick` (after a permission gate); iOS → `launchImageLibrary` + per-asset `readGpsFromExif`. Returns the same normalized `Asset[]` shape on both.
- `utils/partitionByGps.js` — splits picked assets into `{imported, skipped}` via `isValidGpsCoords` (the geotagged-only boundary).
- `utils/permissions/photoPermission.js` — `ensurePhotoPermission` (Android media permissions, scaled by API level; iOS no-op). AML-aware status: `granted` / `location-denied` / `denied`.
- `utils/findMissingPhotos.js` — guards the persisted queue against cache eviction: prunes phantom `file://` entries whose cached file the OS deleted (Android, via native `OlmGallery.fileExists`). Skips already-uploaded items (their retry is server-side).
- `android/app/src/main/java/com/openlittermap/OlmGallery*.kt` — native MediaStore module (`OlmGalleryModule` fires `ACTION_PICK`; `MediaCopier` copies the original bytes to app cache; `GpsExifReader` reads GPS + capture time).
- `screens/home/HomeScreen.js` — `handleSelectMore` ("Add Photos" import), `handleTapInboxPhoto` (jump the swiper to the tapped photo), `noGpsPicks` state + `NoGpsPicksCard`.
- `screens/home/homeComponents/useInbox.js` — inbox state hook (selection set, delete mode); reads `selectInboxPhotos`.
- `screens/home/homeComponents/InboxSection.js` — presentational pieces: `InboxThumbnail`, `InboxControls`, `InboxEmpty`, `NoGpsPicksCard`.
- `reducers/photos_reducer.js` — `selectInboxPhotos` selector; `addImages` (import), `deleteImage` (remove).
- `utils/gps.js` — `isValidGpsCoords` (rejects null, 0,0).
- `utils/readGpsFromExif.js` — EXIF GPS read for **iOS** picker imports.

## Flow
1. The queue shows `selectInboxPhotos(state)`: local photos with a `uri`, `uploaded === false`, and non-null `lat`, **newest-first**. There is no scan and no date window — it's just the persisted array filtered + sorted.
2. **Add Photos** (inbox header, primary CTA on the empty state) → `pickGeotaggedPhotos({selectionLimit: 0})`.
   - **Android:** `ensurePhotoPermission()` requests media access (per the API matrix in `MobilePermissions.md`), then the native module fires `ACTION_PICK` (the legacy gallery — a real `content://media` URI, **not** the redacting Photo Picker), copies each pick's **original unredacted bytes** to app cache, and reads GPS + capture time from the cached file. GPS comes back attached.
   - **iOS:** `launchImageLibrary` (`react-native-image-picker`, multi-select) opens PHPicker permission-free; GPS is read per pick via `readGpsFromExif(asset.uri)`.
3. `partitionByGps` splits the returned assets: valid coordinates → imported via `addImages` (`type: 'gallery'`, `uploaded: false`); the rest → `skipped`.
4. Imported picks land in `imagesArray` and **persist** across restarts (redux-persist). On Android the `file://` cache copy keeps the URI stable and uploadable after a restart. They appear in the queue immediately.
5. **Non-geotagged picks** populate `noGpsPicks` → rendered by `NoGpsPicksCard` ("No location found", thumbnails + a **Use OLM Camera** action). They are **not** added to the queue. Dismiss clears the card.
6. **Tap a queue tile** (not in delete mode) → `handleTapInboxPhoto` jumps the swiper to that photo's index in `imagesArray` and navigates to `ADD_TAGS`.
7. After tagging, the upload flow runs from HomeScreen; an uploaded photo (`uploaded: true`) drops out of `selectInboxPhotos` automatically.
8. **Delete mode** (inbox header) → select tiles → `handleDeleteSelected` removes each via `deleteImage(photo.id)`.

## Visual indicators
- **Tag badge**: top-left, when the photo was tagged this session (`taggedUris`).
- **Camera badge**: bottom-left, for in-app camera captures (`fromCamera`, i.e. `type !== 'gallery'`).
- **Selection**: checkmark badge + overlay in delete mode.

(No "greyed out / no pin" non-geotagged state — the queue is geotagged-only, so every tile is mappable.)

## Empty / states
- **Empty queue** → the primary first-run call to action (`InboxEmpty`): an images icon, "Add your litter photos to start tagging", a one-line explainer, and the **Add Photos** button.
- **Non-geotagged pick(s)** → `NoGpsPicksCard` above the inbox controls ("No location found", thumbnails + **Use OLM Camera**). Dismissible.

## Inbox photo shape (`selectInboxPhotos`)
Each entry is a projection of an `imagesArray` item:
```
{ id, uri, date, lat, lon, hasGps: true, fromCamera: boolean }
```
- `hasGps` is always `true` (the queue is geotagged-only).
- `fromCamera` is `img.type !== 'gallery'` (camera capture vs. gallery import).

## GPS detection (gallery imports)
- **Android (native MediaStore):** the system Photo Picker redacts GPS EXIF
  unconditionally (it ignores `ACCESS_MEDIA_LOCATION` + `setRequireOriginal()` —
  Google issue 243294058), so the app uses `ACTION_PICK` instead. Holding
  `READ_MEDIA_IMAGES` lets the app read the **original, unredacted** file; the
  native module copies those bytes to cache and reads GPS from the copy. The
  cache copy is load-bearing (stable + uploadable URI); `setRequireOriginal` is
  kept only as a belt-and-suspenders fallback. Because the app reads the original
  MediaStore file (no RNIP JPEG transcode), **HEIC picks retain GPS** on this path —
  resolving the earlier "Android HEIC transcode strips EXIF" issue.
- **iOS (system picker):** `react-native-image-picker` doesn't return GPS, so each
  pick's EXIF is read via `readGpsFromExif()` and validated with `isValidGpsCoords`.

> Separate, still-open: HEIC **upload format** — the app uploads raw HEIC mislabeled
> `image/jpeg` (a different issue from GPS; tracked for a post-release fix).

## Permissions
- **Android:** media access is requested **before** import — `READ_MEDIA_IMAGES` +
  `ACCESS_MEDIA_LOCATION` on API 33+, `READ_EXTERNAL_STORAGE` + `ACCESS_MEDIA_LOCATION`
  on 29–32, `READ_EXTERNAL_STORAGE` on ≤28. Android 14 "Select photos" partial
  access (`READ_MEDIA_VISUAL_USER_SELECTED`) degrades gracefully. (This reverses the
  v7.10.0 permission-free stance — broad media access was re-allowed by the product
  owner in June 2026.)
- **iOS:** the PHPicker needs **no** runtime permission, but
  `NSPhotoLibraryUsageDescription` must remain in `Info.plist` (static-scan
  requirement). See `MobilePermissions.md`.
