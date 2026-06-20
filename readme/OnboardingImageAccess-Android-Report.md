# Onboarding & Image Access — Android Technical Report

**Audience:** Product Manager
**App:** OpenLitterMap v7.11.1 · React Native 0.84.1
**Android:** `minSdk 24` (Android 7) · `compileSdk` / `targetSdk 36` (Android 16)
**Date:** 2026-06-14
**Scope:** How the onboarding tutorial works, how the app accesses images, and an Android-specific assessment of whether picked photos keep their GPS.

---

## 1. Executive summary

- The app gives the user **two ways to add a photo**: take one with the **in-app camera** (`react-native-vision-camera`), or pick an existing one with the **system photo picker** (`react-native-image-picker` → Android Photo Picker). **It does not use a generic file picker.**
- **Every photo must be geotagged** (have GPS coordinates). The app enforces this; a photo with no GPS is rejected and never enters the upload queue.
- The **camera path** is the reliable GPS path on Android — the app writes the file and embeds location itself.
- The **gallery (picker) path carries a known, still-unverified Android risk**: it is technically uncertain whether GPS metadata survives the Android Photo Picker. If it does not, **every picked photo on Android falls into the "no location data" rejection screen**, making the gallery path effectively unusable on Android and funnelling all users to the camera. This is flagged in the engineering backlog as an open release blocker and **needs a physical-device test to settle.** See §5.
- The onboarding tutorial is an 8-screen guided flow ending in the user's first real upload. It is skippable at every step.

---

## 2. Onboarding tutorial — flow

Onboarding shows once per user after sign-up. Completion is stored **per-user** in local storage (`@olm_onboarding_completed_<userId>`); a server-side "web onboarding done" flag also satisfies it. The user can **Skip** on every screen.

Navigator: `routes/OnboardingStack.js` (native-stack, gestures disabled).

| # | Screen | What the user sees / does |
|---|--------|---------------------------|
| 1 | **Welcome** (`OnboardingWelcomeScreen`) | "Welcome!" + the first challenge ("record 1 piece of litter and upload it"). Buttons: **Begin Tutorial** / **Skip**. |
| 2 | **Instructions** (`OnboardingInstructionsScreen`) | **GPS-setup instructions, platform-specific.** On Android: *"Enable location on your camera"* — step-by-step to turn on GPS/location tags **in the phone's Camera app** (and OS Location). Shown as a pre-step (the 1‑2‑3 indicator is visible but inactive). Button: **Continue Tutorial**. |
| 3 | **Choose path** (`ChoosePathScreen`) | Two equal options: **Take a photo now** (camera) or **Choose from photos** (gallery/picker). Step 1 of the tutorial begins here. |
| 4 | **Permission** (`OnboardingPermissionScreen`) | **Camera path only.** Requests **Location first, then Camera** (location is required or camera photos are useless). Handles denied/blocked with recovery screens and an "Open Settings" path. **The gallery path skips this screen entirely** — the picker needs no permission. |
| 5 | **Photo (gallery)** (`OnboardingPhotoScreen`) | "Select a Geotagged Photo" → opens the **system photo picker**. Reads GPS from the file's EXIF. No GPS → rejection screen (offers camera / pick another / skip). |
| 6 | **Camera** (`OnboardingCameraScreen`) | In-app camera capture. No GPS → "Photo captured without GPS" recovery. |
| 7 | **Tag** (`OnboardingTagScreen`) | Guided tagging with 3 coach-mark tooltips, quick chips, search, "Picked up?" toggle. **Done** → "Upload now / Upload later". *Upload now* performs a real two-step upload (binary → tags). |
| 8 | **Celebration** (`CelebrationScreen`) | Success screen; marks onboarding complete. |

The Instructions screen (Android copy) tells the user to enable geotagging **in their camera app** — note this only helps **photos they take afterward**, not photos already in their library. This matters for the gallery path (see §5).

---

## 3. How the app accesses images

There are exactly **two acquisition paths**. Both are also used outside onboarding on the Home screen (camera FAB + "Add Photos"). **No `DocumentPicker` / file-browser / storage-access-framework is used anywhere.**

### 3a. Gallery path — system photo picker (NOT a file picker)

