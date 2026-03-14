# TODO — Dependency Upgrades

Last reviewed: 2026-03-14

## Completed (RN 0.84 upgrade)

- [x] `react-native` 0.74.3 → 0.84.1
- [x] `react` 18.3 → 19.x
- [x] `@react-native/*` (babel-preset, eslint-config, metro-config, typescript-config) 0.74 → 0.84
- [x] `@react-navigation/*` v6 → v7 + `react-native-screens` 3 → 4
- [x] `@sentry/react-native` 5 → 8 (`tracePropagationTargets` set to `[]` to avoid header injection)
- [x] `react-native-linear-gradient` upgraded to v2.8.3 (Expo dropped — not compatible with RN 0.84)
- [x] `react-native-actions-sheet` 0.9 → 10 (ref API still works, SheetManager migration optional)
- [x] `react-native-reanimated` 3 → 4.3.0-rc.0 + `react-native-worklets` 0.8.0-rc.0
- [x] `react-native-safe-area-context` 4.10 → 5.x
- [x] `react-native-pager-view` 6.3 → 7.x
- [x] `lottie-react-native` 6.7 → 7.x
- [x] `react-native-permissions` 4 → 5
- [x] `react-native-device-info` 11 → 14
- [x] `react-native-gesture-handler` 2.24 → 2.30
- [x] `react-native-svg` 15.11 → 15.15
- [x] `@react-native-camera-roll/camera-roll` 7.9 → 7.10
- [x] `@react-native-async-storage/async-storage` 1 → 2
- [x] Android: New Architecture enabled, Jetifier removed, SDK 36, Kotlin 2.1, NDK 27
- [x] iOS: platform 15.1, New Architecture enabled, Expo removed
- [x] TabRoutes.tsx: material-top-tabs v7 prop renames
- [x] iOS build succeeds (Xcode 26.3)

## Still TODO (post-upgrade)

- [ ] `@shopify/flash-list` 1 → 2 — Ground-up rewrite, `estimatedItemSize` removed (auto-sizing)
- [ ] `@react-native-async-storage/async-storage` 2 → 3 — Breaking API changes
- [ ] `eslint` 8 → 9 — Must migrate `.eslintrc` to flat config (`eslint.config.js`)
- [ ] `i18next` 23 → 25 — `initImmediate` renamed to `initAsync`, check `i18n.js`
- [ ] `typescript` 5.0 → 5.9 — May surface new type errors
- [ ] `prettier` 2 → 3 — `trailingComma` default changes to `"all"`
- [ ] actions-sheet: migrate ref-based API → SheetManager (2 files, optional — refs still work)
- [ ] Upgrade reanimated/worklets to stable when 4.3.0 releases
- [ ] Android build verification

---

# TODO — Phase 4 Mobile Features

- [ ] **Public profile screen** — View other users' profiles (stats, recent uploads, level)
- [ ] **Location-scoped leaderboards** — Leaderboards filtered by city/country/region
- [ ] **Achievements display** — Show earned achievements/badges on profile
- [ ] **User photo map** — Map view of the current user's uploaded photos
