# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenLitterMap is a React Native mobile app (iOS & Android) for crowdsourced litter mapping. Users photograph litter, tag it by category, and upload geotagged data to the OpenLitterMap Laravel backend API.

**App Version:** 7.11.1 | **React Native:** 0.84.1 | **Branch:** `openlittermap/v7` (main: `main5`)

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
HomeScreen Dashboard → Tap photo → Tag → Tap "Upload (N)" bar
```

1. **Home** (`HomeScreen`) — dashboard as a single virtualized `FlashList` (fixed sections in `ListHeaderComponent`, inbox photos as data): Global Impact stats, Your Impact stats, Uploaded (untagged server photos), "Your Photos" (a **persistent geotagged-only to-tag queue** sourced from `photos.imagesArray` — local camera captures + system-photo-picker imports; no camera-roll scan). "Add Photos" opens the OS picker; non-geotagged picks surface in a dismissible no-GPS card instead of entering the queue.
2. **Tag** (`AddTagScreen`) — Full-screen image viewer with search/browse for litter tags, materials, brands
3. **Upload** — Tagged photos surface an **"Upload (N)" bar** on HomeScreen; tapping it runs the upload (orchestrated by `useUploadPhotos`, with a retry path). There is **no** auto-upload-on-focus — tracked as a future enhancement (`docs/superpowers/photo-picker-followups.md` F1). Two-step: upload photo binary → PUT tags (replace/idempotent).

## Architecture

### Navigation (3 bottom tabs)

native-stack throughout; a bottom-tab bar for the 3 main tabs. Full tree + presentation rules in `readme/Navigation.md`.

```
MainRoutes (NativeStack) — 3-way: no-token / onboarding / app
├── [No token]               AuthStack → WelcomeScreen → AuthScreen
├── [Onboarding incomplete]  OnboardingStack
└── [App]
    ├── TabRoutes (3 bottom tabs)
    │   ├── HOME → HomeScreen
    │   ├── TEAM → TeamStack (TeamScreen, TopTeams, TeamDetails, TeamLeaderboard)
    │   └── USER_STATS → ProfileScreen
    ├── ADD_TAGS → AddTagScreen                       (push)
    ├── SETTING → SettingScreen                       (push)
    ├── QUICK_TAGS_SETTINGS → QuickTagsSettingsScreen (push)
    ├── MY_UPLOADS → MyUploads                        (push)
    └── UPDATE → NewUpdateScreen                      (fullScreenModal)
