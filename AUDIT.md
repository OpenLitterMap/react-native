# AUDIT.md — OpenLitterMap React Native App

**Date:** 2026-02-28
**App Version:** 6.2.0
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
| `i18n.js` | i18next setup (en, de, nl, fr, es, pt, ca, et) |
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
| `store/index.js` | configureStore with redux-persist (whitelist: auth, images), AsyncStorage, redux-immutable-state-invariant (dev) |

### Reducers (12 slices)
| File | Slice Key | API Calls | Status |
|------|-----------|-----------|--------|
| `reducers/index.js` | Root combiner | 0 | OK |
| `reducers/auth_reducer.js` | `auth` | 5 | Active, bugs |
| `reducers/camera_reducer.js` | `camera` | 0 | Minimal, 3 fields |
| `reducers/gallery_reducer.js` | `gallery` | 0 | CameraRoll fetch |
| `reducers/images_reducer.js` | `images` | 4 | Active, core |
| `reducers/litter_reducer.js` | `litter` | 0 | UI state only |
| `reducers/leaderboards_reducer.js` | `leaderboard` | 1 | Active |
| `reducers/my_uploads_reducer.js` | `my_uploads_reducer` | 1 | Active |
| `reducers/settings_reducer.js` | `settings` | 4 | Active, bugs |
| `reducers/shared_reducer.js` | `shared` | 1 | Active |
| `reducers/stats_reducer.js` | `stats` | 1 | Active |
| `reducers/team_reducer.js` | `teams` | 8 | Active, bugs |
| `reducers/web_reducer.js` | `web` | 1 (unused) | Dead code |

### Routes
| File | Purpose |
|------|---------|
| `routes/index.js` | Barrel export for MainRoutes |
| `routes/MainRoutes.js` | Root navigator, auth gating, conditional routing |
| `routes/AuthStack.js` | Welcome → Auth screen stack |
| `routes/TabRoutes.tsx` | Bottom tabs: Home, Team, Global Data, Leaderboards, User Stats |
| `routes/PermissionStack.tsx` | Camera/Gallery permission screens |
| `routes/GalleryRoutes.tsx` | Gallery → Album stack |
| `routes/TeamStack.tsx` | Team screens stack |

### Screens
| File | Screen | Status |
|------|--------|--------|
| `screens/home/HomeScreen.js` | Main upload screen | Active, bug at line 114 |
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
| `screens/auth/authComponents/StatusMessage.tsx` | Auth status display | Active |
| `screens/addTag/AddTags.js` | Tag images with swiper | Active |
| `screens/addTag/addTagComponents/LitterBottomButtons.tsx` | Tag action buttons | Bug: delete disabled |
| `screens/addTag/addTagComponents/LitterCategories.tsx` | Category picker | Active |
| `screens/addTag/addTagComponents/LitterImage.tsx` | Image display | Active |
| `screens/addTag/addTagComponents/LitterPickerWheels.tsx` | Quantity picker | Active |
| `screens/addTag/addTagComponents/LitterTags.tsx` | Tag list display | Active |
| `screens/addTag/addTagComponents/LitterTextInput.tsx` | Custom tag input | Active |
| `screens/addTag/addTagComponents/LitterTagsCard.tsx` | Tag card display | Active |
| `screens/addTag/addTagComponents/Stats.tsx` | User stats in tagger | Bug: wrong state path |
| `screens/camera/CameraScreen.js` | Camera capture | **BROKEN** |
| `screens/gallery/GalleryScreen.js` | Photo picker | Active |
| `screens/gallery/AlbumScreen.js` | Album view | Active, minor issue |
| `screens/globalData/GlobalDataScreen.js` | Global statistics | Active |
| `screens/leaderboards/LeaderboardsScreen.js` | Leaderboard | Active |
| `screens/map/MapScreen.js` | Map view | **STUB** |
| `screens/setting/SettingsScreen.js` | Settings | Active |
| `screens/setting/settingComponents/SettingsComponent.js` | Settings edit forms | Bug: template literal |
| `screens/NewUpdateScreen.js` | App update prompt | Active |
| `screens/userStats/UserStatsScreen.js` | User profile/stats | Active |
| `screens/userStats/userComponents/MyUploads.js` | Upload history | Active, uses deprecated field |
| `screens/userStats/userComponents/ProgressCircleCard.js` | XP progress | Active |
| `screens/userStats/userComponents/ShowMyUploadsButton.js` | Nav button | Active |
| `screens/team/TeamScreen.js` | Team management | Active |
| `screens/team/TeamDetailsScreen.js` | Team details | Active |
| `screens/team/TopTeamsScreen.js` | Top teams list | Active, fake loading |
| `screens/team/TeamLeaderboardScreen.js` | Team leaderboard | Active |
| `screens/permission/CameraPermissionScreen.js` | Camera permission | Active |
| `screens/permission/GalleryPermissionScreen.js` | Gallery permission | Active |

