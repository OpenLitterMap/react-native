# AUDIT.md — OpenLitterMap React Native App

**Date:** 2026-03-08
**App Version:** 7.0.0
**React Native Version:** 0.74.3
**Branch:** openlittermap/v7

---

## 1. File Inventory

### Root Config
| File | Purpose |
|------|---------|
| `package.json` | App manifest, dependencies, scripts |
| `app.json` | RN app name config ("openlittermap") |
| `index.js` | Entry point, registers App component |
| `App.tsx` | Root: Redux Provider, PersistGate, NavigationContainer, Sentry |
| `i18n.js` | i18next setup (en, de, nl, fr, es, pt, ar, ie) |
| `tsconfig.json` | Extends @react-native/typescript-config |
| `babel.config.js` | @react-native/babel-preset |
| `metro.config.js` | Default metro config |
| `jest.config.js` | Preset: react-native |
| `.eslintrc.js` | @react-native config, 4-space indent |
| `.prettierrc.js` | Single quotes, no bracket spacing |
| `Gemfile` | Ruby gems for CocoaPods |

### Actions
| File | Purpose |
|------|---------|
| `actions/types.js` | Environment config (react-native-config), endpoint selection |

### Store
| File | Purpose |
|------|---------|
| `store/index.js` | configureStore with redux-persist (whitelist: auth, photos), AsyncStorage, redux-immutable-state-invariant (dev) |

### Reducers (14 slices)
| File | Slice Key | API Calls | Status |
|------|-----------|-----------|--------|
| `reducers/index.js` | Root combiner | 0 | OK |
| `reducers/auth_reducer.js` | `auth` | 5 | Active — Sanctum auth |
| `reducers/gallery_reducer.js` | `gallery` | 1 | CameraRoll fetch, EXIF GPS fallback, derived selectors |
| `reducers/photos_reducer.js` | `photos` | 0 | Active — local images, tagging, swiperIndex (persisted) |
| `reducers/server_photos_reducer.js` | `serverPhotos` | 2 | Active — untagged count, preview, editTagsOnPhoto |
| `reducers/upload_flow_reducer.js` | `uploadFlow` | 2 | Active — upload phase, counters, modal, uploadImage/postTagsToPhoto |
| `reducers/leaderboards_reducer.js` | `leaderboard` | 1 | Active |
| `reducers/locations_reducer.js` | `locations` | 2 | Active |
| `reducers/uploads_reducer.js` | `uploads` | 3 | Active |
| `reducers/settings_reducer.js` | `settings` | 4 | Active |
| `reducers/shared_reducer.js` | `shared` | 1 | Active — appVersion only |
| `reducers/stats_reducer.js` | `stats` | 1 | Active |
| `reducers/tags_reducer.js` | `tags` | 1 | Active, cached 7 days |
| `reducers/team_reducer.js` | `teams` | 8 | Active |

**Removed:** `camera_reducer.js` (unused), `web_reducer.js` (dead code), `litter_reducer.js` (superseded by v5 tagging), `images_reducer.js` (split into photos, serverPhotos, uploadFlow)

### Routes
| File | Purpose |
|------|---------|
| `routes/index.js` | Barrel export for MainRoutes |
| `routes/MainRoutes.js` | Root navigator, auth gating, conditional routing |
| `routes/AuthStack.js` | Welcome → Auth screen stack |
| `routes/TabRoutes.tsx` | Bottom tabs: Home, Team, User Stats (3 tabs — GlobalData and Leaderboards exist but are not wired into any route) |
| `routes/PermissionStack.tsx` | Camera/Gallery permission screens |
| `routes/TeamStack.tsx` | Team screens stack |

**Removed:** `routes/GalleryRoutes.tsx` (defined Gallery→Album stack but never used in MainRoutes)

