# Mobile Permissions
> Camera and location permission handling across iOS and Android. The app no longer requests broad photo/media access — the system photo picker needs none.

## Overview
The app requests **camera** and **location** permissions via
`react-native-permissions`. It does **not** request photo-library / media-read
permissions: photos enter via the **system photo picker** (Android Photo Picker
/ iOS PHPicker), which is permission-free — the user picks specific photos and
the OS hands back only those. The only photo-adjacent permission is Android
`ACCESS_MEDIA_LOCATION` (not a Play-policy-flagged permission), kept so the app
can read GPS EXIF from picked photos.

This was a deliberate migration (v7.10.0): the broad Android media permissions
(`READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`) were
rejected under Google Play's Photo & Video Permissions policy, so the
whole-library auto-scan was replaced with the picker. See `MobileGallery.md`.

## Files
- `utils/permissions/index.js` — barrel exports
- `utils/permissions/cameraPermission.js` — camera **and location** permission check/request
- `screens/onboarding/OnboardingPermissionScreen.js` — onboarding **camera** priming screen (camera path only; the gallery path goes straight to the picker, no permission step)

(There is no gallery-permission utility or screen any more — `cameraRollPermission.js`, `screens/permission/GalleryPermissionScreen.js`, and the `PERMISSION` route were removed in the v7.10.0 migration.)

## App Store Compliance — Guideline 5.1.1(iv)
Apple rejects any pre-permission priming screen that lets the user dismiss the
screen *without* triggering the OS permission prompt. The only forward action on
a priming screen MUST call `request()`. Do not add "Not Now", "Skip", "Maybe
later", "Take a photo instead", or close (X) buttons to a screen that precedes
the OS dialog. If the user has already blocked permission, it is fine to show a
separate "Open Settings" screen — that screen runs *after* the OS prompt has
been shown and is not subject to the rule. (This now applies only to the
**camera** priming screen; there is no gallery priming screen.)

## Declared Permissions

### iOS (`package.json` `reactNativePermissionsIOS`)
- Camera
- LocationAccuracy
- LocationWhenInUse

`NSPhotoLibraryUsageDescription` has been **removed** from `Info.plist` — PHPicker
(used by `react-native-image-picker` on iOS) needs no usage description.
`NSCameraUsageDescription` and the location usage strings remain.

### Android (`AndroidManifest.xml`)
- `INTERNET`
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`
- `CAMERA`
- `ACCESS_MEDIA_LOCATION` — **kept** (reads GPS EXIF from picked photos; not Play-policy-flagged)

The flagged media permissions (`READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`,
`WRITE_EXTERNAL_STORAGE`) are **gone**. The Photo Picker requires none of them.

## Platform Handling

### Photos (picker)
| Platform | Permission | Notes |
|----------|-----------|-------|
| iOS | none | PHPicker returns only picked photos; no `NSPhotoLibraryUsageDescription` |
| Android | none | Android Photo Picker; `ACCESS_MEDIA_LOCATION` only, for EXIF GPS |

GPS for picked photos is read from EXIF via `utils/readGpsFromExif.js` (RNIP
doesn't return location). See `MobileGallery.md`.

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
There is no longer a runtime gallery-permission flow. The only priming screen is
the onboarding **camera** screen (`OnboardingPermissionScreen`), which explains
why camera + location are needed and calls `request()`. The gallery onboarding
path navigates straight to the picker screen (`ONBOARDING_PHOTO`) with no
permission step.