- Library: **`react-native-image-picker` v8.2.1**, called via `launchImageLibrary({ mediaType: 'photo', selectionLimit, quality: 1 })`.
- On Android 13+ this maps to the **Android Photo Picker** (`PickVisualMedia` / `PickMultipleVisualMedia`) — Google's privacy-preserving picker. Confirmed in code (Home's multi-select comment: `selectionLimit: 0 // PickMultipleVisualMedia`).
- **Permission-free**: it does **not** request `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, or any storage/photo permission, and shows no runtime prompt. The user picks specific photos; the app gets a temporary grant to only those.
- **`includeExtra` is deliberately NOT set** (it would tie the picker back to library permissions). Consequence: **RNIP returns no GPS and no capture time** — the app must extract them itself.
- GPS extraction: **`utils/readGpsFromExif.js`** reads the file's EXIF using **`@lodev09/react-native-exify` v1.0.3**, which calls `MediaStore.setRequireOriginal()` on Android 10+ to request unredacted EXIF. 5-second timeout guard.
- Outcome: valid GPS → photo enters the queue / advances to tagging; no GPS → the dismissible "no location data" path.

### 3b. Camera path — in-app capture

- Library: **`react-native-vision-camera` v4.7.3** (`screens/camera/CameraCapture.js`), `<Camera photo enableLocation={true}>`.
- Requires **Camera + Location** runtime permissions (requested in onboarding's Permission screen, location first).
- GPS source: `photo.metadata['{GPS}']` (iOS) with an **EXIF fallback via the same `readGpsFromExif`** (covers Android). Because the app creates the file in its own storage, **EXIF is unredacted** — no media-location permission issue.
- Preview screen shows the live GPS read; if missing, the photo is rejected.

### GPS validation (both paths)

`utils/gps.js` / `isGeotagged()` reject `null`, non-finite, and `(0,0)` coordinates. A photo without valid GPS **cannot** be uploaded.

---

## 4. Android permissions — declared vs. requested

| Permission | Declared in Manifest | Requested at runtime | Used by |
|------------|----------------------|----------------------|---------|
| `INTERNET` | ✅ | n/a | API |
| `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` | ✅ | ✅ (camera path) | Camera GPS |
| `CAMERA` | ✅ | ✅ (camera path) | Camera |
| `ACCESS_MEDIA_LOCATION` | ✅ | ❌ **never requested** | Intended: unredacted GPS EXIF from picked photos |
| `READ_MEDIA_IMAGES` / storage | ❌ | ❌ | Not used (photo picker is permission-free) |

The mismatch on the last two rows is the heart of the Android risk in §5.

---

## 5. ⚠️ Android risk: does GPS survive the photo picker?

**This is the one item the PM needs to weigh.** The gallery path's usefulness on Android depends entirely on whether a picked photo's GPS EXIF reaches the app.

**The technical problem:**
1. The Android Photo Picker hands back a **temporary grant to specific photos**; the app never holds a broad media-read permission.
2. Since **Android 10**, when an app reads media it doesn't own, the OS **strips (redacts) GPS from EXIF by default**.
3. Getting the **original, unredacted** location requires **both** `ACCESS_MEDIA_LOCATION` **and** `MediaStore.setRequireOriginal()`. The exify library does call `setRequireOriginal()`, and the permission is declared.
4. **The open question:** `ACCESS_MEDIA_LOCATION` has historically only taken effect when the app *also* holds a broad media-read permission (`READ_MEDIA_IMAGES`/`READ_EXTERNAL_STORAGE`). Under the permission-free Photo Picker model the app holds **neither**, and it never requests `ACCESS_MEDIA_LOCATION` at runtime. So `setRequireOriginal()` may throw a `SecurityException` and the OS may return **location-redacted** EXIF.

**Tell-tale in the code:** `readGpsFromExif` explicitly swallows `ACCESS_MEDIA_LOCATION` errors (keeps them out of Sentry) — engineering already anticipated this exact failure mode.

**If GPS does NOT survive the picker on Android:**
- `readGpsFromExif` returns `null` for picked photos → they hit the **"This photo doesn't have location data"** screen.
- The gallery path becomes **effectively dead on Android** — every pick is rejected and users are pushed to the camera.
- The Android Instructions screen (enable GPS *in the camera app*) reinforces this: it only helps newly-taken photos, not the existing library the picker reads from.

**Status:** Untested on a physical Android device — tracked as an open release blocker in engineering notes. **It must be verified before relying on the Android gallery path.** It is *not* confirmed broken; it is confirmed *unverified*, and the platform mechanics make it a real risk.

**Recommended verification (fastest path to certainty):**
1. On a physical Android 13/14 device, take a geotagged photo with the stock camera (Location on).
2. In the app, use **Add Photos / Choose from photos** to pick it.
3. Confirm it enters the queue (GPS read) rather than the no-GPS card. Repeat across one Samsung (One UI) and one Pixel (stock) — OEMs differ.

**If it fails, the realistic options are:**
- **A.** Lean on the camera path for Android and de-emphasise / hide "Choose from photos" on Android.
- **B.** Add a fallback that requests `READ_MEDIA_IMAGES` + `ACCESS_MEDIA_LOCATION` (returns to broader photo permissions — this is exactly what the v7.10.0 migration removed to satisfy Play review, so it reopens that compliance question).
- **C.** Accept reduced gallery usefulness on Android and message it clearly.

---

## 6. Minor findings (non-blocking)

- **Dead gallery-permission UI:** `OnboardingPermissionScreen` contains a full "Gallery Access" branch (copy + `gallery_permission.png`), but per the routing the gallery path **routes straight to the picker and never reaches this screen**. The gallery branch is effectively unreachable from onboarding.
- **iOS, for contrast:** the same picker + exify combination is the long-shipped iOS path and is relied upon to work; the Instructions screen additionally nudges iOS users toward "Most Compatible" (JPEG) capture to avoid HEIC. (A separate known issue covers HEIC mislabeling on upload.)

---

## 7. Bottom line for the PM

The onboarding tutorial is complete, polished, skippable, and ends in a genuine first upload. Image access is built on the two modern, privacy-friendly mechanisms (system photo picker + in-app camera), not a file picker — which is the right long-term choice and is what keeps the app compliant with Google Play's photo-permission rules.

The **single open question** is whether the Android Photo Picker preserves GPS. Until that's verified on real devices, **treat the Android camera path as the dependable one and the Android gallery path as at-risk.** A one-hour device test resolves it.
