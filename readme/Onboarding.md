# Onboarding

7-screen post-signup flow that walks new users through their first litter contribution: take or select a photo, tag it, upload it to the server, and see it on the global map.

## Screen Flow

```
OnboardingWelcomeScreen → ChoosePathScreen → OnboardingPermissionScreen
                                                    │
                                      ┌─────────────┴─────────────┐
                                 Camera path                 Gallery path
                                      │                           │
                             OnboardingCameraScreen      OnboardingPhotoScreen
                                      │                           │
                                      └───────────┬──────────────┘
                                                   │
                                          OnboardingTagScreen
                                          (upload + tag write)
                                                   │
                                          CelebrationScreen
                                          (geolink + XP + sharing)
                                                   │
                                               HomeScreen
```

## Files

| File | Purpose |
|------|---------|
| `routes/OnboardingStack.js` | Navigation stack (gestures disabled, slide_from_right) |
| `screens/onboarding/OnboardingWelcomeScreen.js` | Welcome, GPS setup instructions (platform-detected) |
| `screens/onboarding/ChoosePathScreen.js` | Camera vs gallery path cards, "Skip for now" |
| `screens/onboarding/OnboardingPermissionScreen.js` | Permission state machine (7 states) |
| `screens/onboarding/OnboardingCameraScreen.js` | CameraCapture wrapper, GPS validation |
| `screens/onboarding/OnboardingPhotoScreen.js` | Gallery picker, EXIF GPS read with spinner |
| `screens/onboarding/OnboardingTagScreen.js` | Guided tagging + inline upload + tag submission |
| `screens/onboarding/CelebrationScreen.js` | "You did it!", geolink, XP, sharing tip |
| `screens/onboarding/components/StepIndicator.js` | 3-step progress, `step1Label` prop for camera path |
| `screens/onboarding/components/OnboardingChips.js` | 6 quick-select litter chips |
| `screens/onboarding/components/TooltipOverlay.js` | Non-blocking floating tooltip |
| `utils/onboarding.js` | AsyncStorage persistence, user-scoped keys |
| `screens/camera/CameraCapture.js` | Reusable camera component (shared with HomeScreen) |

## Routing (`routes/MainRoutes.js`)

Three-way conditional render after token validation:

1. `token === null` → AuthStack
2. `token && !onboardingComplete` → OnboardingStack
3. `token && onboardingComplete` → APP (TabRoutes)

**Skip conditions** (either triggers skip):
- AsyncStorage key `@olm_onboarding_completed_{userId}` exists (mobile onboarding done)
- `user.onboarding_completed_at != null` (web onboarding done — synced from backend profile response)

When web onboarding is detected, the mobile AsyncStorage flag is synced so subsequent checks don't re-query. The backend backfill migration sets `onboarding_completed_at = created_at` for all pre-existing users, so no client-side `totalImages` fallback is needed.

**Loading gate:** `isCheckingOnboarding` blocks rendering until the async check finishes, preventing a flash of OnboardingStack for returning users.

**Per-user scoping:** AsyncStorage key format is `@olm_onboarding_completed_{userId}`. Checked on every auth state change.

## Welcome Screen

Intro + illustration + a **GPS setup instructions card** that auto-detects `Platform.OS` and shows only the relevant steps. iOS walks the user to Settings → Privacy → Location Services → Camera = "While Using" (the first step deep-links via `Linking.openURL('app-settings:')`), plus a recommended Camera → Formats → "Most Compatible" tip (saves JPG instead of HEIC). Android points at the Camera app's location-tags toggle. The card notes that enabling location geotags every photo (and how to turn it back off).

## Permission Screen

State machine with 7 states:

| State | Condition | UI |
|-------|-----------|-----|
| `checking` | Mount | Spinner |
| `request` | Not yet asked | Illustration + rationale + "Allow" button |
| `location_denied` | Camera path, location denied | Recovery + "Choose from photos instead" |
| `camera_denied` | Camera path, camera denied | Recovery + "Choose from photos instead" |
| `gallery_denied` | Gallery path, denied | Recovery + "Take a photo instead" |
| `gallery_no_gps` | Android: photos OK but GPS redacted | "Enable Media location in Settings" + camera fallback |
| `blocked` | Permission blocked by OS | "Open Settings" + alternative path |

**Camera path** requests location first (GPS required for scientifically useful data), then camera. **Gallery path** requests photo library access. Both offer cross-path fallback (camera ↔ gallery).

