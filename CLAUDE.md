# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenLitterMap is a React Native mobile app (iOS & Android) for crowdsourced litter mapping. Users photograph litter, tag it by category, and upload geotagged data to the OpenLitterMap Laravel backend API. Authentication uses Laravel Sanctum token-based auth (login with email or username).

## Common Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on iOS / Android
npm run ios
npm run android

# Install iOS native dependencies
cd ios && bundle exec pod install && cd ..

# Lint
npm run lint

# Run tests
npm test

# Run a single test file
npx jest path/to/test.js
```

Runtime: **Node v20.20.0**, **npm 10.8.2**

Package manager: **npm** (v10.8.2). Both `yarn.lock` and `package-lock.json` exist; prefer npm.

## Architecture

### State Management

Redux Toolkit with `createSlice` and `createAsyncThunk`. The store is configured in `store/index.js` with `redux-persist` (AsyncStorage backend, `auth` and `images` slices persisted). The `images` transform only persists `imagesArray` — upload counters reset on relaunch. In dev mode, `redux-immutable-state-invariant` middleware is included.

Reducers in `reducers/`:
- `auth_reducer` - Authentication, user profile, JWT token management
- `tags_reducer` - Tag data fetched from API, search index (objectEntries, categoriesById, entriesByCloId)
- `camera_reducer` / `gallery_reducer` / `images_reducer` - Photo capture, selection, v5 tagging (tagsV5), swiperIndex
- `shared_reducer` - Cross-feature shared state
- `settings_reducer` - User preferences
- `stats_reducer` / `leaderboards_reducer` - Statistics and rankings
- `team_reducer` - Team features
- `my_uploads_reducer` - Upload management

API calls use **axios** with Bearer token auth, hitting endpoints on the `URL` from `actions/types.js`.

### Navigation

React Navigation v6 with `@react-navigation/stack` and `@react-navigation/material-top-tabs`.

- `routes/MainRoutes.js` - Root navigator. Shows `AuthStack` when no token, otherwise the main app stack.
- `routes/AuthStack.js` - Welcome → Auth (login/signup) flow.
- `routes/TabRoutes.tsx` - Bottom tab navigator: Home, Team, Global Data, Leaderboards, User Stats.
- `routes/PermissionStack.tsx` - Camera/gallery permission request flow.
- Modal screens: AddTagScreen, Album, Settings, Update, MyUploads.

### Screen Organization

Each screen lives in `screens/<feature>/` with a main screen component and a subdirectory for sub-components (e.g., `screens/home/homeComponents/`, `screens/addTag/components/`, `screens/userStats/userComponents/`).

Shared/reusable components are in `screens/components/` with barrel exports via `index.ts`:
- `theme/colors.ts` - App color palette (`Colors.accent`, `Colors.error`, etc.)
- `theme/fonts.ts` - Font definitions
- `typography/` - Styled text components (Title, SubTitle, Body, Caption, StyledText)
- `Button.tsx`, `Header.js`, `AnimatedCircle.tsx`, `StatsGrid`, `IconStatsCard`, `CustomTextInput`

### Environment Configuration

Uses `react-native-config` to load `.env` variables. Key env vars defined in `actions/types.js`:
- `CURRENT_ENVIRONMENT` - `"production"` or `"local"`
- `SECRET_CLIENT` / `ID_CLIENT` / `OLM_ENDPOINT` - Production OAuth credentials and API URL
- `LOCAL_SECRET_CLIENT` / `LOCAL_ID_CLIENT` / `LOCAL_OLM_ENDPOINT` - Local dev equivalents
- `SENTRY_DSN` - Error tracking (only initialized in production)

### Internationalization

i18next with `react-i18next`. Configured in `i18n.js`. Translation keys are **full British English string literals** (key = English display text). All translation files use a single flat JSON structure with keys sorted alphabetically A-Z. See `Translations.md` for full architecture details.

Translation files live in `assets/langs/` with 8 languages: en, ar, de, es, fr, ie, nl, pt. Each language directory contains `{lang}.json` (flat UI strings), `litter.json` (nested litter taxonomy), and `index.js`.

The `litter.json` files use a nested structure with 15 sections (categories, 12 litter categories, materials, types) derived from the backend `TagsConfig`. Keys are snake_case identifiers matching the backend. Access via `t('litter.smoking.butts')`, `t('litter.materials.plastic')`, etc. Unlike UI strings, litter keys are **translated per language** — each language has its own `litter.json` with identical keys but translated values (174 key-value pairs per language).

**When adding a new user-facing string:** Add the key to `en/en.json` (key = value for English), then translate and add it to ALL other language files (`ar.json`, `de.json`, `es.json`, `fr.json`, `ie.json`, `nl.json`, `pt.json`). Keep all files sorted alphabetically A-Z by key. Use `t('Your new string')` or `dictionary="Your new string"` in code.

**When adding a new litter key:** Add it to `en/litter.json` in the appropriate section, then translate and add it to ALL other `litter.json` files. Keep keys sorted alphabetically within each section.

### Litter Data Model

Tag data is fetched from the API (`GET /api/tags/all`) and cached in AsyncStorage (7-day TTL) by `tags_reducer.js`. Per-image tags are stored as `tagsV5: [{ cloId, quantity, materials, brands, customTags }]` in `images_reducer`. The `cloId` (category_litter_object_id) uniquely identifies an (object, category) pair. Display names are resolved at render time from `entriesByCloId`. Materials and brands are indexed by ID in `materialsById` and `brandsById`. Image-level custom tags (`image.customTags`) are stored separately and merged into the first tag's `custom_tags` on upload.

## Code Style

- ESLint extends `@react-native` with 4-space indentation and no trailing commas
- Prettier: single quotes, no bracket spacing, arrow parens avoided, trailing commas
- Mixed JS/TS codebase (newer files tend to be TypeScript)
- Screens export via barrel files (`index.js` or `index.ts`)

## Key Dependencies

- `@shopify/flash-list` for performant lists
- `react-native-maps` for map display
- `formik` + `yup` for form handling/validation
- `lottie-react-native` for animations
- `react-native-permissions` for camera/location/photo library permissions (iOS permissions listed in `reactNativePermissionsIOS` in package.json)
- `@sentry/react-native` for error tracking (production only). Sentry Cocoa SDK version is overridden to 8.46.0+ via `postinstall` script for Xcode 26 compatibility
- `dayjs` for date formatting

## Build Notes

- **Xcode 26+/macOS Tahoe**: Sentry Cocoa SDK < 8.46.0 fails to compile (`std::allocator does not support const types`). The `postinstall` script in package.json patches the RNSentry podspec to use 8.46.0. After `npm install`, run `cd ios && pod update Sentry && cd ..` if the `Podfile.lock` still references an older version.
- After modifying native dependencies: clean Xcode build folder (Cmd+Shift+K) and rebuild