### Shared Components
| File | Purpose |
|------|---------|
| `screens/components/index.js` | Barrel exports |
| `screens/components/Header.js` | App header bar |
| `screens/components/Button.js` | Shared button |
| `screens/components/AnimatedCircle.js` | SVG animated circle |
| `screens/components/typography/Body.tsx` | Body text |
| `screens/components/typography/Caption.tsx` | Caption text |
| `screens/components/typography/Title.tsx` | Title text |
| `screens/components/theme/colors.ts` | Theme colors |

### Utils
| File | Purpose |
|------|---------|
| `utils/isGeotagged.js` | Check image GPS data |
| `utils/isTagged.js` | Check image has tags |
| `utils/Colors.js` | Color constants (DUPLICATE of theme/colors.ts) |
| `utils/Values.js` | REM division factor |
| `utils/permissions/index.js` | Permission barrel exports |
| `utils/permissions/cameraPermission.js` | Camera permission helpers |
| `utils/permissions/cameraRollPermission.js` | Photo library permission helpers |
| `utils/permissions/locationPermission.js` | Location permission helpers |

### Data
| File | Purpose |
|------|---------|
| `assets/data/categories.js` | 13 litter categories |
| `assets/data/xpLevel.js` | XP level thresholds array |
| `assets/data/litterkeys.js` | Litter item keys per category |

---

## 2. API Calls

### Auth (auth_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 1 | `checkValidToken` | POST | `/api/validate-token` | None (token in header) | `{message: "valid"}` | Bearer | On app boot, validates stored JWT |
| 2 | `createAccount` | POST | `/api/register` | `{client_id, client_secret, grant_type: "password", username, email, password}` | User object | None | Sends Passport OAuth credentials in body |
| 3 | `fetchUser` | GET | `/api/user` | None | User object | Bearer | Fetches full user profile, sets Sentry user |
| 4 | `sendResetPasswordRequest` | POST | `/api/password/email` | `{email}` | Success message | None | |
| 5 | `userLogin` | POST | `/oauth/token` | `{client_id, client_secret, grant_type: "password", username: email, password}` | `{access_token}` | None | **Passport OAuth token endpoint** |

### Images (images_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 6 | `deleteWebImage` | DELETE | `/api/photos/delete` | `params: {photoId}` | `{success: true}` | Bearer | |
| 7 | `getUntaggedImages` | GET | `/api/v2/photos/get-untagged-uploads` | None | `{photos: [...]}` | Bearer | |
| 8 | `uploadImage` | POST | `/api/photos/upload/with-or-without-tags` | FormData (photo, lat, lon, date, picked_up, model, tags?, custom_tags?) | `{success, photo_id}` | Bearer | multipart/form-data |
| 9 | `uploadTagsToWebImage` | POST | `/api/v2/add-tags-to-uploaded-image` | `{photo_id, tags, custom_tags, picked_up}` | `{success: true}` | Bearer | |

### Settings (settings_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 10 | `deleteAccount` | POST | `/api/settings/delete-account/` | `{password, token}` | `{success, msg}` | Bearer | Token sent in BOTH header and body |
| 11 | `saveSettings` | POST | `/api/settings/update/` | `{key, value}` | `{success: true}` | Bearer | **BUG: missing `return` before `rejectWithValue` on line 114** |
| 12 | `saveSocialAccounts` | PATCH | `/api/settings` | `{...values}` | `{message: "success"}` | Bearer | **BUG: missing `return` before `rejectWithValue` on line 153** |
| 13 | `toggleSettingsSwitch` | POST | `/api/settings/privacy/{endpoint}` | None | `{[key]: value}` | Bearer | Endpoint mapped from ID (4-10) |

### Teams (team_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 14 | `changeActiveTeam` | POST | `/api/teams/active` | `{team_id}` | `{success, team}` | Bearer | |
| 15 | `createTeam` | POST | `/api/teams/create` | `{name, identifier, team_type: 1}` | `{success, team}` | Bearer | |
| 16 | `inactivateTeam` | POST | `/api/teams/inactivate` | None | `{success}` | Bearer | |
| 17 | `leaveTeam` | POST | `/api/teams/leave` | `{team_id}` | `{activeTeam, team}` | Bearer | **BUG: fulfilled handler is empty (commented out)** |
| 18 | `getTeamMembers` | GET | `/api/teams/members` | `params: {team_id, page}` | `{result: paginated}` | Bearer | |
| 19 | `getTopTeams` | GET | `/api/teams/leaderboard` | None | Team array | Bearer | |
| 20 | `getUserTeams` | GET | `/api/teams/list` | None | `{success, teams}` | Bearer | |
| 21 | `joinTeam` | POST | `/api/teams/join` | `{identifier}` | `{success, activeTeam, team}` | Bearer | |

