# Follow-up ticket: symbolicate React & Hermes framework frames in Sentry

**Status:** open / not started — **out of scope for the app-binary dSYM commit
(`b67ffde`).** File this in the tracker; do not fold into that PR.

## Problem
Native **App Hang** (and crash) events symbolicate the app's own ("In App")
frames now that the app-binary dSYM uploads (`b67ffde`), but **framework frames
stay `<unknown>`**:

- `React` — live-issue Debug ID `d00148e9-c543-3833-9954-545a9320d357`
- `hermesvm` — live-issue Debug ID `6e514185-5f03-3593-a83c-305c186b6600`

## Root cause (verified)
RN **0.84.1** (New Architecture) ships these as **prebuilt binaries**, not
compiled locally:
- `React-Core-prebuilt`, `ReactNativeDependencies` (see `ios/Podfile.lock`)
- `hermes-engine` `250829098.0.9` — prebuilt `hermesvm.xcframework`, stripped, no dSYM

So **no `React.framework.dSYM` or `hermesvm` dSYM is produced by the build**, and
the archive `dSYMs/` folder contains only `openlittermap.app.dSYM` (verified across
15 local archives). The app-binary upload can't cover what the build never emits.

## Acceptance criteria
React.framework and hermesvm frames in the App Hang issue resolve to real symbols
(verify the two Debug IDs above are present in Sentry → Settings → Debug Files,
and the issue re-symbolicates).

## Approach options (pick one; spike first)
1. **Fetch the matching prebuilt dSYMs and upload them** (preferred — no build
   change). Locate the published dSYMs for `react-native@0.84.1` /
   `hermes-engine 250829098.0.9` (RN release artifacts / Maven `*-dSYM`/`-debug`
   packages), then upload with the existing tooling. These are per-version, so a
   match is only valid for the exact RN/Hermes build shipped to the affected users.
2. **Build React Native / Hermes from source** so dSYMs are generated locally and
   the existing "Upload Debug Symbols To Sentry" build phase picks them up.
   Trade-off: substantially slower CI/builds. Opt out of prebuilt
   (`RCT_USE_PREBUILT_RNCORE=0` / Hermes `BUILD_FROM_SOURCE`) — confirm exact flags
   for 0.84.

## How to verify a candidate dSYM before uploading
```bash
# the Debug ID printed must equal the live-issue ID for that framework
node_modules/@sentry/cli/bin/sentry-cli debug-files check <path>/React.framework.dSYM   # want d00148e9-...
node_modules/@sentry/cli/bin/sentry-cli debug-files check <path>/hermesvm.framework.dSYM # want 6e514185-...
```
Then upload (token via env, org/project from `ios/sentry.properties`):
```bash
SENTRY_AUTH_TOKEN=… npm run ios:upload-dsyms -- <folder-containing-matching-dSYMs>
```

## Notes
- The existing 51-event hang is **fix-forward** — no local archive contains either
  Debug ID, so it can't be backfilled from this machine even after sourcing dSYMs
  (the dSYMs would need to match that exact shipped build).
- The actionable frame for that hang is the app binary, which `b67ffde` covers on
  future releases.
