# Android MediaStore GPS-preserving photo import — implementation spec

**Date:** 2026-06-20 · **Branch:** `fixes/2026/06/android-gps-fixes` · **Device under test:** `R83W50WYDAF` (Galaxy A14, Android 14 / API 34)
**Status:** approved (design + adjustments + gates), JS seam first.

## 1. Problem & root cause (confirmed)

Every OLM photo needs GPS to be mappable; on Android, gallery import is the most common upload failure. The Android **system Photo Picker** (what `react-native-image-picker` uses on API 13+) **redacts GPS EXIF unconditionally** — it ignores `ACCESS_MEDIA_LOCATION` and `MediaStore.setRequireOriginal()` (Google issue 243294058). Normal EXIF (DateTime/Make/Model) survives; only GPS is stripped. This is a platform limitation, not a bug in `readGpsFromExif`/exify. See `readme/OnboardingImageAccess-Android-Report.md`.

**Constraint update (product owner, June 2026):** broad media permissions are acceptable again if they ease the workflow. This supersedes the v7.10.0 permission-free stance.

## 2. Spike result — green light (2026-06-20, on R83W50WYDAF)

With `READ_MEDIA_IMAGES` + `ACCESS_MEDIA_LOCATION` granted, an `ACTION_PICK` MediaStore URI (`content://media/external/images/media/...`, authority `media`, **not** `/picker/`) returned **unredacted GPS on both reads**:

```
[plain]              RESULT: ✅ GPS PRESENT  lat=51.888058 lon=-8.484974
[setRequireOriginal] RESULT: ✅ GPS PRESENT  lat=51.888058 lon=-8.484974
```

**Key learning:** under full media access the *plain* read is already un-redacted. `setRequireOriginal` is **belt-and-suspenders**, not the load-bearing mechanism. **The load-bearing piece is holding `READ_MEDIA_IMAGES` + the cache copy of the original bytes.**

## 3. Scope

- Replace **only the Android gallery-import acquisition**. Two call sites: `HomeScreen.handleSelectMore` (multi-select) and `OnboardingPhotoScreen.openPicker` (single-select).
- **iOS is not touched** — it keeps `launchImageLibrary` + per-asset `readGpsFromExif`. (Extracting that path verbatim into a shared util is behaviour-preserving and allowed; the iOS *outcome* must not change.)
- OLM camera path untouched (already self-stamps GPS via VisionCamera `enableLocation`).

## 4. Architecture

### 4a. Native module (Kotlin, legacy `ReactPackage` — works under New Arch via interop, like RNIP/exify)

Package dir `android/app/src/main/java/com/openlittermap/`, package name `com.geotech.openlittermap`. Three single-purpose units:

- **`OlmGalleryModule`** — RN bridge. One method `pick(options: ReadableMap): Promise<Asset[]>` where `options = { selectionLimit: Int }`. Fires `Intent.ACTION_PICK` on `MediaStore.Images.Media.EXTERNAL_CONTENT_URI` (+ `EXTRA_ALLOW_MULTIPLE` when `selectionLimit !== 1`) via `ActivityEventListener` + `currentActivity.startActivityForResult(...)`. On result, builds and resolves `Asset[]`.
- **`MediaCopier`** — copies a picked `content://` URI's `InputStream` once into `cacheDir/olm_import/<unique>.jpg`, returns a `file://` path. **Single open per photo.** This is what makes the URI stable (the picker grant is temporary; `imagesArray` persists across restarts; upload reads `img.uri` as a file binary).
- **`GpsExifReader`** — reads GPS from the **cached file on disk** (not by re-opening the content URI). Uses framework `ExifInterface`. `setRequireOriginal` is only relevant to content URIs; since we read the local copy, GPS is already present from the full-access copy. (Belt-and-suspenders only.)

**Per-photo flow:** pick → copy bytes once to cache → read EXIF GPS + capture time from the cached file → query MediaStore cursor for display name / size / dimensions / mime → emit `Asset`.

- **`OlmGalleryPackage`** — registers the module; added in `MainApplication.kt` `getPackages()` via `add(OlmGalleryPackage())`.

### 4b. Asset contract (native → JS, one entry per pick)

```ts
{
  uri: string,            // file:// to the cached copy (stable, uploadable, restart-safe)
  fileName: string,       // MediaStore DISPLAY_NAME, or generated fallback
  type: string,           // mime, e.g. 'image/jpeg'
  width: number,          // MediaStore WIDTH
  height: number,         // MediaStore HEIGHT
  fileSize: number,       // bytes
  latitude: number | null,  // null when the photo genuinely has no EXIF GPS
  longitude: number | null,
  takenAt: number | null,   // epoch seconds from EXIF DateTimeOriginal; consumed as photo `date` on HomeScreen
  source: 'mediastore'      // provenance, for debug/telemetry
}
```

Non-geotagged picks are returned with `latitude/longitude: null` so the JS layer can route them to the no-GPS card. `takenAt` is **wired** (HomeScreen `date: meta.takenAt ?? now`), not dropped.

### 4c. Permissions (JS-side, via `react-native-permissions@5.5.1`, requested before `pick()`)

| API | Request |
|-----|---------|
| 33+ | `READ_MEDIA_IMAGES` + `ACCESS_MEDIA_LOCATION` |
| 29–32 | `READ_EXTERNAL_STORAGE` + `ACCESS_MEDIA_LOCATION` |
| ≤28 | `READ_EXTERNAL_STORAGE` |

Plain-language rationale copy (spec):
> **Allow photo access** — OpenLitterMap needs your photos so it can import geotagged images and place them on the map.
> **Allow photo location data** — OLM needs the GPS saved inside your photos. Without it, your photos can't be mapped.

