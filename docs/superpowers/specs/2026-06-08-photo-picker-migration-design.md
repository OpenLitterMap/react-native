# Design: Migrate off broad photo access → system Photo Picker

**Date:** 2026-06-08
**Status:** Approved design, pending spec review → implementation plan
**Driver:** Google Play rejection of Android version code 62 (app 7.9.0)

## Problem

Google Play rejected the latest Android release under the **Photo and Video
Permissions policy**:

> Your app cannot make use of the `READ_MEDIA_IMAGES` or `READ_MEDIA_VIDEO`
> permissions because it only needs one-time or infrequent access to a device's
> media files. To use these permissions, your app's core functionality must need
> persistent access to photo and video files… migrate to a system photo picker
> instead.

### Diagnosis

- `android/app/src/main/AndroidManifest.xml` declares `READ_MEDIA_IMAGES`,
  `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, and `ACCESS_MEDIA_LOCATION`.
  All four are declared by **our own** manifest — no library injects the flagged
  ones — so they are removable in one file. (`READ_MEDIA_VIDEO` is not declared;
  Google's notice templates both permissions the policy governs.)
- The flagged permission exists for exactly one feature: the **auto-scan "Your
  Photos" inbox**. `reducers/gallery_reducer.js` calls `CameraRoll.getPhotos()`
  to read the user's *entire* library (40 initial, then paged 1000/50), filtering
  for geotagged shots. That is the broad/persistent-access pattern the policy
  pushes "upload-a-photo" apps away from.
- `@react-native-camera-roll/camera-roll` (the library that performs the scan) is
  imported **only** in `gallery_reducer.js`.
- A **permission-free** path already ships: `react-native-image-picker`
  (`launchImageLibrary`) powers "Select More" (`HomeScreen.js`) and onboarding
  (`OnboardingPhotoScreen.js`). RNIP v8 uses Android's **`PickVisualMedia`**
  (system Photo Picker) and copies each pick to an app-cache `file://` URI;
  EXIF is preserved on copy when `quality:1` / no resize (our settings).
- **Camera capture is unaffected**: it uses `react-native-vision-camera`
  (`screens/camera/CameraCapture.js`) and saves to app storage. There is no
  `CameraRoll.save`/`saveToCameraRoll`, so the flagged permissions feed *only*
  the scan. Removing them does not affect capture.

## Decision

Migrate to the system Photo Picker on **both platforms** and remove broad photo
access. Decisions taken during brainstorming:

| Question | Decision |
|----------|----------|
| Comply vs. appeal vs. hybrid | **Comply** — migrate to picker |
| Platforms | **Both** (full migration, not Android-only hybrid) |
| Does GPS survive the picker? | **Unknown** → on-device verification is gating Phase 0 |
| Inbox model after the scan is gone | **Persistent to-tag queue** driven by `imagesArray` |

## Non-goals / out of scope

- Re-introducing any form of full-library access.
- Changing the camera-capture flow, the tagging flow, or the upload flow.
- Backend changes — none required.
- Submitting the Play Console Photo & Video Permissions Declaration (we are
  removing the permission, so no declaration is needed).

## Detailed design

### 1. Compliance change (the actual fix)

Remove from `android/app/src/main/AndroidManifest.xml`:

- `android.permission.READ_MEDIA_IMAGES`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`

Keep: `INTERNET`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `CAMERA`.
`ACCESS_MEDIA_LOCATION` remains — it is injected by `@lodev09/react-native-exify`'s
own manifest and is **not** a policy-flagged permission. Net result: zero flagged
permissions remain in the merged manifest.

### 2. GPS survival — gating risk (Phase 0, before any other work)

The Android Photo Picker redacts location EXIF by default; un-redacting normally
requires read access to the media (the permission we are removing). RNIP copies
each pick to an app-cache `file://` (EXIF preserved *if the source stream carried
it*). Whether GPS survives is **empirical and version-dependent**, so it is
verified first.

**Verification protocol (must pass before Phase 1+):**

1. Prepare a build with the three permissions removed (Phase 1 manifest edit only).
2. On a real Android device (ideally Android 13 and 14), pick a photo known to be
   geotagged via "Select More".
3. Confirm `readGpsFromExif(asset.uri)` returns valid coordinates and the photo
   imports (no "Missing GPS Data").

**Outcomes:**