### Screens
| File | Screen | Status |
|------|--------|--------|
| `screens/home/HomeScreen.js` | Main upload screen | Active |
| `screens/home/homeComponents/ActionButton.js` | FAB button | Active |
| `screens/home/homeComponents/UploadButton.js` | Upload trigger | Active |
| `screens/home/homeComponents/UploadImagesGrid.js` | Image grid | Active |
| `screens/auth/AuthScreen.tsx` | Login/signup/forgot tabs | Active |
| `screens/auth/WelcomeScreen.tsx` | Onboarding slides | Active |
| `screens/auth/authComponents/SigninForm.tsx` | Login form (Formik+Yup) | Active |
| `screens/auth/authComponents/SignupForm.tsx` | Signup form (Formik+Yup) | Active |
| `screens/auth/authComponents/ForgotPasswordForm.tsx` | Password reset form | Active |
| `screens/auth/authComponents/Slides.tsx` | Welcome slides content | Active |
| `screens/auth/authComponents/LanguageFlags.tsx` | Language picker | Active |
| `screens/auth/authComponents/StatusMessage.tsx` | Auth status display | **Deleted** |
| `screens/addTag/AddTagScreen.js` | Tag images — full-screen image viewer with overlays | Active |
| `screens/addTag/components/CategoryBrowser.js` | Category grid browser | Active |
| `screens/addTag/components/ImageProgressDots.js` | Image navigation dots | Active |
| `screens/addTag/components/ImageViewer.js` | Zoomable image display | Active |
| `screens/addTag/components/TagDetailSheet.js` | Materials, brands, custom tags per tag | Active |
| `screens/addTag/components/TagPills.js` | Tag chip display with remove/quantity | Active |
| `screens/addTag/components/TagSearchBar.js` | Search tags with grouped results | Active |
| `screens/addTag/components/TagSuggestions.js` | Suggest tags from other images | Active |
| `screens/addTag/components/categoryColors.js` | Category color mapping | Active |
| `screens/gallery/GalleryScreen.js` | Photo picker with gesture selection | Active |
| `screens/gallery/AlbumScreen.js` | Album view | **Deleted** |
| `screens/globalData/GlobalDataScreen.js` | Global statistics | **Deleted** |
| `screens/leaderboards/LeaderboardsScreen.js` | Leaderboard | **Deleted** |
| `screens/setting/SettingsScreen.js` | Settings | Active |
| `screens/setting/settingComponents/SettingsComponent.js` | Settings edit forms | Active |
| `screens/NewUpdateScreen.js` | App update prompt | Active |
| `screens/userStats/UserStatsScreen.js` | User profile/stats | Active |
| `screens/userStats/userComponents/MyUploads.js` | Upload history | Active |
| `screens/userStats/userComponents/ProgressCircleCard.js` | XP progress | Active |
| `screens/userStats/userComponents/ShowMyUploadsButton.js` | Nav button | Active |
| `screens/profile/ProfileScreen.js` | Profile with animated stats | Active |
| `screens/team/TeamScreen.js` | Team management | Active |
| `screens/team/TeamDetailsScreen.js` | Team details | Active |
| `screens/team/TopTeamsScreen.js` | Top teams list | Active, fake loading (BUG-11) |
| `screens/team/TeamLeaderboardScreen.js` | Team leaderboard | Active |
| `screens/permission/CameraPermissionScreen.js` | Camera permission | Active |
| `screens/permission/GalleryPermissionScreen.js` | Gallery permission | Active |

**Removed:** `screens/camera/CameraScreen.js` (dead — RNCamera commented out, not in navigator), `screens/map/MapScreen.js` (stub, not in navigator)

### Shared Components
| File | Purpose |
|------|---------|
| `screens/components/index.ts` | Barrel exports |
| `screens/components/Header.js` | App header bar |
| `screens/components/Button.tsx` | Shared button |
| `screens/components/AnimatedCircle.tsx` | SVG animated circle |
| `screens/components/typography/Body.tsx` | Body text |
| `screens/components/typography/Caption.tsx` | Caption text |
| `screens/components/typography/Title.tsx` | Title text |
| `screens/components/typography/SubTitle.tsx` | Subtitle text |
| `screens/components/typography/StyledText.tsx` | Base styled text |
| `screens/components/theme/colors.ts` | Theme colors (single source of truth) |
| `screens/components/theme/fonts.ts` | Font definitions |

### Utils
| File | Purpose |
|------|---------|
| `utils/isGeotagged.js` | Check image GPS data |
| `utils/isTagged.js` | Check image has tags |
| `utils/gps.js` | GPS coordinate validation |
| `utils/readGpsFromExif.js` | EXIF GPS extraction (Android fallback) |
| `utils/dayjs.js` | dayjs with relativeTime + isSameOrAfter plugins |
| `utils/classifyError.js` | Error classification for upload thunks |
| `utils/getTagsFromBackend.js` | Convert backend new_tags to local tags format |
| `utils/buildTagsPayload.js` | Convert per-image tags to POST format |
| `utils/setupAxiosInterceptors.js` | Global 401 handler + 30s timeout |
| `utils/permissions/index.js` | Permission barrel exports |
| `utils/permissions/cameraPermission.js` | Camera permission helpers |
| `utils/permissions/cameraRollPermission.js` | Photo library permission helpers |
| `utils/permissions/locationPermission.js` | Location permission helpers |

**Removed:** `utils/Colors.js` (merged into `theme/colors.ts`), `utils/Values.js` (unused)

---

## 2. API Calls

**Total: 31 endpoints + 1 global interceptor. All deprecated endpoints have been migrated.**

**Backend confirmed (2026-03-08):** All endpoints verified against Laravel backend. Key field mappings confirmed below.

