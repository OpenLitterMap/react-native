# OpenLitterMap — Mobile App

OpenLitterMap is a React Native app (iOS & Android) for **crowdsourced litter
mapping**. Users photograph litter, tag it by category / material / brand, and
upload the geotagged data to the OpenLitterMap backend.

- **App version:** see [`package.json`](package.json) · **React Native:** 0.84.1 (New Architecture, Hermes)
- **Branch:** `openlittermap/v7` (main: `main5`)

## Quick Start

```bash
npm install                                  # install JS deps
cd ios && bundle exec pod install && cd ..   # install iOS pods
npm start                                     # Metro bundler
npm run ios                                   # run on iOS
npm run android                               # run on Android
npm run lint                                  # ESLint
```

Runtime: **Node ≥ 22.11** (RN 0.84 requirement), npm ≥ 10.

## Core Flow

Home dashboard → tap a geotagged photo → tag it → auto-upload on return to Home.

## Documentation

- **[`CLAUDE.md`](CLAUDE.md)** — **start here.** Architecture, Redux slices,
  navigation, the upload & tagging model, API summary, code style, and build notes.
  The single source of truth for contributors and AI agents.
- **[`readme/`](readme/)** — feature deep-dives: upload, tagging, gallery inbox,
  auth, teams, settings, permissions, onboarding, navigation, i18n, XP, local-dev
  setup, and the backend API contract the app consumes.
- **[`readme/changelog/`](readme/changelog/)** — dated release notes.