### Leaderboard (leaderboards_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 22 | `getLeaderboardData` | GET | `/global/leaderboard?timeFilter={value}` | None | `{success, ...data}` | None | **No `/api/` prefix — inconsistent** |

### My Uploads (my_uploads_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 23 | `fetchUploads` | GET | `/history/paginated` | params: loadPage, paginationAmount, filters | `{photos: paginated}` | Bearer | **No `/api/` prefix — inconsistent** |

### Shared (shared_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 24 | `checkAppVersion` | GET | `/api/mobile-app-version` | None | `{ios: {version}, android: {version}}` | None | |

### Stats (stats_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 25 | `getStats` | GET | `/api/global/stats-data` | None | `{total_litter, total_photos, total_users, littercoin, previousXp, nextXp}` | None | |

### Web (web_reducer.js)

| # | Thunk | Method | URL | Payload | Response | Auth | Notes |
|---|-------|--------|-----|---------|----------|------|-------|
| 26 | `loadMoreWebImages` | GET | `/api/v2/photos/web/load-more` | `params: {photo_id}` | Photo array | Bearer | **DEAD CODE: Never called. URL variable not imported (will ReferenceError).** |

**Total: 26 API thunks defined (25 functional, 1 dead code)**

---

## 3. Auth Mechanism

### Current Implementation: Laravel Passport (OAuth2 Password Grant)

**Login flow:**
1. User submits email + password
2. App POSTs to `/oauth/token` with `client_id`, `client_secret`, `grant_type: "password"`, `username`, `password`
3. Server returns `{access_token}` (OAuth2 Bearer token)
4. Token stored in AsyncStorage as key `"jwt"`
5. All subsequent requests use `Authorization: Bearer {token}` header
6. On app boot, `checkValidToken` POSTs stored token to `/api/validate-token`

**Registration flow:**
1. App POSTs to `/api/register` with OAuth client credentials + user info
2. On success, automatically calls `userLogin` with the same email/password

**Token persistence:**
- `redux-persist` persists the `auth` slice (including token) to AsyncStorage
- Token also explicitly stored at AsyncStorage key `"jwt"`
- On logout, `AsyncStorage.clear()` wipes everything

**Critical Issue: Backend Migration to Sanctum**
The backend has migrated from Passport to Sanctum. This means:
- `/oauth/token` endpoint may no longer exist or behave differently
- `client_id` and `client_secret` are Passport concepts — Sanctum does not use them
- Sanctum typically uses `/login` or `/api/login` with email+password, returning a plain-text token
- The `grant_type: "password"` field is meaningless to Sanctum
- `/api/validate-token` may still work if the backend kept it, but the login/register flows need rewriting

**What needs to change for Sanctum:**
- Remove `CLIENT_ID`, `CLIENT_SECRET`, `grant_type` from all auth requests
- Change login endpoint from `/oauth/token` to Sanctum's login route
- Change registration endpoint payload (remove OAuth fields)
- Token format may differ (Sanctum tokens are `{id}|{token}` format)
- Remove `client_id` and `client_secret` from `actions/types.js` and `.env` files

**Other auth issues:**
- `auth_reducer.js` exports `accountCreated` and `tokenIsValid` (lines 340, 345) which are not defined in the slice reducers — these will be `undefined` at runtime
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
│   ├── user: object | null (enhanced with level, xpRequired, targetPercentage, totalTags, totalLittercoin)
│   ├── serverStatusText: string
│   └── errors: object
│
├── camera
│   ├── lat: number
│   ├── lon: number
│   └── autoFocus: (referenced by CameraScreen but NOT in initial state — undefined)
│
├── gallery
│   ├── photos: array (CameraRoll photos)
│   └── lastCursor: string | null
│
├── images
│   ├── imagesArray: array (core image collection — gallery, camera, web)
│   ├── selectedImages: array (unused?)
│   ├── previousTags: array (max 10 recent tags)
│   ├── totalToUpload: number
│   ├── uploaded: number
│   ├── uploadFailed: number
│   ├── tagged: number
│   ├── taggedFailed: number
│   ├── errorMessage: string
│   └── failedCounts: { alreadyUploaded, invalidCoordinates, unknown }
│
├── my_uploads_reducer   ← NOTE: inconsistent key name (should be my_uploads or myUploads)
│   ├── uploads: array | { data, total, current_page, ... }
│   ├── loading: boolean
│   └── error: string | null
│
├── leaderboard
│   └── paginated: { users: array }
│
├── litter (UI state only, no API calls)
│   ├── category: string
│   ├── item: string
│   ├── quantity: number
│   ├── items: array
│   ├── previousTags: array
│   └── currentIndex: number
│
├── shared
│   ├── appVersion: object | null
│   ├── isSelecting: boolean
│   ├── isUploading: boolean
│   ├── selected: number
│   ├── showModal: boolean
│   └── showThankYouMessages: boolean
│
├── settings
│   ├── model: string
│   ├── settingsModalVisible: boolean
│   ├── secondSettingsModalVisible: boolean
│   ├── settingsEdit: boolean
│   ├── settingsEditProp: string
│   ├── wait: boolean
│   ├── dataToEdit: any
│   ├── deleteAccountError: string
│   ├── updateSettingsStatusMessage: string
│   └── updatingSettings: boolean
│
├── stats
│   ├── statsErrorMessage: string | null
│   ├── totalLitter: number
│   ├── totalPhotos: number
│   ├── totalUsers: number
│   ├── totalLittercoin: number
│   ├── targetPercentage: number
│   └── litterTarget: { previousTarget, nextTarget }
│
├── teams
│   ├── topTeams: array
│   ├── userTeams: array
│   ├── teamMembers: array
│   ├── teamsRequestStatus: string
│   ├── selectedTeam: object
│   ├── teamsFormError: string
│   ├── teamFormStatus: string | null
│   ├── successMessage: string
│   └── memberNextPage: number | null
│
└── web (DEAD — never read by any component)
    ├── count: number
    └── photos: array