### Auth (auth_reducer.js) — 5 endpoints

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 1 | `checkValidToken` | POST | `/api/validate-token` | None (token in header) | `message === 'valid'` | Bearer | OK |
| 2 | `createAccount` | POST | `/api/auth/register` | `{email, password}` | `token`, `user.username` | None | OK |
| 3 | `fetchUser` | GET | `/api/user/profile/index` | None | `user.*`, `stats.{uploads,tags,xp,littercoin,streak}`, `level.{level,title,progress_percent,xp_remaining}`, `rank.{global_position,percentile}`, `team.id`, `achievements`, `locations` | Bearer | OK — `stats.tags` replaced `stats.litter` (includes object quantities + materials + brands + custom tags) |
| 4 | `sendResetPasswordRequest` | POST | `/api/password/email` | `{email}` | `response.data` | None | OK |
| 5 | `userLogin` | POST | `/api/auth/token` | `{identifier, password}` | `token`, `user` | None | OK |

### Photos / Server Photos / Upload Flow — 4 endpoints

| # | Thunk | Reducer | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|---------|--------|-----|---------|---------------------|------|--------|
| 6 | `fetchUntaggedCount` / `fetchNextUntaggedPhoto` | `server_photos_reducer.js` | GET | `/api/v3/user/photos` | params: `{tagged: false, ...}` | `photos[].{id,datetime,lat,lon,filename,picked_up,platform}`, `pagination.total` | Bearer | OK |
| 7 | `uploadImage` | `upload_flow_reducer.js` | POST | `/api/v3/upload` | FormData: `photo, lat, lon, date, picked_up, model` | `success`, `photo_id` | Bearer | OK — backend also returns `xp_awarded`, `user_xp_total`, `city`, `state`, `country` |
| 8 | `postTagsToPhoto` | `upload_flow_reducer.js` | POST | `/api/v3/tags` | `{photo_id, tags[{category_litter_object_id, litter_object_type_id, quantity, picked_up, materials, brands, custom_tags}]}` | `response.status` | Bearer | OK |
| 9 | `editTagsOnPhoto` | `server_photos_reducer.js` | PUT | `/api/v3/tags` | Same as #8 | `photoTags` | Bearer | OK — PUT atomically replaces all tags |

### My Uploads (uploads_reducer.js) — 3 endpoints

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 10 | `fetchUploads` | GET | `/api/v3/user/photos` | params: `{page, tag?, custom_tag?, date_from?, date_to?}` | `photos[]`, `pagination.{total,per_page,current_page,last_page}` | Bearer | OK |
| 11 | `fetchUploadStats` | GET | `/api/v3/user/photos/stats` | None | `response.data` (stored as `uploadStats`) | Bearer | OK |
| 12 | `deleteUploadPhoto` | POST | `/api/profile/photos/delete` | `{photoid}` | None (success = no error) | Bearer | OK |

**Backend confirmed:** Photo objects include `new_tags` (array), `total_tags`, `xp`, `team` (full object with `.name`), `summary` (JSON), `picked_up`. `result_string` is NOT returned (deprecated). Our `UploadCard` correctly reads `new_tags`, `total_tags`, `xp`, `team.name`.

### Tags (tags_reducer.js) — 1 endpoint

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 13 | `fetchAllTags` | GET | `/api/tags/all` | None | `categories[], objects[], category_objects[], types[], category_object_types[], materials[], brands[]` | Optional | OK |

**Backend confirmed:** Objects use `key` field (no `display_name`). CLO IDs come from `category_objects` pivot table. Our `tags_reducer` generates `displayName` at build time via `formatKey()`.

### Settings (settings_reducer.js) — 4 endpoints

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 14 | `deleteAccount` | POST | `/api/settings/delete-account/` | `{password}` | `success`, `msg` | Bearer | OK |
| 15 | `saveSettings` | POST | `/api/settings/update/` | `{key, value}` | `success` | Bearer | OK |
| 16 | `saveSocialAccounts` | PATCH | `/api/settings` | `{...values}` | `message === 'success'` | Bearer | OK |
| 17 | `toggleSettingsSwitch` | POST | `/api/settings/privacy/{endpoint}` | None | First key/value pair | Bearer | OK |

**Backend confirmed:** Delete account returns `{ success: true }` on success (no `msg`), `{ success: false, msg: "password does not match" }` on failure.

### Teams (team_reducer.js) — 8 endpoints

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 18 | `changeActiveTeam` | POST | `/api/teams/active` | `{team_id}` | `success`, `team.id` | Bearer | OK |
| 19 | `createTeam` | POST | `/api/teams/create` | `{name, identifier, team_type: 1}` | `success`, `team` | Bearer | OK |
| 20 | `inactivateTeam` | POST | `/api/teams/inactivate` | None | `success` | Bearer | OK |
| 21 | `leaveTeam` | POST | `/api/teams/leave` | `{team_id}` | `activeTeam.id`, `team` | Bearer | OK |
| 22 | `getTeamMembers` | GET | `/api/teams/members` | params: `{team_id, page}` | `result.{data[], next_page_url}` | Bearer | OK |
| 23 | `getTopTeams` | GET | `/api/teams/leaderboard` | None | `response.data` (entire payload) | Bearer | OK |
| 24 | `getUserTeams` | GET | `/api/teams/list` | None | `success`, `teams[]` | Bearer | OK |
| 25 | `joinTeam` | POST | `/api/teams/join` | `{identifier}` | `success`, `activeTeam.id`, `team` | Bearer | OK |

