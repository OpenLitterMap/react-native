# Mobile Gallery
> OpenLitterMap React Native v7.0

## Overview
The gallery system handles photo selection from the device's camera roll. Users browse albums and select photos for upload. All photos are displayed (not just geotagged), with visual indicators distinguishing GPS-enabled photos from those without GPS data. Only geotagged photos can be selected for upload.

## Files
- `screens/gallery/GalleryScreen.js` — Photo picker grid with selection, empty state, GPS warning banner
- `screens/gallery/galleryComponents/AnimatedImage.js` — Image tile with GPS/selection visual treatment
- `reducers/gallery_reducer.js` — CameraRoll photo fetching with cursor-based pagination, GPS detection
- `utils/isGeotagged.js` — Check if an image has valid GPS coordinates (rejects null, 0,0)
- `utils/permissions/cameraRollPermission.js` — Photo library + ACCESS_MEDIA_LOCATION permission handling

## Flow
1. HomeScreen checks gallery permission on mount
2. If granted, `getPhotosFromCameraroll()` fetches recent photos
3. Each photo is tagged with a `hasGps` boolean based on its location metadata
4. User taps gallery FAB → navigates to `ALBUM` route (GalleryScreen)
5. All photos displayed — non-geotagged shown at reduced opacity with red location-off icon
6. Non-geotagged photos cannot be selected (tap shows toast on Android)
7. User selects geotagged photos → dispatches `addImages` with image metadata
8. Selected images appear in HomeScreen's `UploadImagesGrid`

## Visual Indicators
- **Geotagged photo**: Full opacity, pin emoji overlay
- **Selected photo**: Checkmark overlay + accent border
- **Non-geotagged photo**: 0.4 opacity + red crossed-out location icon, not selectable
- **GPS warning banner**: Shown when `nonGeotaggedCount > 0`, explains why some photos are dimmed
- **Selection badge**: Count badge next to "Next" button showing number of selected photos

## Empty State
When no photos are available, GalleryScreen shows:
- Loading spinner while `imagesLoading` is true
- Icon + "No geotagged photos found" message with explanation
- Count of non-geotagged photos found (if any)

## Permission Handling
- iOS: `PERMISSIONS.IOS.PHOTO_LIBRARY`
- Android 13+: `PERMISSIONS.ANDROID.READ_MEDIA_IMAGES` + `PERMISSIONS.ANDROID.ACCESS_MEDIA_LOCATION`
- Android 12-: `PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE`

## Redux State (`state.gallery`)
```
{
    imagesLoading: boolean,          // True while fetching from CameraRoll
    galleryImages: array,            // All photos from CameraRoll (each has hasGps boolean)
    nextGalleryId: number,           // Auto-incrementing ID for new photos
    camerarollImageFetched: boolean, // Whether initial fetch has completed
    lastFetchTime: number | null,    // Timestamp of last fetch (for TIME-based fetches)
    isNextPageAvailable: boolean,    // Whether more pages exist
    lastImageCursor: string | null,  // Pagination cursor for next batch
    error: string | null             // Error message from last fetch
}
```

**Derived selectors:**
- `selectNonGeotaggedCount(state)` — count of photos without GPS (computed, not stored)

## GPS Detection
Each photo from CameraRoll is checked for GPS data:
- `node.location` must exist with non-null, non-zero `latitude` and `longitude`
- Photos meeting criteria get `hasGps: true` with `lat`/`lon` values
- Photos failing get `hasGps: false` with `lat: null, lon: null`
- **Android EXIF fallback**: When CameraRoll returns no GPS on Android, `readGpsFromExif()` attempts EXIF extraction in batches of 10
- `__DEV__` debug logging outputs platform, fetch type, and GPS counts

## Pagination Strategies
The gallery fetches photos using four strategies:
- `INITIAL`: First load — 40 photos
- `TIME`: After initial — up to 1000 photos added since `lastFetchTime`
- `LOAD`: Scroll pagination — 20 photos per page
- `REFRESH`: Full re-fetch (used after iOS limited permission changes)

## Additional Features
- **Swipe gesture selection**: Multi-select via pan gesture handler across the grid
- **Date-based grouping**: Photos grouped into "today", "this week", "this month", then by month/year
- **iOS limited photo picker**: "Select More Photos" button shown when access is limited