```

### Key Data Flow Issues
- `my_uploads_reducer` uses a non-standard key name in combineReducers (line 7 of index.js)
- `web` slice is completely dead — no component reads from `state.web`
- `camera` slice has only `lat`, `lon` in its reducer but `CameraScreen` tries to read `autoFocus`, `type`, `zoom` — all undefined
- `shared.isSelecting` and `shared.selected` overlap with local state in `HomeScreen`
- `images.selectedImages` defined in initial state but never populated

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
        │   ├── GLOBAL → GlobalDataScreen
        │   ├── LEADERBOARD → LeaderboardsScreen
        │   └── USER_STATS → UserStatsScreen
        │
        ├── PERMISSION → PermissionStack
        │   ├── CAMERA_PERMISSION → CameraPermissionScreen
        │   └── GALLERY_PERMISSION → GalleryPermissionScreen
        │
        ├── ADD_TAGS → AddTags
        ├── ALBUM → GalleryScreen (NOTE: route name is misleading)
        ├── SETTING → SettingsScreen
        ├── UPDATE → NewUpdateScreen
        └── MY_UPLOADS → MyUploads
```

**Navigation Issues:**
- CameraScreen is defined in the codebase but NOT registered in any navigator — it is unreachable
- MapScreen is defined but NOT registered in any navigator — it is unreachable
- The `ALBUM` route renders `GalleryScreen`, not `AlbumScreen` — naming is confusing
- `GalleryRoutes.tsx` defines a stack with Gallery → Album, but this stack is not used in MainRoutes
- `PermissionStack` is only navigated to from HomeScreen and CameraScreen (which is dead)

---

## 6. Dependencies

### Production Dependencies (35 total)

