# Mobile Gallery (the "Your Photos" inbox)

> The camera-roll inbox on the HomeScreen dashboard: GPS detection, pagination, and tap-to-tag.

## Overview
There is no separate gallery screen. Camera-roll photos surface in the **"Your
Photos"** inbox, a section of the HomeScreen dashboard. The inbox shows **all**
camera-roll photos newest-first: **non-geotagged photos are greyed out** and
**geotagged photos get a 📍 pin top-right** (only geotagged photos can be
mapped/uploaded). The whole dashboard is one virtualized `FlashList`: the fixed
sections (stats, untagged, banners) sit in `ListHeaderComponent`, and the inbox
photos are the list `data` (flex-sized square tiles, even gutters, inset 16px).

## Files
- `screens/home/HomeScreen.js` — hosts the dashboard FlashList; `handleTapInboxPhoto` (import + tag) and `handleSelectMore` (picker import)
- `screens/home/homeComponents/useInbox.js` — inbox state hook (visible count, selection, load-more)
- `screens/home/homeComponents/InboxSection.js` — presentational pieces: `InboxThumbnail`, `InboxControls`, `InboxEmpty`, `InboxFooter`
- `reducers/gallery_reducer.js` — CameraRoll fetching (cursor pagination), GPS detection, `selectInboxPhotos`
- `utils/isGeotagged.js` — valid-GPS check (rejects null, 0,0)
- `utils/readGpsFromExif.js` — EXIF GPS fallback (Android camera-roll; picker imports)
- `utils/permissions/cameraRollPermission.js` — photo-library + `ACCESS_MEDIA_LOCATION` permission handling

## Flow
1. `useHomeBootstrap` checks gallery permission on mount/focus; if granted, `getPhotosFromCameraroll('INITIAL')` fetches.
2. Each photo gets a `hasGps` boolean from its location metadata (or EXIF on Android).
3. `selectInboxPhotos` returns **all** photos (geotagged or not, minus dismissed), newest-first — **no date window**.
4. `useInbox` shows the first **6** (`INITIAL_VISIBLE`); the grid renders them in a 3-column FlashList — geotagged tiles pinned, non-geotagged greyed.
5. **Load more** reveals **+50** (`LOAD_MORE_STEP`) and pages the camera roll (`LOAD`, 50/page) when more are needed.
6. **Tap a geotagged photo** → `addImages` (the **geotagged** photos only, for swiping) → navigate to `ADD_TAGS`. Non-geotagged tiles are **inert** in tag mode (the thumbnail `Pressable` is `disabled` — tap does nothing) so the tagger never dead-ends on an un-uploadable photo. Non-geotagged tiles stay selectable in **delete mode** (so they can be dismissed).
7. **Select More** (header, right of Delete) → `launchImageLibrary` multi-select → read GPS via EXIF → import geotagged picks via `addImages` → `ADD_TAGS`. Non-geotagged picks are skipped with a "Missing GPS Data" alert. **Dedupe:** the OS picker returns a temp-file uri that differs from the CameraRoll `ph://` uri for the same physical photo, so `addImages` dedupes on `filename` (the stable cross-source key) in addition to uri/id — the same photo can't be imported twice.
8. **Delete mode** → select photos → dismiss (`dismissPhotos` → `dismissedUris`); camera captures are removed via `deleteImage`.

## Visual indicators
- **📍 pin**: top-right of every geotagged (mappable) photo.
- **Greyed out**: non-geotagged photos get a soft grey wash (can't be mapped) and are inert to taps in tag mode.
- **Tag badge**: top-left, when the photo was tagged this session.
- **Camera badge**: bottom-left, for in-app camera captures.
- **Selection**: checkmark badge + overlay in delete mode.

## Empty / states
- No photo permission → grant/settings prompts.
- No camera-roll photos at all → "No photos available yet" + manage-access.
- Photos loaded but none geotagged → "Select Photos To Tag & Upload" + a **Load more photos** button (page further back) when more pages exist.

## Redux state (`state.gallery`)
```
{
    fetchStatus: 'idle' | 'loading' | 'succeeded' | 'failed',
    galleryImages: array,            // CameraRoll photos, each with hasGps
    nextGalleryId: number,           // local id counter (NOT a server id)
    camerarollImageFetched: boolean,
    lastFetchTime: number | null,    // for TIME-based "new since last fetch"
    hasMorePages: boolean,           // more camera-roll pages exist
    nextPageCursor: string | null,   // cursor for the next LOAD page
    dismissedUris: array,            // user-dismissed inbox photos (capped 500, persisted)
    error: string | null
}
```
Selector: `selectInboxPhotos(state)` — all photos, not-dismissed, newest-first.

## GPS detection
- `node.location` must have non-null, non-zero `latitude`/`longitude` → `hasGps: true`.
- **Android EXIF fallback**: when CameraRoll returns no GPS, `readGpsFromExif()` reads EXIF in batches of 10.
- **Picker imports**: `react-native-image-picker` doesn't return GPS, so `handleSelectMore` reads each pick's EXIF; only valid-GPS picks are imported.

## Fetch strategies (`getPhotosFromCameraroll`)
- `INITIAL`: first load — 40 photos
- `TIME`: photos added since `lastFetchTime` — up to 1000 (the App-Hang suspect; see GPS audit)
- `LOAD`: cursor pagination — **50 photos/page** (backs "Load more")
- `REFRESH`: full re-fetch (after iOS limited-permission changes)

## Permissions
Camera-roll access + `ACCESS_MEDIA_LOCATION` (iOS, Android 13+/12-) is documented in `MobilePermissions.md`; the inbox uses `utils/permissions/cameraRollPermission.js`.
