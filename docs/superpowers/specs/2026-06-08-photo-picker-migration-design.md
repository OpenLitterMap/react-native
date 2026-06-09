# Design: Migrate off broad photo access → system Photo Picker

**Date:** 2026-06-08
**Status:** Design approved; PM spec review folded in (2026-06-09) — pending final spec sign-off → implementation plan
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
2. On a real Android device — **test both Android 13 and 14**; picker redaction
   behaviour differs across versions — pick a known-geotagged photo via "Add Photos".
3. Read GPS at **two points** to localise where (if anywhere) location is lost:
   - **(a) RNIP's returned cache `file://`** — `readGpsFromExif(asset.uri)`. Failure
     here means the picker redacted location *at the copy boundary* (RNIP copied an
     already-redacted stream); no app-side permission can fix that copy.
   - **(b) the original picker `content://`** with `ACCESS_MEDIA_LOCATION` +
     `MediaStore.setRequireOriginal()`. Success here while (a) fails means GPS is
     recoverable only by reading the original URI, not RNIP's cache copy.
4. Confirm the photo imports (no "Missing GPS Data").

This isolates *picker-redaction* (fix = grant read to the item via
`READ_MEDIA_VISUAL_USER_SELECTED` **and** read GPS from the original URI) from a mere
*exify/`setRequireOriginal` path issue* (local fix, no new permission) — so the
fallback chosen below addresses the actual cause rather than being assumed.

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

- "Add Photos" (promoted from "Select More") opens the picker; picks are added to
  `imagesArray` (via the existing `addImages`) instead of navigating straight into
  the tagger. **Multi-select stays on** (`selectionLimit: 0` → RNIP's
  `PickMultipleVisualMedia`, verified in `ImagePickerModuleImpl.java:151-157`).
  Bulk picking is the whole point of the persistent queue; onboarding keeps
  `selectionLimit: 1`.
- The inbox grid renders local photos from `imagesArray` that are not yet
  uploaded — camera captures and picker imports share one queue.
- Tagging → auto-upload (unchanged) removes a photo from the queue.
- The queue persists across restarts (it already does via redux-persist on the
  `photos` key).
- No "Load more"/paging (there is no scan to page). No `dismissedUris` concept
  (that was scan-specific).

#### 3a. Empty state is a primary screen, not a fallback

The auto-scan *was* first-run: a new user saw geotagged photos appear with zero
effort. That magic is gone, so the empty state now **carries onboarding** — the
single biggest UX risk in the migration. A new user opening to a blank grid with no
inviting call to action will read the app as broken, not compliant.

- The current `InboxEmpty` (`InboxSection.js:103-166`) is built **entirely** around
  permission/scan states (`denied`/`blocked` → Grant Access/Open Settings;
  `totalGalleryPhotos === 0` → "choose which photos…"; "no geotagged loaded" →
  Load more). Every branch dies with the scan — `InboxEmpty` is rewritten from
  scratch.
- Replace with one warm, inviting primary state: short headline ("Add your litter
  photos to start tagging"), a supporting line, and a **large, prominent "Add
  Photos" button** as the focal point — not a small header chip — plus a friendly
  icon/illustration. This is the home screen for any user with an empty queue.
- The header "Add Photos" chip remains for when the queue is non-empty.

#### 3b. Non-geotagged picks — graceful, inline, per-photo

A problem the scan never had: the scan pre-filtered to geotagged and greyed out the
rest, so a user *couldn't* pick a GPS-less photo. The system picker can't filter by
GPS — the user can pick anything, and "no location" is only discovered *after* the
pick, on EXIF read. This **will** happen and needs deliberate handling, not a silent
drop or a batch failure.

- Admit GPS-less picks into the queue **greyed out with an explicit "No location
  data" label** (reuse the existing `mutedOverlay`, but add visible text — not just
  a wash). Tapping shows a one-line explainer ("This photo has no GPS data, so it
  can't be mapped — delete it or pick another"). Excluded from auto-upload;
  removable via the existing delete affordance.
- **Drop** the current batch alert in `handleSelectMore` ("N photos skipped (no GPS
  data)") in favour of this per-photo, inline treatment — the user sees exactly
  which picks lack GPS and why.

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
  "Add Photos" affordance; **`InboxEmpty` rewritten** as the primary first-run
  screen (§3a); **`InboxThumbnail` gains an explicit "No location data" label**
  for GPS-less picks (§3b); remove "Load more" / `InboxFooter` paging.
- `screens/home/HomeScreen.js` — `handleSelectMore` routes picks into the queue
  (`addImages`) rather than navigating straight to `ADD_TAGS`; **keeps
  `selectionLimit: 0`** (multi-select); **replaces the batch "N skipped" alert
  with the inline per-photo treatment** (§3b).
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

0. **GPS device-verify** (gating, locked first) — manifest edit + the two-point
   real-device GPS test on Android 13 & 14 (§2).
1. **Compliance** — remove permissions + `@react-native-camera-roll/camera-roll`.
2. **Inbox rework** — queue from `imagesArray`; "Add Photos" primary (multi-select);
   **primary empty-state screen (§3a)**; **non-geotagged inline handling (§3b)**.
3. **Cleanup** — onboarding/permission screens, routes, store/persist, tests.
4. **i18n + docs + BOOP.**

GPS risk is retired before any UX work begins; the three review items (§3a, §3b,
multi-select) land in Phase 2.

## Risks

| Risk | Mitigation |
|------|------------|
| Picker strips GPS without broad permission | Phase 0 device gate isolates the cause (§2); `READ_MEDIA_VISUAL_USER_SELECTED` + read-original fallback |
| First-run lands on a blank grid → reads as broken | Empty state treated as a primary screen with a prominent "Add Photos" CTA (§3a) |
| User picks a GPS-less photo (picker can't pre-filter) | Admit it greyed + "No location data" label, inline explainer, excluded from upload (§3b) — no silent drop / batch-only alert |
| Removing the camera-roll dep breaks an unseen consumer | Grep confirms sole importer is `gallery_reducer.js`; verify at build |
| iOS regression from dropping the scan | Full RNIP/PHPicker path already shipped via onboarding/Select More |
| redux-persist rehydrate error from removed `gallery` key | Drop gallery from persist allowlist; add migration if a versioned persist key exists |

## Success criteria

- Merged Android manifest contains no `READ_MEDIA_IMAGES`/`READ_EXTERNAL_STORAGE`/
  `WRITE_EXTERNAL_STORAGE`.
- Picking a geotagged photo imports with coordinates on a real Android device.
- Home "Your Photos" queue persists picks + captures across restarts; tagging →
  auto-upload clears them.
- A user with an empty queue sees an inviting primary "Add Photos" screen (§3a),
  not a permission/scan-era empty state.
- Picking a GPS-less photo shows a clear per-photo "No location data" state (§3b)
  — no silent drop, no batch-only alert.
- `npm run lint` and `npm test` pass; no dangling references to the deleted
  gallery slice / camera-roll API.
- App builds for iOS and Android.