| Package | Version | Status | Notes |
|---------|---------|--------|-------|
| `@react-native-async-storage/async-storage` | ^1.23.1 | OK | |
| `@react-native-camera-roll/camera-roll` | ^7.8.1 | OK | |
| `@react-native-clipboard/clipboard` | ^1.14.2 | OK | |
| `@react-native-community/datetimepicker` | ^8.2.0 | OK | |
| `@react-native-community/masked-view` | ^0.1.11 | **DEPRECATED** | Replace with `@react-native-masked-view/masked-view` |
| `@react-native-picker/picker` | ^2.7.7 | OK | |
| `@react-navigation/material-top-tabs` | ^6.6.13 | **OUTDATED** | v7 available |
| `@react-navigation/native` | ^6.1.17 | **OUTDATED** | v7 available |
| `@react-navigation/stack` | ^6.4.0 | **OUTDATED** | v7 available |
| `@reduxjs/toolkit` | ^2.2.6 | OK | |
| `@sentry/react-native` | ^5.24.1 | **OUTDATED** | v6 available |
| `@shopify/flash-list` | ^1.7.0 | OK | Installed but only used in TeamLeaderboardScreen |
| `axios` | ^1.7.2 | OK | |
| `formik` | ^2.4.6 | OK | |
| `i18next` | ^23.11.5 | OK | |
| `immer` | ^10.1.1 | OK | Redundant — RTK includes immer |
| `lottie-react-native` | ^6.7.2 | OK | Used in WelcomeScreen |
| `moment` | ^2.30.1 | **CONSIDER REPLACING** | Large bundle. Consider `date-fns` or `dayjs` |
| `react` | 18.2.0 | **OUTDATED** | RN 0.74 supports React 18.2 but 18.3 is available |
| `react-native` | 0.74.3 | **OUTDATED** | 0.76+ available with New Architecture |
| `react-native-actions-sheet` | ^0.9.6 | **UNUSED** | Not imported anywhere in the codebase |
| `react-native-config` | ^1.5.2 | OK | |
| `react-native-device-info` | ^11.1.0 | OK | |
| `react-native-gesture-handler` | ^2.20.0 | OK | |
| `react-native-linear-gradient` | ^2.8.3 | OK | |
| `react-native-localize` | ^3.2.0 | OK | Used in i18n.js |
| `react-native-maps` | ^1.15.6 | OK | Only used in dead MapScreen |
| `react-native-page-control` | ^1.1.2 | **POSSIBLY UNUSED** | May be replaced by custom dots |
| `react-native-pager-view` | ^6.3.3 | OK | Required by material-top-tabs |
| `react-native-permissions` | ^4.1.5 | OK | |
| `react-native-reanimated` | ^3.13.0 | OK | |
| `react-native-safe-area-context` | ^4.10.7 | OK | |
| `react-native-screens` | ^3.32.0 | OK | |
| `react-native-svg` | ^15.3.0 | OK | |
| `react-native-swipe-gestures` | ^1.0.5 | OK | |
| `react-native-swiper` | ^1.6.0 | **UNMAINTAINED** | Last publish 2020; consider `react-native-pager-view` |
| `react-native-vector-icons` | ^10.1.0 | OK | |
| `react-redux` | ^9.1.2 | OK | |
| `redux-persist` | ^6.0.0 | OK | |
| `redux-thunk` | ^3.1.0 | **REDUNDANT** | RTK includes redux-thunk by default |
| `use-count-up` | ^3.0.1 | OK | Used in GlobalDataScreen |
| `yup` | ^1.4.0 | OK | |

### Dev Dependencies (13 total)

| Package | Version | Status |
|---------|---------|--------|
| `@babel/core` | ^7.20.0 | OK |
| `@babel/preset-env` | ^7.20.0 | OK |
| `@babel/runtime` | ^7.20.0 | OK |
| `@react-native/babel-preset` | 0.74.85 | OK (matches RN version) |
| `@react-native/eslint-config` | 0.74.85 | OK |
| `@react-native/metro-config` | 0.74.85 | OK |
| `@react-native/typescript-config` | 0.74.85 | OK |
| `@types/react` | ^18.2.6 | OK |
| `@types/react-test-renderer` | ^18.0.0 | OK |
| `babel-jest` | ^29.6.3 | OK |
| `eslint` | ^8.19.0 | OK |
| `jest` | ^29.6.3 | OK |
| `prettier` | 2.8.8 | OK |
| `react-test-renderer` | 18.2.0 | OK |
| `redux-immutable-state-invariant` | ^2.1.0 | OK (dev-only) |
| `typescript` | 5.0.4 | **OUTDATED** | 5.4+ available |

### Unused/Dead Dependencies
1. `react-native-actions-sheet` — not imported anywhere
2. `react-native-maps` — only used in dead MapScreen (not registered in navigator)
3. `redux-thunk` — RTK includes it
4. `immer` — RTK includes it

---

## 7. Bugs and Dead Code

### Critical Bugs

**BUG-01: Permission check always passes (HomeScreen.js:114)**
```js
if (result === 'granted' || 'limited')
```
The string `'limited'` is always truthy. This means the gallery permission check never fails, and the app never navigates to the permission screen. Should be:
```js
if (result === 'granted' || result === 'limited')
```

**BUG-02: Auth uses Passport but backend now uses Sanctum**
- `userLogin` POSTs to `/oauth/token` with `client_id`, `client_secret`, `grant_type: "password"` — Sanctum does not use this endpoint or these fields
- `createAccount` sends OAuth credentials — irrelevant for Sanctum
- This is the #1 blocking issue for v7

**BUG-03: Missing `return` before `rejectWithValue` (settings_reducer.js:114, 153)**
In `saveSettings.fulfilled` and `saveSocialAccounts.fulfilled`, when `response.data.success` is falsy, the code calls `rejectWithValue('...')` without `return`. This means:
- The rejection is silently ignored
- The function continues and returns `undefined`
- The fulfilled case handler receives `undefined`, causing `state.updateSettingsStatusMessage = undefined`

**BUG-04: Stats.tsx reads wrong state path (Stats.tsx)**
```tsx
const user = useSelector(state => state.user);
```
Should be `state.auth.user`. `state.user` is always `undefined`, so the component renders nothing useful.

