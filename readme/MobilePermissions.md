# Mobile Permissions
> Camera, location, and (Android) media permission handling across iOS and Android. iOS gallery import stays permission-free (PHPicker); Android requests media access so it can read unredacted GPS from picked photos.

## Overview
The app requests **camera** and **location** permissions via
`react-native-permissions` on both platforms, plus **Android media permissions**
for gallery import:

- **iOS gallery import** uses the system photo picker (PHPicker), which is
  **permission-free at runtime** — the user picks specific photos and the OS
  hands back only those.
- **Android gallery import** uses a native **MediaStore** picker (`ACTION_PICK`),
  because the Android system Photo Picker redacts GPS EXIF. Reading the original,
  unredacted file requires holding a media-read permission, so the app requests
  one (`ensurePhotoPermission`, `utils/permissions/photoPermission.js`) before
  importing. See `MobileGallery.md`.

**Policy history:** the broad Android media permissions were *removed* in v7.10.0
after Google Play rejected them under the Photo & Video Permissions policy (the
whole-library auto-scan was replaced with the system picker). In **v7.11.2 (June
2026)** `READ_MEDIA_IMAGES` was **re-added** — the product owner decided broad
media access is acceptable to make GPS import work, with Play review handled
separately. This reopens the compliance question v7.10.0 closed (the declared use
case is repeated photo selection for upload).

## Files
- `utils/permissions/index.js` — barrel exports
- `utils/permissions/cameraPermission.js` — camera **and location** permission check/request
- `utils/permissions/photoPermission.js` — `ensurePhotoPermission` (Android media permissions via one `requestMultiple`, scaled by API level; iOS no-op). Returns an **AML-aware 3-state status**: `granted` / `location-denied` (media readable but `ACCESS_MEDIA_LOCATION` denied) / `denied`
- `screens/onboarding/OnboardingPermissionScreen.js` — onboarding **camera** priming screen (camera path only; the gallery path goes straight to the picker)

(There is no gallery *priming screen* — on Android the media prompt fires directly
when the user taps **Add Photos**, which is compliant. The old
`cameraRollPermission.js` / `GalleryPermissionScreen.js` / `PERMISSION` route are
still gone.)

## App Store Compliance — Guideline 5.1.1(iv)
Apple rejects any pre-permission priming screen that lets the user dismiss the
screen *without* triggering the OS permission prompt. The only forward action on
a priming screen MUST call `request()`. Do not add "Not Now", "Skip", "Maybe
later", "Take a photo instead", or close (X) buttons to a screen that precedes
the OS dialog. (This applies only to the **camera** priming screen; there is no
gallery priming screen — and iOS gallery import is permission-free anyway.)

## Declared Permissions

### iOS (`package.json` `reactNativePermissionsIOS`)
- Camera
- LocationAccuracy
- LocationWhenInUse

`NSPhotoLibraryUsageDescription` **is required in `Info.plist`** and must not be
removed. PHPicker is permission-free at *runtime* (no prompt is shown for the
normal pick flow), but Apple's *static binary scan* still mandates the purpose
string: `react-native-image-picker` and `@lodev09/react-native-exify` link
PhotoKit symbols (`PHPhotoLibrary`, `PHAsset`), so the App Store rejects the
binary with **ITMS-90683** if the key is absent — regardless of whether those
APIs are ever called. It was wrongly dropped in the v7.10.0 migration and re-added
in the build-89 resubmission after Apple rejected build 88 with ITMS-90683.
`NSCameraUsageDescription` and the location usage strings also remain.

### Android (`AndroidManifest.xml`)
- `INTERNET`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `CAMERA`
- `ACCESS_MEDIA_LOCATION` — un-redacts GPS EXIF on the MediaStore read
- `READ_MEDIA_IMAGES` — media read (API 33+); lets the app read the original geotagged file
- `READ_MEDIA_VISUAL_USER_SELECTED` — Android 14 "Select photos" partial access
- `READ_EXTERNAL_STORAGE` (`maxSdkVersion="32"`) — media read on API ≤32

## Platform Handling

### Photos (gallery import)
| Platform | Permission | Notes |
|----------|-----------|-------|
| iOS | none at runtime | PHPicker returns only picked photos (no prompt), but `NSPhotoLibraryUsageDescription` **must** be in `Info.plist` — Apple static-scan requirement (ITMS-90683) |
| Android | media read, by API level | `ensurePhotoPermission` requests `READ_MEDIA_IMAGES` (33+) or `READ_EXTERNAL_STORAGE` (≤32) + `ACCESS_MEDIA_LOCATION`, before the native MediaStore picker. Android 14 partial access (`READ_MEDIA_VISUAL_USER_SELECTED`) degrades gracefully |

The Android permission matrix lives in `utils/permissions/photoPermission.js`
(unit-tested). iOS GPS is read from EXIF via `utils/readGpsFromExif.js`; Android
GPS is read natively by the MediaStore module. See `MobileGallery.md`.

### Camera
| Platform | Permission |
|----------|-----------|
| iOS | `PERMISSIONS.IOS.CAMERA` |
| Android | `PERMISSIONS.ANDROID.CAMERA` |

### Location
| Platform | Permission |
|----------|-----------|
| iOS | `PERMISSIONS.IOS.LOCATION_WHEN_IN_USE` |
| Android | `PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION` |

## Permission Flow
- **Camera** priming screen (`OnboardingPermissionScreen`) explains why camera +
  location are needed and calls `request()`.
- **Gallery (Android)**: tapping **Add Photos** calls `ensurePhotoPermission`,
  which requests the media read + `READ_MEDIA_VISUAL_USER_SELECTED` +
  `ACCESS_MEDIA_LOCATION` together (no priming screen) and returns a 3-state status.
  **Media denied** → error; **media granted but `ACCESS_MEDIA_LOCATION` denied** →
  "enable photo location" guidance (the photo has GPS the app can't read — *not* the
  no-GPS card); **granted** → the native picker opens. On Android 14 the OS
  auto-grants media location once media read is held, so the denied state is mostly
  an API 29–32 / partial-access / manual-revoke concern.
- **Gallery (iOS)**: navigates straight to the picker — no permission step.