**Backend confirmed field mapping:**
- Team objects return `total_tags` (NOT `total_litter`), `total_images`, `total_members`
- Member pivot includes `pivot.total_photos` and `pivot.total_litter` — both confirmed
- Code updated: `TeamDetailsScreen` now reads `total_tags`, `TeamListCard` fallback removed

### Leaderboard (leaderboards_reducer.js) — 1 endpoint

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 26 | `getLeaderboardData` | GET | `/api/leaderboard` | params: `{timeFilter, page}` | `success`, `users[]`, `hasNextPage`, `total` | None | OK |

### Stats (stats_reducer.js) — 1 endpoint

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 27 | `getStats` | GET | `/api/global/stats-data` | None | `total_tags`, `total_images`, `total_users`, `new_users_today`, `new_users_last_7_days`, `new_users_last_30_days` | None | OK |

### Shared (shared_reducer.js) — 1 endpoint

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 28 | `checkAppVersion` | GET | `/api/mobile-app-version` | None | `response.data` (as `appVersion`) | None | OK |

### Locations (locations_reducer.js) — 2 endpoints

| # | Thunk | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|-------|--------|-----|---------|---------------------|------|--------|
| 29 | `fetchCountries` | GET | `/api/locations/country` | None | `locations` or raw data | None | OK |
| 30 | `fetchLocationChildren` | GET | `/api/locations/{type}/{id}` | None | `locations[]` | None | OK |

### XP Levels (screens/profile/helpers/xpLevels.js) — 1 endpoint

| # | Function | Method | URL | Payload | Response Fields Read | Auth | Status |
|---|----------|--------|-----|---------|---------------------|------|--------|
| 31 | `fetchXpLevels` | GET | `/api/levels` | None | Array or `{data}` or `{levels}` → `[{xp, name}]` | Bearer | OK |

### Global (utils/setupAxiosInterceptors.js)

- Default timeout: 30 seconds
- 401 interceptor: signals `uploadAbortReason('token-expired')` + logout

### Deprecated Endpoints (All Removed)

| Old Endpoint | Replaced By | When |
|---|---|---|
| `POST /oauth/token` | `POST /api/auth/token` | Passport → Sanctum migration |
| `POST /api/register` | `POST /api/auth/register` | Sanctum migration |
| `GET /api/user` | `GET /api/user/profile/index` | Profile consolidation |
| `POST /api/photos/upload/with-or-without-tags` | `POST /api/v3/upload` | v3 upload |
| `POST /api/v2/add-tags-to-uploaded-image` | `POST /api/v3/tags` | v5 tagging |
| `DELETE /api/photos/delete` | `POST /api/profile/photos/delete` | Unified deletion |
| `GET /api/v2/photos/get-untagged-uploads` | `GET /api/v3/user/photos?tagged=false` | v3 user photos |
| `GET /history/paginated` | `GET /api/v3/user/photos` | v3 user photos |

**Backend confirmed:** All deprecated endpoints are fully removed (404, no redirects). Only active API versions are v1 (legacy location routes) and v3 (current).

---

## 3. Auth Mechanism

### Current Implementation: Laravel Sanctum (Token-Based)

**Login flow:**
1. User submits email/username + password
2. App POSTs to `/api/auth/token` with `{identifier, password}`
3. Server returns `{token: "1|abc...", user: {...}}`
4. Token stored in AsyncStorage as key `"jwt"`
5. All subsequent requests use `Authorization: Bearer {token}` header
6. On app boot, `checkValidToken` POSTs stored token to `/api/validate-token`

**Backend confirmed:** Rate limited to 5 attempts/minute. Revokes existing mobile tokens before issuing new one.

**Registration flow:**
1. App POSTs to `/api/auth/register` with `{email, password}`
2. On success, automatically calls `userLogin` with the same credentials

**Token persistence:**
- `redux-persist` persists the `auth` slice (including token) to AsyncStorage
- Token also explicitly stored at AsyncStorage key `"jwt"`
- On logout, `AsyncStorage.clear()` wipes everything

**Notes:**
- User object stored redundantly in both Redux (persisted) and `AsyncStorage.setItem('user', ...)` — potential desync

---

## 4. State Management Map

### Redux Store Shape