**BUG-05: SettingsComponent.js broken template literal (line ~218-219)**
The delete account error display renders a literal string `t(${deleteAccountError})` instead of calling the translation function properly.

**BUG-06: leaveTeam fulfilled handler is empty (team_reducer.js:422-434)**
When a user leaves a team, the API call succeeds but no state is updated — the team remains in `userTeams`, and `activeTeam` is not changed. All the reducer logic is commented out.

**BUG-07: Leaderboard error handler crashes (leaderboards_reducer.js:28)**
```js
return rejectWithValue(error.response.data);
```
If `error.response` is undefined (network error), this throws `TypeError: Cannot read property 'data' of undefined`.

### Moderate Bugs

**BUG-08: Exported non-existent actions (settings_reducer.js:336-337)**
`updateSettingsStatusMessage` and `startUpdatingSettings` are exported from `settingsSlice.actions` but are not defined in the reducers object. These will be `undefined`, and calling `dispatch(startUpdatingSettings())` will throw.

**BUG-09: Exported non-existent actions (team_reducer.js:501-503)**
`teamsFormError`, `teamsRequestError`, `teamsFormSuccess` are exported but their reducer definitions are commented out. Same issue as BUG-08.

**BUG-10: Exported non-existent actions (auth_reducer.js:340, 345)**
`accountCreated` and `tokenIsValid` are exported but not defined in the slice. Will be `undefined`.

**BUG-11: TopTeamsScreen fake loading (TopTeamsScreen.js)**
Uses `setTimeout(() => setIsLoading(false), 3000)` instead of tracking actual API loading state. Users always wait 3 seconds regardless of API speed.

**BUG-12: MyUploads references deprecated `result_string` (MyUploads.js:196)**
`item.result_string` is an old database column. If the backend no longer returns it, tags will never display.

**BUG-13: web_reducer `URL` not imported (web_reducer.js:21)**
`loadMoreWebImages` thunk uses `${URL}/api/v2/photos/web/load-more` but `URL` is never imported. Will throw `ReferenceError: URL is not defined` if ever called.

**BUG-14: web_reducer name collision (web_reducer.js:16 vs 52)**
The async thunk `loadMoreWebImages` and the reducer action `loadMoreWebImages` share the same name. The thunk export shadows the slice action export — the empty export `{}` on line 65 confirms the action is inaccessible.

**BUG-15: changeActiveTeam.fulfilled handler reads wrong payload shape (team_reducer.js:375)**
`state.userTeams.push(action.payload.team)` — but the thunk returns `response.data.team.id` (a number), not `{team, type}`. Will push `undefined`.

### Minor Bugs

**BUG-16: AlbumScreen async useEffect (AlbumScreen.js:12)**
```js
useEffect(async () => { ... }, []);
```
Passing an async function to useEffect is a React anti-pattern (returns a Promise instead of cleanup function).

**BUG-17: LitterBottomButtons delete disabled (LitterBottomButtons.tsx:112)**
The delete button's `onPress` handler is commented out. Users see a delete button that does nothing.

**BUG-18: Duplicate color definitions**
`utils/Colors.js` and `screens/components/theme/colors.ts` define overlapping but different color values for the same semantic names.

**BUG-19: LitterTagsCard inconsistent translation keys (LitterTagsCard.tsx)**
Uses `${lang}.litter.categories.${category}` with language prefix, but all other components use just `litter.categories.${category}`. This will produce wrong i18n lookups.

**BUG-20: deleteAccount sends token in both header and body (settings_reducer.js:33-38)**
```js
data: { password, token }    // token in body
headers: { Authorization: `Bearer ${token}` }  // token in header
```
Redundant and potentially confusing. Sanctum migration should clean this up.

### Dead Code

| Item | Location | Description |
|------|----------|-------------|
| CameraScreen | `screens/camera/CameraScreen.js` | Entire file is dead. Uses old class component with `connect(mapStateToProps, actions)`. `actions` only exports constants, not action creators. RNCamera code fully commented out. Not registered in any navigator. |
| MapScreen | `screens/map/MapScreen.js` | Entire file is dead. Stub class component with empty map (all features hidden via `visibility: 'off'`). Uses `connect(null, actions)`. Not registered in any navigator. |
| web_reducer | `reducers/web_reducer.js` | Entire slice is dead. No component reads `state.web`. The thunk has a missing import (`URL`). |
| `actions/` directory | `actions/types.js` | The `actions/` pattern is legacy. No action creators exist — only type exports. Multiple files `import * as actions from '../../actions'` expecting action creators but get only constants. |
| `react-native-actions-sheet` | `package.json` | Installed dependency never imported. |
| `react-native-maps` | `package.json` | Only used in dead MapScreen. |
| `GalleryRoutes.tsx` | `routes/GalleryRoutes.tsx` | Defines Gallery→Album stack navigator but it's never used — MainRoutes uses GalleryScreen directly. |
| `images.selectedImages` | `reducers/images_reducer.js` | In initial state but never populated or read. |
| `shared.isSelecting` / `shared.selected` | `reducers/shared_reducer.js` | In state but HomeScreen uses local useState instead. |