**Android `limited` handling:** On Android 10+, `limited` means `READ_MEDIA_IMAGES` granted but `ACCESS_MEDIA_LOCATION` denied (GPS EXIF is redacted by the OS). The `isGalleryUsable()` helper routes this to `gallery_no_gps` with a Settings link and camera fallback. On iOS, `limited` means user-selected photos with GPS intact — treated as usable.

AppState listener rechecks permissions when user returns from Settings.

## GPS Strategy

GPS is a **non-negotiable requirement** — photos without coordinates cannot be uploaded.

### Camera Path
1. `OnboardingPermissionScreen` requests `LOCATION_WHEN_IN_USE` (iOS) / `ACCESS_FINE_LOCATION` (Android) FIRST. If denied, camera path is blocked.
2. `CameraCapture` component has `enableLocation={true}` on the VisionCamera `<Camera>` — embeds GPS via CoreLocation (iOS) / FusedLocationProvider (Android).
3. After `takePhoto()`, GPS is read from `photo.metadata['{GPS}']` (iOS) with `readGpsFromExif()` fallback (Android).
4. `OnboardingCameraScreen` validates via `isValidGpsCoords()` before accepting. If null/invalid → "Photo captured without GPS" recovery.

### Gallery Path
1. `OnboardingPermissionScreen` requests `PHOTO_LIBRARY` (iOS) / `READ_MEDIA_IMAGES` + `ACCESS_MEDIA_LOCATION` (Android).
2. `readGpsFromExif()` reads GPS from selected photo's EXIF data (5s timeout, spinner shown).
3. If EXIF GPS is null → "This photo doesn't have location data" recovery.

### Coordinate Precision
Native sources provide 6-8 decimal places. Passed as raw `number` values to the backend. The backend's geocoding and clustering work best with 6+ decimal places.

## Camera Capture (`screens/camera/CameraCapture.js`)

Reusable camera component shared by onboarding and HomeScreen. Uses `react-native-vision-camera` (v4+) with `enableLocation={true}` to embed GPS (iOS metadata, EXIF fallback on Android). A preview step shows the photo with its GPS coordinates (or "No GPS data" in red) and Use / Retake / Delete actions. Battery-aware: the camera deactivates when the app is backgrounded, loses focus, or is previewing. All strings are localised.

## Camera Screen (Onboarding)

Wraps `CameraCapture`. Step indicator shows **"Take photo"** (not "Import image") via `step1Label` prop. Light background (`#f0faf4`) on the step indicator bar for readability over the dark camera viewfinder.

Hint text: "Get close to some litter and capture the object in full view"

Validates GPS before accepting. "Photo captured without GPS" recovery with retry, gallery fallback, and "Skip for now".

## Photo Screen

Opens system gallery picker via `react-native-image-picker`. Shows "Reading photo location..." spinner during EXIF read. No-GPS recovery with camera fallback. "Skip for now" link on GPS failure.

## Tag Screen

Reuses `useTagDraft` hook from AddTagScreen. Light background step indicator bar.

### Features
- **Delete button** — red trash icon in top-right of photo. Removes photo from Redux and navigates back.
- **OnboardingChips** — 6 common items (cigarette butt, bottle, can, wrapper, cup, bag), resolved from tag catalogue by `objectKey` + `categoryKey`
- **TagSearchBar** — Full CLO catalogue search
- **TagPills** — Selected tags as removable pills with quantity
- **Picked_up toggle** — Single Switch, syncs to all tags as they're added
- **Tooltip walkthrough** — 3-step overlay: "What can you see?" → "Great! Add more" → "Tap Done"
- **Tags loading** — Dispatches `fetchAllTags()` on mount if empty. Spinner while loading. Retry button on network failure (reads `fetchStatus`).
- **Custom tag handling** — Pending custom tags committed inline on Done tap. `justAddedCustomTag` merge handles the stale `useReducer` snapshot for custom-tag-only photos.

### Upload on Done

When the user taps Done:

1. Tags committed to Redux via `commitDraftToPhoto` (crash recovery)
2. **Upload overlay** shown (spinner + "Uploading your photo...")
3. `POST /api/v3/upload` — FormData with photo binary, lat, lon, date (unix seconds), device model
4. On success: receives `serverPhotoId` from `response.data.photo_id`
5. **Tag overlay** shown (spinner + "Submitting tags...")
6. `PUT /api/v3/tags` — CLO payload via `buildTagsPayload()` with `serverPhotoId` (via `addTagsToPhoto`; PUT = replace/idempotent)
7. On success: navigate to CelebrationScreen with `{serverPhotoId}` route param
8. **On failure at any step: error overlay with retry. Navigation blocked.**