```
store
├── auth (persisted to AsyncStorage)
│   ├── appVersion: string
│   ├── isSubmitting: boolean
│   ├── token: string | null
│   ├── user: object | null
│   ├── serverStatusText: string
│   └── errors: object
│
├── gallery
│   ├── imagesLoading: boolean
│   ├── galleryImages: array (CameraRoll photos with GPS metadata)
│   ├── nextGalleryId: number
│   ├── camerarollImageFetched: boolean
│   ├── lastFetchTime: number | null
│   ├── isNextPageAvailable: boolean
│   ├── lastImageCursor: string | null
│   └── error: string | null
│   (Derived selector: selectNonGeotaggedCount)
│
├── photos (persisted — imagesArray only via transform)
│   ├── imagesArray: array (core image collection with tags, customTags per image)
│   └── swiperIndex: number
│
├── serverPhotos
│   ├── untaggedCount: number
│   ├── editingPhoto: object | null
│   └── preview: object | null
│
├── uploadFlow
│   ├── totalToUpload / uploaded / uploadFailed / tagged / taggedFailed: numbers
│   ├── uploadPhase: 'idle' | 'uploading' | 'tagging'
│   ├── currentUploadIndex: number
│   ├── uploadAbortReason: null | 'token-expired' | 'cancelled'
│   ├── failedCounts: { alreadyUploaded, invalidCoordinates, timeout, network, server, unknown }
│   ├── showUploadModal: boolean
│   └── showThankYouMessages: boolean
│
├── uploads
│   ├── uploads: { data[], total, current_page, next_page_url, ... }
│   ├── uploadStats: object | null
│   ├── loading: boolean
│   └── error: string | null
│
├── leaderboard
│   └── paginated: { users: array }
│
├── shared
│   └── appVersion: object | null
│
├── settings
│   ├── deviceModel: string
│   ├── editModalVisible / saveResultModalVisible: boolean
│   ├── editValue: string
│   ├── wait: boolean
│   ├── editField: any
│   ├── deleteAccountError: string
│   ├── saveResultMessage: string
│   └── updatingSettings: boolean
│
├── stats
│   └── (global stats data)
│
├── tags
│   ├── objectEntries: array (flattened search index)
│   ├── categoriesById: object
│   ├── entriesByCloId: object
│   ├── typeEntriesByKey: object
│   ├── materialsById: object
│   ├── brandsById: object
│   └── loading: boolean
│
├── teams
│   ├── topTeams: array
│   ├── topTeamsLoading: boolean
│   ├── userTeams: array
│   ├── teamMembers: array
│   ├── selectedTeam: object
│   ├── teamsFormError: string
│   ├── teamFormStatus: string | null
│   ├── successMessage: string
│   └── memberNextPage: number | null
│
└── locations
    └── (location hierarchy data)
```

---

## 5. Navigation Structure

```
NavigationContainer (App.tsx)
└── MainRoutes (Stack.Navigator, headerShown: false)
    │
    ├── [token === null] AUTH_HOME → AuthStack
    │   ├── WELCOME → WelcomeScreen
    │   └── AUTH → AuthScreen
    │       └── MaterialTopTabs
    │           ├── SIGNIN → SigninForm
    │           ├── SIGNUP → SignupForm
    │           └── FORGOT_PASSWORD → ForgotPasswordForm
    │
    └── [token !== null]
        ├── APP → TabRoutes (MaterialTopTabs, bottom)
        │   ├── HOME → HomeScreen
        │   ├── TEAM → TeamStack
        │   │   ├── TEAM_HOME → TeamScreen
        │   │   ├── TOP_TEAMS → TopTeamsScreen
        │   │   ├── TEAM_DETAILS → TeamDetailsScreen
        │   │   └── TEAM_LEADERBOARD → TeamLeaderboardScreen
        │   └── USER_STATS → ProfileScreen
        │
        ├── PERMISSION → PermissionStack
        │   ├── CAMERA_PERMISSION → CameraPermissionScreen
        │   └── GALLERY_PERMISSION → GalleryPermissionScreen
        │
        ├── ADD_TAGS → AddTagScreen
        ├── ALBUM → GalleryScreen
        ├── SETTING → SettingsScreen
        ├── UPDATE → NewUpdateScreen
        └── MY_UPLOADS → MyUploads
```

---

## 6. Dependencies

### Production Dependencies (32 total)