---

## 8. Build and Config

### Environment Configuration
- Uses `react-native-config` to load `.env` files
- Required env variables:
  ```
  CURRENT_ENVIRONMENT=production|local
  SECRET_CLIENT=<passport_client_secret>
  ID_CLIENT=<passport_client_id>
  OLM_ENDPOINT=<api_base_url>
  LOCAL_SECRET_CLIENT=<local_passport_secret>
  LOCAL_ID_CLIENT=<local_passport_id>
  LOCAL_OLM_ENDPOINT=<local_api_url>
  SENTRY_DSN=<sentry_dsn>  (referenced in App.tsx)
  ```
- Local environment hardcodes `http://olm.test` as endpoint (line 33 of types.js), ignoring `LOCAL_OLM_ENDPOINT`
- `console.log({ CURRENT_ENVIRONMENT })` left in production code (types.js:16)
- Client credentials logged to console in non-production (types.js:37-40) — security concern for debug builds

### Build Scripts
```json
"scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "lint": "eslint .",
    "start": "react-native start",
    "test": "jest"
}
```
No build, release, or codepush scripts. No CI/CD config files found.

### iOS
- `reactNativePermissionsIOS` in package.json: Camera, LocationAccuracy, LocationWhenInUse, PhotoLibrary
- CocoaPods managed via Gemfile
- `ios/Podfile.lock` has local modifications (per git status)
- `ios/openlittermap.xcodeproj/project.pbxproj` has local modifications

### Android
- Standard React Native Android setup
- Permissions handled via `react-native-permissions`
- No `proguard-rules.pro` customizations noted

### Tests
- Jest configured with `react-native` preset
- **No test files exist in the codebase** — `jest.config.js` is present but there are zero `*.test.*` or `*.spec.*` files

### TypeScript
- Mixed JS/TS codebase (most files are `.js`, some components are `.tsx`)
- `tsconfig.json` extends `@react-native/typescript-config`
- No strict mode enabled
- TypeScript 5.0.4 (outdated)

---

## 9. Feature State

| Feature | Screen(s) | Reducer(s) | API Calls | Status | Rating |
|---------|-----------|------------|-----------|--------|--------|
| **User Auth (Login/Signup)** | AuthScreen, SigninForm, SignupForm | auth | 3 | Login/signup forms work with Formik+Yup validation. **BLOCKED: Passport→Sanctum migration needed.** | 3/10 |
| **Password Reset** | ForgotPasswordForm | auth | 1 | Form works, sends email. Depends on Passport auth. | 5/10 |
| **Gallery Photo Selection** | GalleryScreen, AlbumScreen | gallery, images | 0 | CameraRoll access, gesture selection, album browsing. Permission check bug (BUG-01) bypassed but gallery still works. | 7/10 |
| **Image Upload** | HomeScreen | images, shared | 2 | Core flow: select → tag → upload. Sequential upload with progress. Cancel support. Error tracking. This is the most complete feature. | 7/10 |
| **Litter Tagging** | AddTags, LitterCategories, etc. | litter, images | 0 | 13 categories, quantity picker, custom tags, previous tags recall. Swiper navigation between images. Mostly works. Stats component broken (BUG-04). Delete button disabled (BUG-17). | 6/10 |
| **Upload History** | MyUploads | my_uploads_reducer | 1 | Paginated list with filters (date, tag, custom tag). Swipe actions (copy link, open map). Uses deprecated `result_string` field (BUG-12). | 5/10 |
| **Teams** | TeamScreen, TeamDetails, TopTeams | teams | 8 | Create, join, leave, view members, leaderboard. Leave team broken (BUG-06). Fake loading in TopTeams (BUG-11). Non-existent action exports (BUG-09). | 5/10 |
| **Leaderboards** | LeaderboardsScreen | leaderboard | 1 | Time-filtered leaderboard display. Error handling crashes on network error (BUG-07). Uses non-standard URL prefix. | 6/10 |
| **Global Stats** | GlobalDataScreen | stats | 1 | Animated counters for total litter, photos, users, littercoin. Progress bar to next milestone. Clean implementation. | 8/10 |
| **User Profile** | UserStatsScreen | auth | 0 | Displays user level, XP, tag counts, settings link. Navigation to MyUploads. | 7/10 |
| **Settings** | SettingsScreen, SettingsComponent | settings, auth | 4 | Edit name/username/email, privacy toggles, social accounts, delete account. Missing returns (BUG-03). Broken error display (BUG-05). | 5/10 |
| **Camera Capture** | CameraScreen | camera | 0 | **COMPLETELY BROKEN.** Class component, RNCamera commented out, uses dead `actions` import. Not reachable via navigation. | 0/10 |
| **Map View** | MapScreen | — | 0 | **STUB.** Empty map with all features hidden. Not reachable via navigation. | 0/10 |
| **App Version Check** | NewUpdateScreen, HomeScreen | shared | 1 | Checks backend for latest version, prompts user to update. Works. | 7/10 |
| **Internationalization** | All screens | — | 0 | 8 languages (en, de, nl, fr, es, pt, ca, et). Inconsistent key usage in LitterTagsCard. | 6/10 |
| **Welcome/Onboarding** | WelcomeScreen, Slides | — | 0 | 4 slides with Lottie animations and dot pagination. Clean implementation. | 8/10 |
| **Permissions** | CameraPermission, GalleryPermission | — | 0 | Handles camera, photo library, location permissions. Android 13+ handled correctly. | 7/10 |

