# TODO — Dependency Upgrades

Last reviewed: 2026-03-01

## Quick Wins (low risk, no blockers)

- [ ] `react-native-safe-area-context` 4.10 → 5.x — No API changes, only requires RN ≥ 0.74
- [ ] `react-native-pager-view` 6.3 → 8.x — API-compatible, iOS rewritten in SwiftUI
- [ ] `lottie-react-native` 6.7 → 7.x — No code changes from 6.7, adds Fabric support
- [ ] `i18next` 23 → 25 — `initImmediate` renamed to `initAsync`, check `i18n.js`
- [ ] `typescript` 5.0 → 5.9 — Smooth incremental path, may surface new type errors
- [ ] `prettier` 2 → 3 — `trailingComma` default changes to `"all"`, pin it to match ESLint config (`"none"`)

## Upgrade With Care (individual PRs, test each)

- [ ] `react-native-permissions` 4 → 5 — Requires Xcode 16, Android codebase rewritten in Kotlin. No API changes to call sites.
- [ ] `react-native-device-info` 11 → 15 — `getUniqueId()` changed from per-user to per-device in v12 (audit usage). Requires `compileSdk 34+` in v15.
- [ ] `react-native-actions-sheet` 0.9 → 10 — `payload` → `returnValue`, `onChange` signature changed. Peer deps (reanimated, safe-area-context) already present.
- [ ] `eslint` 8 → 9 — Must migrate `.eslintrc` to flat config (`eslint.config.js`). Migration CLI tool available (`@eslint/migrate-config`).

## React Native Upgrade (big coordinated project)

Upgrade path: **0.74 → 0.76 → 0.78 → 0.82 → 0.84**

### What we get
- New Architecture (Fabric/TurboModules) — enabled by default from 0.76
- React 19 — ships from 0.78 (hooks changes, `forwardRef` no longer needed, new `use()` API)
- Hermes V1 — 10-15% faster Time to Interactive, smaller memory footprint (default from 0.84)
- Precompiled iOS builds — up to 10x faster build times (default from 0.84)
- Metro v0.82 — up to 3x faster startup via deferred hashing (from 0.79)
- Legacy architecture fully removed in 0.82

### Platform version changes
| RN Version | Android min | iOS min |
|------------|-------------|---------|
| 0.74 (current) | API 23 (Android 6) | 13.4 |
| 0.76+ | **API 24 (Android 7)** | **15.1** |

### Packages unlocked by the RN upgrade
These cannot be upgraded until React Native is upgraded:

- [ ] `react-native` 0.74 → 0.84
- [ ] `react` 18.3 → 19.x (required from RN 0.78)
- [ ] `@react-native/*` (babel-preset, eslint-config, metro-config, typescript-config) 0.74 → 0.84
- [ ] `@react-navigation/*` v6 → v7 — `navigate()` no longer pops back (use `popTo()`), nested navigation requires explicit parent screen, option renames (`headerBackTitleVisible` → `headerBackButtonDisplayMode`, `animationEnabled` → `animation`, etc.), custom themes need `fonts` property
- [ ] `react-native-screens` 3 → 4 — Coupled with React Navigation v7
- [ ] `react-native-reanimated` 3 → 4 — New Architecture only. `react-native-worklets` becomes required peer dep, `useAnimatedGestureHandler` removed, `withSpring` behavior changed
- [ ] `@shopify/flash-list` 1 → 2 — New Architecture only. Ground-up rewrite, `estimatedItemSize` removed (auto-sizing), `MasonryFlashList` replaced by `<FlashList masonry>`, ref type changed
- [ ] `@sentry/react-native` 5 → 8 — Requires iOS 15+. Would remove the postinstall Cocoa SDK hack. JS SDK jumps v7→v10, `tracePropagationTargets` default changes (may inject headers into axios requests — set explicitly after upgrade)
- [ ] `lottie-react-native` 7 → latest with React 19 support
- [ ] `react-native-pager-view` 8 → latest
- [ ] `@react-native-async-storage/async-storage` 1 → 3

## Audit Status

- 8 low severity vulnerabilities remaining (all `fast-xml-parser` in RN CLI — only fixable by upgrading react-native)
- All semver-compatible updates applied as of 2026-03-01

## Other Notes

- `moment` is referenced in CLAUDE.md but not in package.json — was replaced by `dayjs`
- `packageManager` field in package.json still references `yarn@3.6.4` — using npm locally

---

# TODO — Phase 4 Mobile Features

- [ ] **Public profile screen** — View other users' profiles (stats, recent uploads, level)
- [ ] **Location-scoped leaderboards** — Leaderboards filtered by city/country/region
- [ ] **Achievements display** — Show earned achievements/badges on profile
- [ ] **User photo map** — Map view of the current user's uploaded photos