```


### State Management — Redux Toolkit (14 slices)

| Slice | File | Key Data | Persisted |
|-------|------|----------|-----------|
| `auth` | `auth_reducer.js` | token, user profile | Yes |
| `photos` | `photos_reducer.js` | imagesArray (local camera captures + picker imports + tags), editingPhoto, swiperIndex; `selectInboxPhotos` feeds the "Your Photos" queue | Yes (imagesArray only) |
| `serverPhotos` | `server_photos_reducer.js` | untaggedCount, untaggedPreview, editTagsOnPhoto thunk | No |
| `uploadFlow` | `upload_flow_reducer.js` | uploadPhase, counters, modal state, uploadImage/addTagsToPhoto thunks | No |
| `tags` | `tags_reducer.js` | Search index, materials, brands (cached 7-day TTL) | AsyncStorage cache |
| `quickTags` | `quick_tags_reducer.js` | User quick tag presets (cloId, customName, quantity, materials, brands) | Yes |
| `teams` | `team_reducer.js` | User teams, team members, top teams | No |
| `uploads` | `uploads_reducer.js` | Upload history (My Uploads), stats | No |
| `settings` | `settings_reducer.js` | User preferences, privacy toggles | No |
| `shared` | `shared_reducer.js` | App version | No |
| `stats` | `stats_reducer.js` | Global statistics | Yes |
| `leaderboard` | `leaderboards_reducer.js` | Leaderboard data | No |
| `locations` | `locations_reducer.js` | Location hierarchy | No |

Store configured in `store/index.js` with `redux-persist` (AsyncStorage backend). In dev mode, `redux-immutable-state-invariant` middleware is included.

### Litter Data Model (CLO Tags)

Tag data is fetched from `GET /api/tags/all` and cached in AsyncStorage (`tags_cache_v7`, 7-day TTL).

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
2. **Write tags** → `PUT /api/v3/tags` (photo_id + resolved tags via `buildTagsPayload`). PUT = replace, so retries are idempotent; `photo_id` is guarded by `isServerPhotoId`.

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

## API Endpoints (33 total)

The mobile app consumes these endpoints; full request/response contracts are in `readme/BackendMobileApi.md`.

| Area | Endpoints | Key Routes |
|------|-----------|------------|
| Auth | 5 | `/api/auth/token`, `/api/auth/register`, `/api/user/profile/index`, `/api/validate-token`, `/api/password/email` |
| Images | 2 | `/api/v3/upload`, `/api/v3/tags` (PUT = replace) |
| Tags | 1 | `/api/tags/all` |
| My Uploads / Photos | 5 | `/api/v3/user/photos`, `/api/v3/user/photos/stats`, `/api/v3/user/photos/locations`, `/api/v3/photos/{id}/visibility` (PATCH), `/api/profile/photos/delete` |
| Quick Tags | 2 | `/api/v3/user/quick-tags` (GET & PUT), `/api/v3/user/top-tags` |
| Teams | 8 | `/api/teams/{create,join,leave,active,inactivate,members,leaderboard,list}` |
| Settings | 4 | `/api/settings/update/`, `/api/settings` (PATCH), `/api/settings/privacy/{endpoint}`, `/api/settings/delete-account/` |
| Other | 6 | `/api/leaderboard`, `/api/global/stats-data`, `/api/mobile-app-version`, `/api/locations/country`, `/api/locations/{type}/{id}`, `/api/levels` |

## File Organization

```
├── utils/config.js           # Environment config, API URL selection (react-native-config)
├── store/index.js            # Redux store + persist config
├── reducers/                 # 14 Redux slices (all use createSlice + createAsyncThunk)
├── routes/                   # React Navigation v7 navigators (native-stack + bottom-tabs)
├── screens/
│   ├── home/                 # HomeScreen (4-section dashboard) + homeComponents/
│   ├── addTag/               # AddTagScreen + components/ (TagPills, TagSearchBar, TagDetailSheet, etc.)
│   ├── auth/                 # WelcomeScreen, AuthScreen + authComponents/
│   ├── team/                 # TeamScreen, TeamDetailsScreen, TopTeamsScreen, TeamLeaderboardScreen
│   ├── userStats/            # UserStatsScreen + userComponents/ (MyUploads, ProgressCircleCard)
│   ├── profile/              # ProfileScreen + helpers/
│   ├── setting/              # SettingsScreen, QuickTagsSettingsScreen + settingComponents/
│   ├── onboarding/           # OnboardingStack screens (post-signup priming + tutorial)
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
- `react-native-gesture-handler` v2 + `react-native-reanimated` v4 — image viewer gestures
- `react-native-image-picker` v8 — system photo picker (Android Photo Picker / iOS PHPicker); fills the "Your Photos" queue, permission-free
- `react-native-permissions` — camera/location only (iOS permissions in `reactNativePermissionsIOS` in package.json; no photo-library permission)
- `@sentry/react-native` — error tracking (production only)
- `@lodev09/react-native-exify` — reads GPS EXIF from picked photos (RNIP doesn't return location)
- `dayjs` — date formatting
- `lottie-react-native` — onboarding animations

## Local Development

- **Laravel**: `http://0.0.0.0:8000` (serves on all interfaces), web via `olm.test` (Laravel Valet)
- **Minio**: `http://127.0.0.1:9000` (S3-compatible storage)
- **Mobile API**: `http://192.168.1.28:8000` (LAN IP via `.env`, read in `utils/config.js`)
- **Minio image URLs**: Stored as `http://127.0.0.1:9000/...` which the phone can't reach. `ImageViewer.js` rewrites `127.0.0.1` to the LAN host in dev builds. Long-term fix: set `AWS_URL=http://192.168.1.28:9000/olm-public` in Laravel `.env`.
- See `readme/LocalDev.md` for full setup details including tag data structure.

## Known Issues

- **No test coverage**: Jest configured but no test files exist
- **Upload state consolidated**: Upload modal + phase now in single `uploadFlow` slice (formerly split across `shared` and `images`)

## Build Notes

- **Xcode 26+/macOS Tahoe**: Sentry Cocoa SDK < 8.46.0 fails to compile. The `postinstall` script patches the RNSentry podspec to use 8.46.0. After `npm install`, run `cd ios && pod update Sentry && cd ..` if `Podfile.lock` still references an older version.
- After modifying native dependencies: clean Xcode build folder (Cmd+Shift+K) and rebuild.

### Sentry symbolication (dSYM upload)

Without uploaded debug symbols, native crashes and **App Hang** events arrive
unsymbolicated (`<unknown>` frames, "required debug information file was missing").
The iOS target has an **"Upload Debug Symbols To Sentry"** build phase
(`project.pbxproj`) that runs `@sentry/react-native/scripts/sentry-xcode-debug-files.sh`.
It is guarded to **skip Debug builds and any environment where `SENTRY_AUTH_TOKEN`
is unset**, so it never breaks a local/un-configured build.

To activate (Release/Archive builds):
1. Fill `ios/sentry.properties` (`defaults.org`, `defaults.project`) — or set
   `SENTRY_ORG` / `SENTRY_PROJECT`. The file holds **no token**.
2. Export `SENTRY_AUTH_TOKEN` in the build/CI environment (never commit it).
3. Archive/Release-build → dSYMs upload automatically.

Backfill an existing build's symbols (e.g. to symbolicate a current production
hang) without rebuilding:
`SENTRY_AUTH_TOKEN=… npm run ios:upload-dsyms -- <path-to-dSYMs>`
(dSYMs live in the `.xcarchive`'s `dSYMs/` folder or DerivedData). App Hang
tracking itself is already on by default in `@sentry/react-native`.

**Coverage (verified):** three sources, all uploaded on release builds:
- **App binary** (+ statically-linked pods like Reanimated): the
  archive `dSYMs/` folder contains only `openlittermap.app.dSYM`, uploaded by the
  build phase above.
- **React & Hermes frames**: these are **prebuilt vendored frameworks** in RN
  0.84.1 (`React-Core-prebuilt`, `hermes-engine`) — **not** a `DEBUG_INFORMATION_FORMAT`
  (dwarf) setting; the dwarf hypothesis was checked and refuted (Pods Release is
  `dwarf-with-dsym`). No dSYM *file* is produced, but the prebuilt **release
  artifact tarballs** (`ios/Pods/{ReactNativeCore,hermes-engine}-artifacts/*-release.tar.gz`)
  carry symbol tables whose Debug IDs match the shipped build, and
  `ios/sentry-upload-framework-symbols.sh` (run from the same build phase) uploads
  them. So React/Hermes frames symbolicate too.

## Deep-Dive Documentation

Detailed documentation for each feature area lives in `readme/`:

| File | Covers |
|------|--------|
| `BackendMobileApi.md` | **API contract (canonical)** — the 33 endpoints the app consumes, with request/response shapes |
| `Navigation.md` | **Navigation (authoritative)** — navigator tree, presentation rules, patterns |
| `MobileUpload.md` | Upload flow, two-step process, GPS validation, error classification, retry behavior |
| `MobileTagging.md` | CLO tagging system, search index, tag pills, detail sheet, category colors, XP estimate |
| `MobileGallery.md` | "Your Photos" picker-fed to-tag queue, geotagged-only invariant, no-GPS card |
| `MobileAuth.md` | Sanctum auth, boot flow, password strength, language picker |
| `MobileTeams.md` | Team CRUD, members, leaderboard |
| `MobileSettings.md` | Settings, privacy toggles, account deletion |
| `MobileMyUploads.md` | Upload history, filters, edit-tags + visibility swipe actions |
| `MobilePermissions.md` | iOS/Android permission handling |
| `Onboarding.md` | Post-signup onboarding flow, permissions, tagging, upload, GPS instructions |
| `Architecture.md` | Architecture review: tagging layout, hooks, Fabric rules, persistence |
| `Considerations.md` | Known UX sharp edges (large selections, persistence size) |
| `XP.md` | XP formula — backend awards correctly; mobile preview is incomplete |
| `Translations.md` | i18n structure, litter taxonomy, adding keys/languages |
| `TODO.md` | Tracked follow-ups (e.g. i18n string gaps) |
| `LocalDev.md` | Local-dev setup, `/api/tags/all` shape + cloId mechanics |
| `BackendAPI.md` | Backend API surface map (mobile-relevant; defers to BackendMobileApi.md) |
| `BackendTagging.md` | Tag API contract (cloId, tag payloads, response format) |
| `BackendTagsConfig.md` | Tag catalogue summary (`/api/tags/all`); canonical source in backend repo |
| `BackendLocations.md` | The 2 location endpoints the app calls |
| `BackendQuickTags.md` | Quick-tags endpoints (GET/PUT) + mobile sync notes |

## BOOP

When the user says "BOOP", perform all of the following:

1. Determine if the change is a new feature (minor bump) or a fix/improvement (patch bump). Ask if unsure
2. Bump the appropriate version in `package.json` **and the native build configs** so the in-app version (`DeviceInfo.getVersion()`) matches: iOS `MARKETING_VERSION` (both configs in `ios/openlittermap.xcodeproj/project.pbxproj`) + bump `CURRENT_PROJECT_VERSION`; Android `versionName` + bump `versionCode` in `android/app/build.gradle`. Keep all three `*VERSION`/`versionName` values equal to `package.json`.
3. Append a one-line entry to `readme/changelog/YYYY-MM-DD.md` (today's date)
4. Update any readme docs (`readme/*.md`) affected by the changes
5. Update any skills files affected by the changes