- **GPS survives** → proceed with Phases 1–4 as written. Low risk.
- **GPS stripped** → add `READ_MEDIA_VISUAL_USER_SELECTED` ("Selected Photos
  Access", Android 14+). Google permits this permission **without** the
  declaration; it grants temporary read to user-selected items, enabling
  `setRequireOriginal()` + `ACCESS_MEDIA_LOCATION` to recover GPS for those items.
  This is the documented fallback — **not** a re-introduction of broad access.
  (Pre-Android-14 devices: rely on whatever EXIF the picker copy preserves; if a
  pick has no recoverable GPS, the existing "Missing GPS Data" path handles it.)

### 3. Inbox model — persistent to-tag queue

The "Your Photos" grid currently auto-fills from the library scan. With the scan
gone, it is driven by explicit picks held in the **already-persisted**
`photos_reducer.imagesArray`:

- "Add Photos" (promoted from "Select More") opens the picker; geotagged picks
  are added to `imagesArray` (via the existing `addImages`) instead of navigating
  straight into the tagger.
- The inbox grid renders local photos from `imagesArray` that are not yet
  uploaded — camera captures and picker imports share one queue.
- Tagging → auto-upload (unchanged) removes a photo from the queue.
- The queue persists across restarts (it already does via redux-persist on the
  `photos` key).
- No "Load more"/paging (there is no scan to page). No `dismissedUris` concept
  (that was scan-specific).

### 4. Code surface

**Delete:**

- `reducers/gallery_reducer.js` (slice + `getPhotosFromCameraroll` thunk + selectors)
- `utils/permissions/cameraRollPermission.js`
- `screens/permission/GalleryPermissionScreen.js` (and its route registration)
- `@react-native-camera-roll/camera-roll` dependency (package.json + pods)
- `__tests__/reducers/galleryGeotagged.test.js`
- `gallery` slice from `store/index.js` store + persist config; drop any
  `gallery`-key persist migration

**Rework:**

- `screens/home/homeComponents/useInbox.js` — source from `imagesArray`
  (not-yet-uploaded), drop `LOAD`/paging and `getPhotosFromCameraroll`.
- `screens/home/useHomeBootstrap.js` — remove permission check/request + scan
  dispatch on mount/focus/refresh.
- `screens/home/homeComponents/InboxSection.js` — "Select More" → primary
  "Add Photos" affordance; new empty state ("Add photos to start tagging");
  remove "Load more".
- `screens/home/HomeScreen.js` — `handleSelectMore` routes picks into the queue
  (`addImages`) rather than navigating straight to `ADD_TAGS`; keep the
  GPS-read + "Missing GPS Data" handling.
- `screens/onboarding/OnboardingPermissionScreen.js` — drop the gallery-permission
  step (picker needs none); keep camera/location priming.
- `routes/` — remove the `PERMISSION`/gallery permission route if it becomes
  unused (verify camera permission priming, if any, is unaffected).

**Verify untouched:** `screens/camera/CameraCapture.js`, the upload flow,
`__tests__/reducers/photosInbox.test.js` (update if it asserted scan behavior).

### 5. iOS handling

The user chose full migration, so iOS also drops the auto-scan:

- Remove `NSPhotoLibraryUsageDescription` from `ios/openlittermap/Info.plist`
  and `PhotoLibrary` from `reactNativePermissionsIOS` in `package.json` (PHPicker,
  used by RNIP on iOS 14+, needs neither). Keep `NSCameraUsageDescription`,
  `Camera`, and the Location entries.

> **Reversible note:** iOS is not under Google's policy. If preferred, §4/§5 can
> be made Android-only and iOS can keep its current `CameraRoll` scan + limited
> photo access. Flag before implementation if so.

### 6. Supporting changes

- **i18n:** add new strings ("Add Photos", empty-state copy) and remove
  gallery-permission strings across all 8 languages (`assets/langs/*`), kept A–Z.
- **Docs:** rewrite `readme/MobileGallery.md` (no more scan/EXIF-fallback/pagination
  framing → picker-driven queue), update `readme/MobilePermissions.md`,
  `CLAUDE.md` (core flow, slice table −1, file org), and project memory.
- **Version (BOOP):** minor bump suggested → **7.10.0**; Android `versionName`
  7.10.0 + `versionCode` 62 → **63**; iOS `MARKETING_VERSION` 7.10.0 + bump
  `CURRENT_PROJECT_VERSION`; changelog entry.

### 7. Phasing

0. **GPS device-verify** (gating) — manifest edit + real-device GPS test.
1. **Compliance** — remove permissions + `@react-native-camera-roll/camera-roll`.
2. **Inbox rework** — queue from `imagesArray`; "Add Photos" primary.
3. **Cleanup** — onboarding/permission screens, routes, store/persist, tests.
4. **i18n + docs + BOOP.**

GPS risk is retired before any UX work begins.

## Risks

| Risk | Mitigation |
|------|------------|
| Picker strips GPS without broad permission | Phase 0 device gate; `READ_MEDIA_VISUAL_USER_SELECTED` fallback |
| Users expect their library auto-listed | New empty state + prominent "Add Photos"; multi-select keeps batch flow |
| Removing the camera-roll dep breaks an unseen consumer | Grep confirms sole importer is `gallery_reducer.js`; verify at build |
| iOS regression from dropping the scan | Full RNIP/PHPicker path already shipped via onboarding/Select More |
| redux-persist rehydrate error from removed `gallery` key | Drop gallery from persist allowlist; add migration if a versioned persist key exists |

## Success criteria

- Merged Android manifest contains no `READ_MEDIA_IMAGES`/`READ_EXTERNAL_STORAGE`/
  `WRITE_EXTERNAL_STORAGE`.
- Picking a geotagged photo imports with coordinates on a real Android device.
- Home "Your Photos" queue persists picks + captures across restarts; tagging →
  auto-upload clears them.
- `npm run lint` and `npm test` pass; no dangling references to the deleted
  gallery slice / camera-roll API.
- App builds for iOS and Android.