Both upload AND tag write must succeed before advancing. This is critical because `onboarding_completed_at` is set server-side by `PhotoTagsController::store()` on first tag submission. If the tag write fails and the user reaches celebration, they'd be dumped back into onboarding on next launch.

Done button disabled during upload.

## Celebration Screen

- **"You did it!"** heading
- "Your first contribution is now part of the global litter map. Every tag helps researchers and communities understand pollution."
- **5 XP / earned so far** badge
- **Geolink card** (shown when `serverPhotoId` available):
  - Full URL displayed (selectable), built from `URL` (env-configured via `utils/config.js`):
    ```
    {URL}/global?lat={lat}&lon={lon}&zoom=17.89&load=true&open=true&photo={serverPhotoId}
    ```
  - "Copy link" button — `@react-native-clipboard/clipboard`, shows "Copied" for 2s
  - "Copy this link and share it with anyone. OpenLitterMap is a real-time, open-source global reporting tool."
- **Tip card** — "Take a photo of bags of litter picked up and share the link with your local council!"
- **"Start mapping"** CTA — writes `onboardingComplete` to AsyncStorage + Redux, then MainRoutes swaps to APP. Dispatch in button handler (not useEffect) to prevent navigation race.

## Escape Hatches

"Skip for now" links on:
- ChoosePathScreen (below path selection cards)
- OnboardingCameraScreen (no-GPS recovery state)
- OnboardingPhotoScreen (no-GPS recovery state)

Skipping marks onboarding complete and navigates directly to the main app.

## HomeScreen Integration

After onboarding, camera-captured photos appear in the **"Your Photos"** grid on HomeScreen:
- Unuploaded camera photos from `imagesArray` are prepended to the camera roll grid with a **green camera badge**
- Photos that have been uploaded+tagged are tracked in `state.photos.uploadedUris` and **filtered out** of the grid
- Camera roll photos from the device show the normal GPS location badge

## State Management

**Redux slices used by onboarding:**

| Slice | Usage |
|-------|-------|
| `auth` | `token`, `user`, `onboardingComplete`, `user.onboarding_completed_at` (web sync) |
| `photos` | `imagesArray`, `swiperIndex`, `uploadedUris` — `addOnboardingPhoto` deduplicates by URI, stores date as unix seconds |
| `uploadFlow` | `uploadImage` and `addTagsToPhoto` thunks |
| `tags` | CLO catalogue (`objectEntries`, `entriesByCloId`, `fetchStatus`) |
| `settings` | `deviceModel` (sent with upload) |

**AsyncStorage:** `@olm_onboarding_completed_{userId}` (ISO timestamp), `@olm_onboarding_step_{userId}` (wired but unused).

## API Endpoints

| Endpoint | Method | Screen | Notes |
|----------|--------|--------|-------|
| `/api/tags/all` | GET | OnboardingTagScreen | Cached in AsyncStorage, 7-day TTL |
| `/api/v3/upload` | POST | OnboardingTagScreen | FormData: photo, lat, lon, date (unix seconds), model |
| `/api/v3/tags` | PUT | OnboardingTagScreen | CLO payload via `buildTagsPayload`; PUT = replace/idempotent. XP calculated server-side. |

**Upload date field:** Sent as unix seconds (`Math.floor(Date.now() / 1000)`), matching the backend's `Carbon::createFromTimestamp()` expectation.

**Backend onboarding sync:** The backend sets `onboarding_completed_at` automatically on first tag submission via `PhotoTagsController::store()`. Mobile reads `user.onboarding_completed_at` from the profile response as a skip condition.

## i18n

All user-facing strings wrapped in `t()`. Keys added to all 8 language files (`en`, `ar`, `de`, `es`, `fr`, `ie`, `nl`, `pt`). Non-English files use English placeholders; `fallbackLng: 'en'` handles missing translations.

GPS instruction strings use composable keys (e.g. `'Privacy & Security'`, `'Location Services'`, `'While Using the App'`, `'Most Compatible'`) so individual menu names can be translated independently.

## Remaining Issues

- Step persistence for resume-on-relaunch: `getOnboardingStep`/`setOnboardingStep` helpers exist in `utils/onboarding.js` but are never called. Either wire up or remove.
- Tooltip positioning on small screens not audited on device.
- `LanguageFlags` component exported but not rendered — language selection missing from auth/onboarding. `i18n.js` falls back to hardcoded `'en'` instead of device locale.
- Non-English onboarding translations are English placeholders only.
- CameraCapture `resizeMode="contain"` may show black bars if photo aspect ratio doesn't match screen — acceptable trade-off vs cropping.
