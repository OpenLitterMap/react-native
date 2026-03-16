# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenLitterMap is a React Native mobile app (iOS & Android) for crowdsourced litter mapping. Users photograph litter, tag it by category, and upload geotagged data to the OpenLitterMap Laravel backend API.

**App Version:** 7.0.0 | **React Native:** 0.84.1 | **Branch:** `openlittermap/v7` (main: `main5`)

## Quick Start

```bash
npm install                              # Install dependencies
npm start                                # Start Metro bundler
npm run ios                              # Run on iOS
npm run android                          # Run on Android
cd ios && bundle exec pod install && cd ..  # Install iOS native pods
npm run lint                             # ESLint
npm test                                 # Jest (no tests exist yet)
```

Runtime: **Node v22.22.1**, **npm 10.9.4** (prefer npm over yarn) — RN 0.84 requires Node ≥ 22.11

## Core User Flow

```
Gallery → Select photos → Tag each photo → Upload → Server
```

1. **Gallery** (`GalleryScreen`) — Browse camera roll, select geotagged photos (non-GPS photos blocked)
2. **Home** (`HomeScreen`) — View selected photos in grid, tap to tag, tap upload to start
3. **Tag** (`AddTagScreen`) — Full-screen image viewer with search/browse for litter tags, materials, brands
4. **Upload** (`HomeScreen`) — Two-step: upload photo binary → POST tags. Sequential with progress tracking.

## Architecture

### Navigation (3 bottom tabs)

```
MainRoutes (Stack)
├── [No token] AuthStack → WelcomeScreen → AuthScreen
└── [Has token]
    ├── TabRoutes (3 tabs)
    │   ├── HOME → HomeScreen
    │   ├── TEAM → TeamStack (TeamScreen, TopTeams, TeamDetails, TeamLeaderboard)
    │   └── USER_STATS → ProfileScreen
    ├── ADD_TAGS → AddTagScreen (modal)
    ├── ALBUM → GalleryScreen (modal)
    ├── SETTING → SettingsScreen (modal)
    ├── PERMISSION → PermissionStack
    ├── UPDATE → NewUpdateScreen (modal)
    └── MY_UPLOADS → MyUploads (modal)
```


### State Management — Redux Toolkit (14 slices)

| Slice | File | Key Data | Persisted |
|-------|------|----------|-----------|
| `auth` | `auth_reducer.js` | token, user profile | Yes |
| `photos` | `photos_reducer.js` | imagesArray (local gallery photos + tags), editingPhoto, swiperIndex | Yes (imagesArray only) |
| `serverPhotos` | `server_photos_reducer.js` | untaggedCount, untaggedPreview, editTagsOnPhoto thunk | No |
| `uploadFlow` | `upload_flow_reducer.js` | uploadPhase, counters, modal state, uploadImage/postTagsToPhoto thunks | No |
| `gallery` | `gallery_reducer.js` | CameraRoll photos, GPS metadata | No |
| `tags` | `tags_reducer.js` | Search index, materials, brands (cached 7-day TTL) | AsyncStorage cache |
| `teams` | `team_reducer.js` | User teams, team members, top teams | No |
| `uploads` | `uploads_reducer.js` | Upload history (My Uploads), stats | No |
| `settings` | `settings_reducer.js` | User preferences, privacy toggles | No |
| `shared` | `shared_reducer.js` | App version | No |
| `stats` | `stats_reducer.js` | Global statistics | No |
| `leaderboard` | `leaderboards_reducer.js` | Leaderboard data | No |
| `locations` | `locations_reducer.js` | Location hierarchy | No |

Store configured in `store/index.js` with `redux-persist` (AsyncStorage backend). In dev mode, `redux-immutable-state-invariant` middleware is included.

### Litter Data Model (CLO Tags)

Tag data is fetched from `GET /api/tags/all` and cached in AsyncStorage (`tags_cache_v5`, 7-day TTL).

**Key concept — `cloId`** (category_litter_object_id): Unique ID for an (object, category) pair. Objects like "bottle" exist in multiple categories (alcohol, beverages) and are disambiguated by cloId.

Per-image tags stored as:
```js
image.tags = [{ cloId, quantity, materials: [id,...], brands: [{id, quantity}], customTags: ['...'] }]
image.customTags = ['...']  // Image-level custom tags (merged into first tag on upload)
image.picked_up = true
```

Display names resolved at render time from `state.tags.entriesByCloId[cloId]`.

### Upload Flow

Two-step process orchestrated in `HomeScreen.js`:
1. **Upload photo** → `POST /api/v3/upload` (FormData with photo + GPS) → returns `photo_id`
2. **POST tags** → `POST /api/v3/tags` (photo_id + resolved tags via `buildTagsPayload`)

