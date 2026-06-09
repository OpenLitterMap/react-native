# TODO — Dependency Upgrades

Last reviewed: 2026-06-08

## Completed (RN 0.84 upgrade)

The full RN 0.74 → 0.84 upgrade is **done** — React 19, New Architecture (iOS + Android), Expo removed, iOS builds on Xcode 26, and all `@react-native*` / navigation / reanimated / screens / permissions / storage / camera-roll / svg / lottie packages bumped. Per-package version history is in git.

## Still TODO (post-upgrade)

- [x] `@shopify/flash-list` 1 → 2 — Done (on 2.3.1). v2 rewrite; `estimatedItemSize` removed (auto-sizing). HomeScreen dashboard + inbox grid migrated.
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

---

# TODO — Photo flow (see `readme/Considerations.md`)

- [ ] **Add Photos on large selections** — batch the per-pick EXIF GPS reads + show a "Reading photos…" indicator instead of a silent sequential wait
- [x] **Tap-to-tag loads the whole fetched set, incl. non-geotagged** — done (v7.9.0): non-geotagged tiles are inert and only geotagged photos enter the swipe queue

---

# TODO — i18n

- [ ] **Full translation pass** — ~68 runtime UI strings exist in `en.json` but are missing from the 7 non-English files (camera, geolink, privacy, permissions, onboarding, plus the new `Already Added` / "already in your list" strings). Non-English users fall back to English for these. Translate + add to all 7 files, keep A–Z sorted.