---

## 10. Honest Assessment

### What Works
The core workflow — pick photos from gallery, tag them with litter categories, upload to the API — is functional and reasonably well-built. The Redux Toolkit migration from the old actions/types pattern is mostly complete. The gallery selection, image tagging UI (swiper, categories, custom tags), and upload flow are the strongest parts of the app. Internationalization covers 8 languages. The onboarding flow is polished.

### What's Broken
1. **Auth is the #1 blocker.** The entire auth flow is built for Laravel Passport (OAuth2 password grant), but the backend has moved to Sanctum. Login/signup will not work against the current backend. This affects every authenticated feature.
2. **Camera is dead.** The in-app camera was never migrated from the old class component + `react-native-camera` pattern. RNCamera code is fully commented out. The screen is not registered in any navigator. This would need a full rewrite (react-native-vision-camera is the current standard).
3. **Map is a stub.** It renders an empty MapView with all features hidden. Not registered in any navigator.

### Prioritized Bug List

**P0 — App Won't Function:**
1. BUG-02: Auth Passport→Sanctum mismatch (all authenticated features blocked)

**P1 — Features Broken:**
2. BUG-03: Missing `return` before `rejectWithValue` in settings (settings silently fail)
3. BUG-04: Stats.tsx reads `state.user` instead of `state.auth.user` (component shows nothing)
4. BUG-06: leaveTeam fulfilled handler empty (team leave appears to work but state not updated)
5. BUG-07: Leaderboard error handler crashes on network error
6. BUG-12: MyUploads references deprecated `result_string` column

**P2 — Degraded Experience:**
7. BUG-01: Permission check always passes (masks permission issues)
8. BUG-05: SettingsComponent broken error display for delete account
9. BUG-08/09/10: Exported non-existent actions (will crash if dispatched)
10. BUG-11: TopTeamsScreen hardcoded 3-second loading
11. BUG-15: changeActiveTeam pushes wrong payload shape to userTeams
12. BUG-17: LitterBottomButtons delete is disabled

**P3 — Cleanup:**
13. BUG-13/14: web_reducer dead code with missing import and name collision
14. BUG-16: Async useEffect in AlbumScreen
15. BUG-18: Duplicate color definitions
16. BUG-19: LitterTagsCard inconsistent i18n keys
17. BUG-20: Token sent in both header and body for deleteAccount
18. Console.log of environment/credentials in types.js
19. Dead code: CameraScreen, MapScreen, web_reducer, GalleryRoutes, unused deps

### Salvageability Verdict

**The app is salvageable.** The core architecture (Redux Toolkit, React Navigation v6, functional components with hooks) is sound and modern enough. The gallery → tag → upload pipeline works. The main effort is:

1. **Auth rewrite for Sanctum** (~1-2 days) — Replace Passport OAuth flow with Sanctum token auth. Remove client_id/client_secret. Update login, register, and token validation endpoints.

2. **Fix the P1 bugs** (~1 day) — These are mostly one-line fixes (add `return`, fix state paths, add optional chaining, uncomment reducer logic).

3. **Camera rewrite** (~2-3 days) — Full rewrite using `react-native-vision-camera`. New functional component, GPS capture, integrate with existing images_reducer.

4. **Map implementation** (~2-3 days) — Rewrite MapScreen as functional component, show user's litter data points, integrate with navigation.

5. **Dead code cleanup** (~half day) — Remove CameraScreen, MapScreen (old versions), web_reducer, unused deps, GalleryRoutes.

**Estimated total to reach a shippable v7: 7-10 days of focused work.**

The codebase does NOT need a rewrite from scratch. The reducer layer, navigation structure, and UI components are a solid foundation. Fix auth first, fix the bugs, then build the camera and map features fresh.