Pre-upload: GPS validation via `isGeotagged()` (rejects null, 0,0). Uploaded images bypass GPS check.
On failure: image stays with `uploaded: true` + `tags` intact for retry (tag-only path).
On 401: axios interceptor signals abort via `uploadAbortReason('token-expired')`, recovery flow after re-login.
Cancel: `AbortController` aborts the in-flight axios request, resets `uploadPhase` to idle, closes modal.

**Custom-tag-only images**: When an image has only custom tags (no CLO tags), `buildTagsPayload` sends `{ custom: true, key: "tag-text" }` entries per the backend's `ClassifyTagsService` spec. Custom tags are validated: 3–100 chars, `/^[\w\s:-]+$/`.

### Auth — Laravel Sanctum

- Login: `POST /api/auth/token` with `{identifier, password}` → returns `{token, user}`
- Token stored in AsyncStorage key `"jwt"` and Redux `state.auth.token`
- All requests use `Authorization: Bearer {token}` via axios
- On boot: `checkValidToken` validates stored JWT, **awaits** `fetchUser` before rendering
- `fetchUser` retries 2× with 1s/3s backoff for transient errors (timeout, network, 5xx). Only clears session on 401.
- Global 401 interceptor in `utils/setupAxiosInterceptors.js` (30s timeout)

## API Endpoints (31 total)

All endpoints verified against Laravel backend. See `readme/AUDIT.md` §2 for complete table with payload/response details.

| Area | Endpoints | Key Routes |
|------|-----------|------------|
| Auth | 5 | `/api/auth/token`, `/api/auth/register`, `/api/user/profile/index`, `/api/validate-token`, `/api/password/email` |
| Images | 4 | `/api/v3/upload`, `/api/v3/tags` (POST & PUT), `/api/v3/user/photos` |
| My Uploads | 3 | `/api/v3/user/photos`, `/api/v3/user/photos/stats`, `/api/profile/photos/delete` |
| Tags | 1 | `/api/tags/all` |
| Teams | 8 | `/api/teams/{create,join,leave,active,inactivate,members,leaderboard,list}` |
| Settings | 4 | `/api/settings/update/`, `/api/settings` (PATCH), `/api/settings/privacy/{endpoint}`, `/api/settings/delete-account/` |
| Other | 6 | Leaderboard, stats, app version, locations (2), XP levels |

## File Organization

```
├── actions/types.js          # Environment config, API URL selection
├── store/index.js            # Redux store + persist config
├── reducers/                 # 14 Redux slices (all use createSlice + createAsyncThunk)
├── routes/                   # React Navigation v6 navigators
├── screens/
│   ├── home/                 # HomeScreen (upload orchestration) + homeComponents/
│   ├── addTag/               # AddTagScreen + components/ (TagPills, TagSearchBar, TagDetailSheet, etc.)
│   ├── gallery/              # GalleryScreen + galleryComponents/
│   ├── auth/                 # WelcomeScreen, AuthScreen + authComponents/
│   ├── team/                 # TeamScreen, TeamDetailsScreen, TopTeamsScreen, TeamLeaderboardScreen
│   ├── userStats/            # UserStatsScreen + userComponents/ (MyUploads, ProgressCircleCard)
│   ├── profile/              # ProfileScreen + helpers/
│   ├── setting/              # SettingsScreen + settingComponents/
│   ├── permission/           # CameraPermissionScreen, GalleryPermissionScreen
│   ├── components/           # Shared: theme/, typography/, Button, Header, CustomTextInput, etc.
│   └── NewUpdateScreen.js
├── utils/
│   ├── gps.js                # GPS coordinate validation (isValidGpsCoords)
│   ├── isGeotagged.js        # Image GPS check (uses gps.js)
│   ├── isTagged.js           # Check image has CLO/custom tags
│   ├── readGpsFromExif.js    # Android EXIF GPS fallback
│   ├── buildTagsPayload.js   # Convert tags → POST format
│   ├── classifyError.js      # Classify upload errors for UI + Sentry
│   ├── getTagsFromBackend.js # Convert backend new_tags → local tags
│   ├── formatKey.js          # snake_case → Title Case
│   ├── setupAxiosInterceptors.js  # Global 401 handler + 30s timeout
│   ├── dayjs.js              # dayjs plugins
│   └── permissions/          # Camera, camera roll, location permission helpers
├── assets/langs/             # 8 languages: en, ar, de, es, fr, ie, nl, pt
│   └── {lang}/               # {lang}.json (flat UI strings) + litter.json (nested litter taxonomy)
└── i18n.js                   # i18next configuration
```

## Internationalization

i18next with `react-i18next`. Translation keys are **full British English string literals** (key = English display text).