| Package | Version | Status |
|---------|---------|--------|
| `@lodev09/react-native-exify` | ^1.0.3 | OK — EXIF GPS fallback on Android |
| `@react-native-async-storage/async-storage` | ^1.23.1 | OK |
| `@react-native-camera-roll/camera-roll` | ^7.8.1 | OK |
| `@react-native-clipboard/clipboard` | ^1.14.2 | OK |
| `@react-native-community/datetimepicker` | ^8.2.0 | OK |
| `@react-native-masked-view/masked-view` | ^0.3.2 | OK |
| `@react-native-picker/picker` | ^2.7.7 | OK |
| `@react-navigation/material-top-tabs` | ^6.6.13 | OK |
| `@react-navigation/native` | ^6.1.17 | OK |
| `@react-navigation/stack` | ^6.4.0 | OK |
| `@reduxjs/toolkit` | ^2.2.6 | OK |
| `@sentry/react-native` | ^5.36.0 | OK |
| `@shopify/flash-list` | ^1.7.0 | OK |
| `axios` | ^1.7.2 | OK |
| `dayjs` | ^1.11.19 | OK |
| `formik` | ^2.4.6 | OK |
| `i18next` | ^23.11.5 | OK |
| `lottie-react-native` | ^6.7.2 | OK |
| `react` | ^18.2.0 | OK |
| `react-native` | 0.74.3 | OK |
| `react-native-actions-sheet` | ^0.9.6 | OK — used in Settings, TeamScreen, TeamDetails |
| `react-native-config` | ^1.5.2 | OK |
| `react-native-device-info` | ^11.1.0 | OK |
| `react-native-gesture-handler` | ^2.20.0 | OK |
| `react-native-linear-gradient` | ^2.8.3 | OK |
| `react-native-localize` | ^3.2.0 | OK |
| `react-native-page-control` | ^1.1.2 | OK |
| `react-native-pager-view` | ^6.3.3 | OK — required by material-top-tabs |
| `react-native-permissions` | ^4.1.5 | OK |
| `react-native-reanimated` | ^3.16.7 | OK |
| `react-native-safe-area-context` | ^4.10.7 | OK |
| `react-native-screens` | ^3.32.0 | OK |
| `react-native-svg` | ^15.3.0 | OK |
| `react-native-swipe-gestures` | ^1.0.5 | OK |
| `react-native-tab-view` | ^3.5.2 | OK |
| `react-native-vector-icons` | ^10.1.0 | OK |
| `react-redux` | ^9.1.2 | OK |
| `redux-persist` | ^6.0.0 | OK |
| `use-count-up` | ^3.0.1 | OK |
| `yup` | ^1.4.0 | OK |

**Removed:** `react-native-maps` (only used by deleted MapScreen), `redux-thunk` (included in RTK), `immer` (included in RTK), `moment` (replaced by dayjs), `react-native-swiper` (replaced by custom implementation)

### Dev Dependencies (13 total)

| Package | Version | Status |
|---------|---------|--------|
| `@babel/core` | ^7.20.0 | OK |
| `@babel/preset-env` | ^7.20.0 | OK |
| `@babel/runtime` | ^7.20.0 | OK |
| `@react-native/babel-preset` | 0.74.85 | OK |
| `@react-native/eslint-config` | 0.74.85 | OK |
| `@react-native/metro-config` | 0.74.85 | OK |
| `@react-native/typescript-config` | 0.74.85 | OK |
| `@types/react` | ^18.2.6 | OK |
| `@types/react-test-renderer` | ^18.0.0 | OK |
| `babel-jest` | ^29.6.3 | OK |
| `eslint` | ^8.19.0 | OK |
| `jest` | ^29.6.3 | OK |
| `prettier` | 2.8.8 | OK |
| `react-test-renderer` | ^18.2.0 | OK |
| `redux-immutable-state-invariant` | ^2.1.0 | OK (dev-only) |
| `typescript` | 5.0.4 | OK |

---

## 7. Bugs and Issues

### Remaining Bugs

**BUG-06: ~~leaveTeam fulfilled handler is empty~~ RESOLVED (team_reducer.js)**
Handler now finds the team by `action.payload.team?.id` and splices it from `userTeams`. Works correctly.

**BUG-11: TopTeamsScreen fake loading (TopTeamsScreen.js)**
Uses `setTimeout(() => setIsLoading(false), 3000)` instead of tracking actual API loading state. Users always wait 3 seconds regardless of API speed.

**BUG-15: ~~changeActiveTeam.fulfilled handler reads wrong payload shape~~ LOW RISK (team_reducer.js)**
Handler only sets `teamFormStatus` and `successMessage` — it no longer pushes to `userTeams`. The thunk dispatches `fetchUser` to refresh the user's active team. No payload shape issue.

### Fixed Bugs (resolved in v7 audit passes)

