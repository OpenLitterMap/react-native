# Mobile Gallery (the "Your Photos" inbox)

> The to-tag queue on the HomeScreen dashboard: fed by the system photo picker, geotagged-only, tap-to-tag.

## Overview
There is no separate gallery screen and **no camera-roll scan**. The **"Your
Photos"** inbox is a section of the HomeScreen dashboard that renders the
local, **not-yet-uploaded** photos already held in `photos.imagesArray` — the
same persisted array the tagger and uploader use. Photos enter the queue two
ways: **in-app camera captures** and **system photo-picker imports** (no media
permission required). The whole dashboard is one virtualized `FlashList`: the
fixed sections (stats, untagged, the no-GPS card, inbox controls) sit in
`ListHeaderComponent`, and the queue photos are the list `data` (flex-sized
square tiles, even gutters, inset 16px).

## Geotagged-only invariant
`imagesArray` is **geotagged-only**. Every photo in the queue has valid GPS, so
every tile is mappable/uploadable and the tagger can never dead-end on an
un-uploadable photo. Non-geotagged picks **never enter the queue** — they are
surfaced separately in the dismissible no-GPS card (see below). This invariant
is enforced at the import boundary in `HomeScreen.handleSelectMore` and assumed
by `selectInboxPhotos`.

## Files
- `screens/home/HomeScreen.js` — hosts the dashboard FlashList; `handleSelectMore` ("Add Photos" picker import), `handleTapInboxPhoto` (jump the swiper to the tapped photo), `noGpsPicks` state + `NoGpsPicksCard`
- `screens/home/homeComponents/useInbox.js` — inbox state hook (selection set, delete mode); reads `selectInboxPhotos`
- `screens/home/homeComponents/InboxSection.js` — presentational pieces: `InboxThumbnail`, `InboxControls`, `InboxEmpty`, `NoGpsPicksCard`
- `reducers/photos_reducer.js` — `selectInboxPhotos` selector; `addImages` (import), `deleteImage` (remove)
- `utils/gps.js` — `isValidGpsCoords` (rejects null, 0,0)
- `utils/readGpsFromExif.js` — EXIF GPS read for picker imports

## Flow
1. The queue shows `selectInboxPhotos(state)`: local photos with a `uri`, `uploaded === false`, and non-null `lat`, **newest-first**. There is no permission check, no scan, and no date window — it's just the persisted array filtered + sorted.
2. **Add Photos** (inbox header, primary CTA on the empty state) → `launchImageLibrary` (`react-native-image-picker`, multi-select) opens the OS photo picker. No permission prompt — the picker hands back only the photos the user picks.
3. For each picked asset, `handleSelectMore` reads GPS via `readGpsFromExif(asset.uri)` (RNIP doesn't return GPS). Picks with valid coordinates are imported via `addImages` (`type: 'gallery'`, `uploaded: false`); picks without GPS go to `skipped`.
4. Imported picks land in `imagesArray` and **persist** across restarts (redux-persist). They appear in the queue immediately.
5. **Non-geotagged picks** populate `noGpsPicks` → rendered by `NoGpsPicksCard` (one dismissible row per pick: thumbnail + filename + "No location data"). They are **not** added to the queue. Dismiss clears the card.
6. **Tap a queue tile** (not in delete mode) → `handleTapInboxPhoto` jumps the swiper to that photo's index in `imagesArray` (it's already there) and navigates to `ADD_TAGS`. Tapping does **not** auto-navigate on import — the user taps a tile to tag.
7. After tagging, the upload flow runs on HomeScreen focus; an uploaded photo (`uploaded: true`) drops out of `selectInboxPhotos` automatically — tagging → upload clears the queue.
8. **Delete mode** (inbox header) → select tiles → `handleDeleteSelected` removes each via `deleteImage(photo.id)`.

## Visual indicators
- **Tag badge**: top-left, when the photo was tagged this session (`taggedUris`).
- **Camera badge**: bottom-left, for in-app camera captures (`fromCamera`, i.e. `type !== 'gallery'`).
- **Selection**: checkmark badge + overlay in delete mode.

(No "greyed out / no pin" non-geotagged state any more — the queue is geotagged-only, so every tile is mappable.)

## Empty / states
- **Empty queue** → the primary first-run call to action (`InboxEmpty`): an images icon, "Add your litter photos to start tagging", a one-line explainer ("Choose litter photos from your gallery — only the photos you pick are uploaded."), and the **Add Photos** button. This is the main entry point, not a fallback.
- **Non-geotagged pick(s)** → `NoGpsPicksCard` above the inbox controls ("Couldn't add — no location data", per-photo rows). Dismissible.

## Inbox photo shape (`selectInboxPhotos`)
Each entry is a projection of an `imagesArray` item:
```
{ id, uri, date, lat, lon, hasGps: true, fromCamera: boolean }
```
- `hasGps` is always `true` (the queue is geotagged-only).
- `fromCamera` is `img.type !== 'gallery'` (camera capture vs. picker import).

## GPS detection (picker imports)
`react-native-image-picker` does not return GPS, so `handleSelectMore` reads each
pick's EXIF via `readGpsFromExif()` and validates with `isValidGpsCoords`. Only
valid-GPS picks are imported; the rest go to the no-GPS card. On Android,
`ACCESS_MEDIA_LOCATION` (not a flagged permission) lets the EXIF read return
unredacted coordinates.

**Known issue — Android HEIC picks lose GPS (v7.10.0, unreleased).** On Android a
*decodable* HEIC/HEIF pick is re-encoded to JPEG by `react-native-image-picker`
*before* the app sees it, and that transcode **strips EXIF** (GPS + capture date).
`readGpsFromExif` then reads the stripped file → no GPS → the photo lands in the
no-GPS card with a misleading "no location data" message even though it had a
location. `ACCESS_MEDIA_LOCATION` doesn't help (the read targets the stripped
transcode, not the original). iOS picks pass HEIC through untouched, so GPS survives
there; an exotic/undecodable Android HEIC also keeps GPS (no transcode runs). Tracked,
with the `assetRepresentationMode: 'current'` fast-follow, in
`docs/superpowers/photo-picker-followups.md`.

## Permissions
The photo picker needs **no** media/library permission on either platform
(Android Photo Picker / iOS PHPicker). See `MobilePermissions.md`. The only
photo-adjacent permission is Android `ACCESS_MEDIA_LOCATION`, kept for reading
GPS EXIF from picked photos.