- UI strings: `assets/langs/{lang}/{lang}.json` — flat structure, sorted A-Z
- Litter taxonomy: `assets/langs/{lang}/litter.json` — nested by category, 174 keys per language
- Access: `t('Your string')` for UI, `t('litter.smoking.butts')` for litter

**When adding a new user-facing string:** Add to `en/en.json` (key = value), then translate and add to ALL 7 other language files. Keep sorted A-Z.

**When adding a new litter key:** Add to `en/litter.json` in the appropriate section, then translate and add to ALL other `litter.json` files.

## Restricted Files

- **`.env`** — NEVER read, modify, or delete. Contains production secrets, signing keys, and credentials used by build tooling outside the JS codebase.
- **`.gitignore`** — Do not read or modify.

## Code Style

- ESLint: `@react-native` config, 4-space indentation
- Prettier: single quotes, no bracket spacing, arrow parens avoided, trailing commas
- Mixed JS/TS (newer files tend to be TypeScript)
- Screens export via barrel files (`index.js` or `index.ts`)

## Key Dependencies

- `@shopify/flash-list` — performant lists
- `formik` + `yup` — form handling/validation
- `react-native-gesture-handler` v2 + `react-native-reanimated` v3 — image viewer gestures
- `react-native-permissions` — camera/location/photo library (iOS permissions in `reactNativePermissionsIOS` in package.json)
- `@sentry/react-native` — error tracking (production only)
- `@lodev09/react-native-exify` — Android EXIF GPS fallback
- `dayjs` — date formatting
- `lottie-react-native` — onboarding animations

## Local Development

- **Laravel**: `http://0.0.0.0:8000` (serves on all interfaces), web via `olm.test` (Laravel Valet)
- **Minio**: `http://127.0.0.1:9000` (S3-compatible storage)
- **Mobile API**: `http://192.168.1.28:8000` (LAN IP in `actions/types.js`)
- **Minio image URLs**: Stored as `http://127.0.0.1:9000/...` which the phone can't reach. `ImageViewer.js` rewrites `127.0.0.1` to the LAN host in dev builds. Long-term fix: set `AWS_URL=http://192.168.1.28:9000/olm-public` in Laravel `.env`.
- See `readme/LocalDev.md` for full setup details including tag data structure.

## Known Issues

- **BUG-11**: `TopTeamsScreen` uses fake 3s loading instead of actual API loading state
- **No test coverage**: Jest configured but no test files exist
- **Upload state consolidated**: Upload modal + phase now in single `uploadFlow` slice (formerly split across `shared` and `images`)

## Build Notes

- **Xcode 26+/macOS Tahoe**: Sentry Cocoa SDK < 8.46.0 fails to compile. The `postinstall` script patches the RNSentry podspec to use 8.46.0. After `npm install`, run `cd ios && pod update Sentry && cd ..` if `Podfile.lock` still references an older version.
- After modifying native dependencies: clean Xcode build folder (Cmd+Shift+K) and rebuild.

## Deep-Dive Documentation

Detailed documentation for each feature area lives in `readme/`:

| File | Covers |
|------|--------|
| `AUDIT.md` | **Start here** — Complete file inventory, all 31 API endpoints with payloads/responses, Redux state map, navigation tree, bug tracker, dependency list |
| `MobileUpload.md` | Upload flow, two-step process, GPS validation, error classification, retry behavior |
| `MobileTagging.md` | CLO tagging system, search index, tag pills, detail sheet, category colors, XP estimate |
| `MobileGallery.md` | Camera roll access, GPS detection, EXIF fallback, pagination strategies, gesture selection |
| `MobileAuth.md` | Sanctum auth, onboarding UI, animated slides, password strength, language picker |
| `MobileTeams.md` | Team CRUD, members, leaderboard |
| `MobileSettings.md` | Settings, privacy toggles, account deletion |
| `MobileNavigation.md` | Navigation structure (authoritative — 3 tabs, not 5) |
| `MobilePermissions.md` | iOS/Android permission handling |
| `MobileMyUploads.md` | Upload history, filters, swipe actions |
| `BackendAPI.md` | Backend API architecture and field mappings |
| `BackendMobileApi.md` | Mobile-specific API contracts |
| `BackendTagging.md` | Backend tagging architecture, XP calculation |
| `BackendTagsConfig.md` | Backend TagsConfig source of truth |
| `BackendLocations.md` | Backend location resolution (design doc) |
| `XP.md` | XP formula — backend awards correctly; mobile preview is incomplete (doesn't handle special object bonuses) |
| `GPS_AUDIT.md` | GPS handling audit (thorough, accurate) |
| `LocalDev.md` | Local development setup, tag data structure |