| Bug | Fix |
|-----|-----|
| BUG-01 | Permission check `result === 'granted' \|\| 'limited'` → `result === 'granted' \|\| result === 'limited'` |
| BUG-02 | Auth migrated from Passport to Sanctum — `/api/auth/token` with `{identifier, password}`, no client credentials |
| BUG-03 | Added `return` before `rejectWithValue()` in saveSettings/saveSocialAccounts |
| BUG-04 | `state.user` → `state.auth.user` in Stats component (component since removed/refactored) |
| BUG-05 | Template literal in SettingsComponent fixed — uses `{t(deleteAccountError)}` correctly |
| BUG-07 | Added optional chaining: `error.response?.data?.message` with fallback string |
| BUG-08/09/10 | Removed exports of non-existent actions from settings, team, and auth reducers |
| BUG-12 | UploadCard refactored — reads `new_tags`, `total_tags`, `xp` (not `result_string`) |
| BUG-13/14 | web_reducer deleted entirely |
| BUG-16 | AlbumScreen — effect callback is sync, calls async function correctly |
| BUG-17 | LitterBottomButtons removed — AddTagScreen rebuilt with integrated controls |
| BUG-18 | `utils/Colors.js` deleted, `theme/colors.ts` is single source of truth |
| BUG-19 | LitterTagsCard removed — tag display rebuilt in TagPills/AddTagScreen |
| BUG-20 | deleteAccount correctly sends `{password}` in body, token only in Authorization header |
| BUG-21 | `fetchUser` not awaited in `checkValidToken`/`userLogin`/`createAccount` — app rendered with `user: null`. Fixed: all three now `await dispatch(fetchUser())` |
| BUG-22 | `fetchUser.rejected` cleared token on any failure (including network blip). Fixed: retry 2× with backoff for transient errors (timeout/network/5xx), only clear token on 401 |
| BUG-23 | Custom-tag-only upload payload malformed (no CLO, no `custom: true`). Fixed: sends `{ custom: true, key: "tag-text" }` per backend spec |
| BUG-24 | `typeId` falsy-zero coercion: `(typeId \|\| null)` treated `0` as `null`. Fixed: `?? null` in 4 locations |
| BUG-25 | Upload cancel didn't abort in-flight request or reset `uploadPhase`. Fixed: `AbortController` + signal on axios calls, cancel resets phase to idle, early-return prevents stale result modal |
| BUG-26 | `cancelUploadImages` reducer was empty no-op. Removed; cancel logic moved to `cancelUploadWrapper` in HomeScreen |
| BUG-27 | `joinTeam` ignored `activeTeamId` from response. Fixed: dispatches `changeUsersActiveTeam` when backend returns active team |
| BUG-28 | `leaveTeam` didn't clear `selectedTeam` or sync `user.active_team` when leaving active team. Fixed: always syncs from response (including null), clears `selectedTeam` if it was the left team, surfaces 403 errors |
| BUG-29 | `getTeamMembers` could accumulate duplicates on pagination. Fixed: deduplicates by member ID before push |
| BUG-30 | EXIF `readGpsFromExif` had no timeout. Fixed: 5s `Promise.race` timeout |
| BUG-31 | `checkCameraRollPermission` re-requested `ACCESS_MEDIA_LOCATION` on every call. Fixed: only `check()`, never `request()` |
| BUG-32 | Custom tags had no validation. Fixed: max 100 chars, min 3 chars, regex `/^[\w\s:-]+$/` matching backend rules |
| BUG-33 | Minio image URLs use `127.0.0.1` unreachable from phone. Fixed: dev-only URL rewrite in `ImageViewer.js` using LAN IP from API base URL |
| BUG-34 | Edit mode showed "Carton" instead of "Juice Carton" — `loadPhotoForEditing` didn't read `apiTag.type?.key`. Fixed in both `images_reducer.js` (edit mode `fallbackDisplayName`) and `TagChips.js` (My Uploads list) |
| BUG-35 | Profile showed `stats.litter` (undefined) instead of `stats.tags`. Backend renamed field. Fixed: `stats.tags ?? stats.litter ?? 0` with fallback |

### Dead Code Removed

| Item | Action Taken |
|------|-------------|
| `screens/camera/CameraScreen.js` | Deleted — dead class component, RNCamera commented out |
| `screens/map/MapScreen.js` | Deleted — stub, not in navigator |
| `reducers/camera_reducer.js` | Deleted — never dispatched or read |
| `reducers/web_reducer.js` | Deleted — never read by any component |
| `routes/GalleryRoutes.tsx` | Deleted — stack never used in MainRoutes |
| `utils/Colors.js` | Deleted — merged into `theme/colors.ts` |
| `images.selectedImages` | Removed from initial state |
| `shared.isSelecting` / `shared.selected` | Removed from initial state |
| `console.log` in `actions/types.js` | Removed (env + client credentials logging) |
| `react-native-maps` | Removed from package.json |
| `redux-thunk` / `immer` | Removed from package.json (included in RTK) |
| `screens/globalData/GlobalDataScreen.js` | Deleted — orphaned screen, never routed |
| `screens/leaderboards/LeaderboardsScreen.js` | Deleted — orphaned screen, never routed |
| `screens/gallery/AlbumScreen.js` | Deleted — orphaned screen |
| `screens/gallery/galleryComponents/AlbumList.js` | Deleted — orphaned component |
| `screens/auth/authComponents/StatusMessage.js` | Deleted — exported but never used |
| `screens/userStats/userComponents/myUploadsComponents/UploadStatsHeader.js` | Deleted |
| `utils/Values.js` | Deleted — unused |
| `images.errorMessage` | Removed from state |
| `teams.teamsRequestStatus` | Removed from state |
| `settings.isEditing` | Removed from state (redundant) |
| Legacy `tags: {}` field | Removed from gallery and images reducers |

