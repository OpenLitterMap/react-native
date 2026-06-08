# Mobile Permissions
> Camera, photo-library, and location permission handling across iOS and Android.

## Overview
The app requests camera, photo library, and location permissions using `react-native-permissions`. Platform-specific permission handling covers iOS and Android (including Android 13+ changes). On Android 13+, `ACCESS_MEDIA_LOCATION` is checked at runtime to ensure GPS metadata is accessible from photos.

## Files
- `utils/permissions/index.js` — Barrel exports
- `utils/permissions/cameraPermission.js` — Camera **and location** permission check/request
- `utils/permissions/cameraRollPermission.js` — Photo library permission check/request (includes ACCESS_MEDIA_LOCATION)
- `screens/permission/GalleryPermissionScreen.js` — Gallery permission request UI (post-onboarding fallback when user has revoked access)
- `screens/onboarding/OnboardingPermissionScreen.js` — Onboarding camera + gallery priming screen

## App Store Compliance — Guideline 5.1.1(iv)

Apple rejects any pre-permission priming screen that lets the user dismiss the screen *without* triggering the OS permission prompt. The only forward action on a priming screen MUST call `request()`. Do not add "Not Now", "Skip", "Maybe later", "Take a photo instead", or close (X) buttons to a screen that precedes the OS dialog. If the user has already blocked permission, it is fine to show a separate "Open Settings" screen — that screen runs *after* the OS prompt has been shown and is not subject to the rule.

## Declared Permissions (package.json `reactNativePermissionsIOS`)
- Camera
- LocationAccuracy
- LocationWhenInUse
- PhotoLibrary

## Platform Handling

### Camera Roll
| Platform | Permission | Notes |
|----------|-----------|-------|
| iOS | `PERMISSIONS.IOS.PHOTO_LIBRARY` | GPS metadata accessible with this permission alone |
| Android 13+ (API 33+) | `READ_MEDIA_IMAGES` + `ACCESS_MEDIA_LOCATION` | Both required for GPS data from MediaStore |
| Android 12- | `READ_EXTERNAL_STORAGE` | |

### Android 13+ ACCESS_MEDIA_LOCATION Flow
`checkCameraRollPermission()` on Android 13+:
1. Checks `READ_MEDIA_IMAGES` — if not granted, returns `'denied'`
2. Checks `ACCESS_MEDIA_LOCATION` — if granted, returns `'granted'`
3. If not granted, requests `ACCESS_MEDIA_LOCATION`
4. If request granted, returns `'granted'`
5. If request denied, returns `'limited'` (photos accessible but no GPS metadata)

This ensures the app knows whether GPS data will be available from CameraRoll.

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
1. `useHomeBootstrap` checks gallery permission on mount/focus
2. If denied, navigates to `PERMISSION` stack → appropriate permission screen
3. Permission screen explains why the permission is needed and provides a request button
4. On grant, navigates back to the requesting screen
5. GalleryPermissionScreen also requests `ACCESS_MEDIA_LOCATION` on Android 13+ after gallery access is granted