Android 14 "Select photos" partial grant (`READ_MEDIA_VISUAL_USER_SELECTED`) degrades gracefully — selected items still read GPS. Full denial → picks fall through to the no-GPS card.

Manifest declarations (formalising the spike scaffolding): `READ_MEDIA_IMAGES`, `READ_MEDIA_VISUAL_USER_SELECTED`, `READ_EXTERNAL_STORAGE` (`maxSdkVersion="32"`), alongside the existing `ACCESS_MEDIA_LOCATION`.

### 4d. JS seam (the glue to TDD first)

`utils/pickGeotaggedPhotos.js`:

- **`pickGeotaggedPhotos({ selectionLimit, onProgress, isCancelled }): Promise<Asset[]>`** — platform dispatch.
  - **Android:** permission gate → `NativeModules.OlmGallery.pick({ selectionLimit })` → returns `Asset[]` (GPS already attached natively; no JS EXIF loop, no progress needed — the native call is one round-trip).
  - **iOS:** existing `launchImageLibrary` + bounded-concurrency `readGpsFromExif` loop with `onProgress`/`isCancelled` (behaviour-preserving relocation of today's HomeScreen logic). Returns the same `Asset` shape.
- **`partitionByGps(assets): { imported, skipped }`** — pure function; `imported` = assets passing `isValidGpsCoords(lat, lon)`, `skipped` = the rest. Used by both call sites.

Call sites become thin:
- **HomeScreen:** `const assets = await pickGeotaggedPhotos({selectionLimit: 0, onProgress, isCancelled})` → `partitionByGps` → map `imported` to photo objects + `addImages`, `setNoGpsPicks(skipped)`.
- **OnboardingPhotoScreen:** `pickGeotaggedPhotos({selectionLimit: 1})` → `partitionByGps` → first imported → `addOnboardingPhoto`, else no-GPS screen.

### 4e. No-GPS card

Update HomeScreen `NoGpsPicksCard` and OnboardingPhotoScreen no-GPS screen to the spec copy + a **Use OLM Camera** action:
> **No location found** — This photo has no GPS, so it can't be placed on the map. Try another photo, or take a new one with the **OLM Camera**.

English-literal i18n keys (matches the codebase); `fallbackLng: 'en'` guarantees missing translations render English, never a raw `gps.noLocation.title`-style key. Full 8-language translation is a fast-follow (spec defers i18n).

## 5. Adjustments incorporated (from review)

1. **`setRequireOriginal` = belt-and-suspenders**, not load-bearing. Architecture depends on `READ_MEDIA_IMAGES` + the cache copy.
2. **Single open per photo** — copy once, then read EXIF from the cached file on disk. No second stream-open per pick.
3. **`takenAt` wired** — it *is* consumed (HomeScreen upload `date`); kept and consumed, not carried unused.
4. **i18n fallback** — English-literal keys + `fallbackLng: 'en'`; a half-done translation pass renders English, never a raw key.

## 6. Order of work

1. **TDD the JS seam** — `partitionByGps` (pure) + `pickGeotaggedPhotos` platform dispatch (mocked `NativeModules`/`Platform`/`launchImageLibrary`/`readGpsFromExif`). Add the minimal Jest harness (jest is configured; no tests exist yet).
2. **Native module** — `MediaCopier`, `GpsExifReader`, `OlmGalleryModule`, `OlmGalleryPackage`; register in `MainApplication`; finalise manifest permissions.
3. **Wire call sites** — HomeScreen + OnboardingPhotoScreen through the seam; update the no-GPS card copy/action.
4. **Device QA matrix** on R83W50WYDAF (below). **Do not remove the spike until QA passes.**

## 7. Multi-select ship gate (explicit — not a QA note)

Gallery import is the primary flow, so `ACTION_PICK` returning only the first item on Samsung Gallery is a silent degradation of the main workflow.

- During QA, **select 3+ photos**. If fewer than selected come back, the fast path has **failed** its primary requirement.
- **Pass:** multi-select returns all picked items → ship `ACTION_PICK`.
- **Fail:** build the **custom MediaStore `FlatList` grid** (deferred robust path) before shipping. **Do not ship a single-select primary import.**

## 8. Ship gate (all must pass)

- [ ] Geotagged local photo imports with valid GPS.
- [ ] Multi-select returns **all** selected items (§7 gate).
- [ ] Non-geotagged photos / screenshots / downloads still fail to the no-GPS card.
- [ ] Picked URIs survive an app restart — import, force-quit, confirm the queued photo still uploads (validates the `file://` cache copy).
- [ ] OLM camera still passes validation.
- [ ] iOS unchanged.
- [ ] Spike (`GpsSpikeActivity.kt` + manifest entry), `[GPS Debug]` logs, and scaffolding comments removed.

## 9. QA matrix (on R83W50WYDAF)

| Source | Expected |
|--------|----------|
| Local camera JPEG **with** GPS (exiftool-verified) | Pass |
| Local camera JPEG **without** GPS | Fail → no-GPS card |
| Screenshot / downloaded image | Fail → no-GPS card |
| In-app OLM camera photo | Pass |
| Cloud-backed (Google Photos) geotagged | May fail — documented, not depended on |
| **3+ multi-select, all geotagged** | **All return (ship gate)** |

## 10. Out of scope / deferred

OEM tutorial table, cloud-photo testing, accuracy gate (no data source), onboarding changes beyond the no-GPS copy, full i18n translation, SAF `ACTION_OPEN_DOCUMENT` (fallback only if MediaStore fails), custom grid (only if §7 fails), version bump / BOOP (release step, on request).