---

## 8. Build and Config

### Environment Configuration
- Uses `react-native-config` to load `.env` files
- Required env variables:
  ```
  CURRENT_ENVIRONMENT=production|local
  OLM_ENDPOINT=<api_base_url>
  LOCAL_OLM_ENDPOINT=<local_api_url>
  SENTRY_DSN=<sentry_dsn>
  ```

### Build Scripts
```json
"scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest",
    "postinstall": "sed ... (patches Sentry podspec for Xcode 26 compat)"
}
```

### iOS
- `reactNativePermissionsIOS` in package.json: Camera, LocationAccuracy, LocationWhenInUse, PhotoLibrary
- CocoaPods managed via Gemfile
- Sentry Cocoa SDK patched to 8.46.0 via postinstall for Xcode 26 compatibility

### Android
- Standard React Native Android setup
- Permissions handled via `react-native-permissions`
- EXIF GPS fallback using `@lodev09/react-native-exify` for devices where CameraRoll GPS is unreliable

### Tests
- Jest configured with `react-native` preset
- **No test files exist in the codebase**

---

## 9. Feature State

| Feature | Screen(s) | Status | Rating |
|---------|-----------|--------|--------|
| **User Auth** | AuthScreen, SigninForm, SignupForm | Sanctum auth complete. Login/signup/token validation working. | 8/10 |
| **Password Reset** | ForgotPasswordForm | Form works, sends email. | 7/10 |
| **Gallery Photo Selection** | GalleryScreen | CameraRoll access, gesture selection, GPS filtering, EXIF fallback on Android. | 8/10 |
| **Image Upload** | HomeScreen | Select → tag → upload pipeline. Sequential upload with progress, cancel support, structured error handling. | 8/10 |
| **Litter Tagging** | AddTagScreen, TagSearchBar, CategoryBrowser, etc. | Full-screen image viewer. Search, browse categories, tag pills, materials/brands/custom tags per tag. XP estimate. | 8/10 |
| **Upload History** | MyUploads | Paginated list with filters, swipe actions (copy link, open map, delete). | 7/10 |
| **Teams** | TeamScreen, TeamDetails, TopTeams | Create, join, leave, view members. Leave team state update incomplete (BUG-06). Fake loading (BUG-11). | 5/10 |
| **Leaderboards** | ~~LeaderboardsScreen~~ (Deleted) | Time-filtered leaderboard display. Screen deleted, data reducer retained. | — |
| **Global Stats** | ~~GlobalDataScreen~~ (Deleted) | Animated counters with milestone progress. Screen deleted, data reducer retained. | — |
| **User Profile** | UserStatsScreen, ProfileScreen | User level, XP, tag counts, animated stats, navigation to uploads. | 7/10 |
| **Settings** | SettingsScreen, SettingsComponent | Edit name/username/email, privacy toggles, social accounts, delete account. | 7/10 |
| **App Version Check** | NewUpdateScreen, HomeScreen | Checks backend for latest version, prompts update. | 7/10 |
| **Internationalization** | All screens | 8 languages (en, ar, de, es, fr, ie, nl, pt). | 7/10 |
| **Welcome/Onboarding** | WelcomeScreen, Slides | 4 slides with Lottie animations. | 8/10 |
| **Permissions** | CameraPermission, GalleryPermission | Camera, photo library, location. Android 13+ handled. | 7/10 |

---

## 10. Assessment

### What Works
The core workflow — pick photos from gallery, tag with litter categories, upload — is fully functional. Auth has been migrated to Sanctum. The tagging UI has been rebuilt with search, category browsing, tag pills, and detail sheets for materials/brands/custom tags. GPS handling includes EXIF fallback on Android. All deprecated API endpoints have been migrated to v3.

### Remaining Work

**P1 — Features Incomplete:**
1. ~~BUG-06: leaveTeam state update~~ RESOLVED
2. ~~BUG-15: changeActiveTeam payload shape~~ LOW RISK (handler correct)
3. BUG-11: TopTeamsScreen fake loading
4. ~~GlobalDataScreen and LeaderboardsScreen exist but are not wired into any route~~ Deleted

**P2 — New Features:**
4. Camera capture (needs full rewrite with react-native-vision-camera)
5. Map view (needs implementation from scratch)

**P3 — Cleanup:**
6. ~~`my_uploads_reducer` inconsistent slice key name~~ Fixed — renamed to `uploads_reducer.js` with slice key `uploads`
7. No test coverage
8. User object stored redundantly in Redux and AsyncStorage

### Verdict

The app is in good shape for v7 release. Auth works, core upload pipeline works, tagging is rebuilt and polished, dead code is cleaned up, API endpoints are current. The main gaps are team state management edge cases and the unbuilt camera/map features.
