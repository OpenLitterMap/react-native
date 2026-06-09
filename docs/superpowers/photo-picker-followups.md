# Photo-picker migration — follow-ups (post-Codex review, 2026-06-09)

Triaged from Codex's review of `fix/photo-picker-migration`. Items already fixed on
the branch are NOT listed here (see commits). This file tracks what was deliberately
deferred or needs a decision.

## Release-blocking QA (on device, before shipping)

The migration's correctness depends on `readGpsFromExif(asset.uri)` recovering GPS from
RNIP's cache/`file://` path once the broad permission is gone — **unverified in this
environment**. Treat the following as **release-blocking, not optional**:

- **GPS survives the picker** — pick a known-geotagged photo via "Add Photos"; it must
  land in the queue, not the no-GPS card. Run the **source/format matrix**: JPEG,
  **HEIC/HEIF**, iOS Live Photo, iCloud-only (not-yet-downloaded), on **Android 13 and
  14**, in a **release** build. If HEIC loses GPS, set `assetRepresentationMode:
  'current'` on the picker calls and re-test (spec §2).
- **Capture time** — an imported photo's date must reflect when it was TAKEN (EXIF),
  not when imported. (Import time is used only for photos with no EXIF date.)
- **Known behaviour (PM-aware):** EXIF carries no timezone, so `parseExifCaptureTime`
  (`readGpsFromExif.js`) interprets capture time as **device-local**. Accepted.
- **Merged manifest** — confirm a *fresh* release build declares no
  `READ_MEDIA_IMAGES`/`READ_EXTERNAL_STORAGE`/`WRITE_EXTERNAL_STORAGE` (the artifact in
  `android/app/build/` is stale and still shows the old set).

## Decided this review

### F1 — Auto-upload-on-focus (Codex "High") — DECISION: keep the manual bar (B)
**Finding:** there is no auto-upload-on-focus. `uploadPhotos` is invoked only by the
manual "Upload (N)" bar (`HomeScreen.js`) and the retry timer (`useUploadPhotos.js`).
**Pre-existing, not a migration regression** — `openlittermap/v7`'s HomeScreen had the
same manual bar and no focus trigger; the docs that claimed auto-upload were stale.
**Decided 2026-06-09:** keep the manual "Upload (N)" bar as the shipping behaviour; the
stale claims in `CLAUDE.md` and `readme/MobileUpload.md` have been **corrected** to
describe it.
**Future ticket (NOT this release):** optionally add a HomeScreen `useFocusEffect` that
calls `uploadPhotos()` on return after tagging so the queue clears automatically —
weigh against accidental/duplicate uploads. Out of scope for this branch.

### F0 — Capture-time regression from dropping `includeExtra` — FIXED
Removing `includeExtra` also dropped `asset.timestamp`, so gallery imports briefly
stamped **import time** (`Date.now()`) instead of **capture time** — a dataset-integrity
bug. Fixed by reading the capture date from the same EXIF pass as GPS: `readGpsFromExif`
now returns `takenAt` (epoch seconds from `DateTimeOriginal` → `DateTimeDigitized` →
`DateTime`), and `handleSelectMore` uses `meta.takenAt ?? Date.now()`. Falls back to
import time only when the photo carries no EXIF date. Covered by
`__tests__/utils/readGpsFromExif.test.js`. (Onboarding was unaffected — it always
stamped `Date.now()` via `addOnboardingPhoto`.)

## 6-star UX pass (Codex "Medium" ×2) — DONE 2026-06-09 (commit 0387e68)

> Implemented as one bounded pass — F2 + F3 only; dedupe (F4) and auto-upload (F1)
> untouched.

### F2 — No-GPS card: per-row → summary count
`NoGpsPicksCard` (`InboxSection.js`) renders one thumbnail row per skipped photo.
Selecting ~100 screenshots ⇒ a wall of rows pushing the queue offscreen.
**Done:** `NoGpsPicksCard` now shows `"Couldn't add — no location data" (N)` + up to 3
thumbnails with a "+N" overflow tile, dismissible. Bounded regardless of pick count.

### F3 — Bounded "Reading photo locations…" progress for large multi-selects
`selectionLimit: 0` allows unlimited picks; `handleSelectMore` then reads EXIF
serially with a 5 s timeout each and no progress UI — a large/corrupt selection can
look frozen.
**Done:** `ImportProgressModal` shows "Reading photo locations… (n/total)" with Cancel
for batches > 6; EXIF reads run at concurrency 6 (was one-at-a-time). Cancel stops
further reads and keeps what's read. Imported land in the queue; no-GPS in the F2 card.
(Read-failures fold into no-GPS via `readGpsFromExif` returning null — no separate
"failed" bucket.)

## Ticket — not in this branch

### F4 — Filename-only dedupe can drop distinct photos (Codex "Medium")
`photos_reducer.js` `isDuplicate` treats any same `filename` as a duplicate, so two
different `IMG_0001.jpg` files silently fail to import with no "skipped duplicate"
feedback. **Pre-existing behaviour, not introduced by this migration**, and changing
the dedupe key is its own change with its own test surface — so it's filed, not fixed
here.
**Proposed fix (separate branch):** composite key — picker id/local identifier + URI +
`filename + fileSize + width + height + timestamp` (and possibly GPS) — plus explicit
"skipped duplicate" feedback. Add tests around the picker handler with mocked
`launchImageLibrary` + `readGpsFromExif`.

## Already addressed on the branch (for reference)
- `includeExtra: true` removed from both picker calls (permission-free hygiene; it
  never injected a manifest permission, so compliance was not actually at risk via it).
  It *did* supply `asset.timestamp` — now replaced by EXIF `takenAt` from
  `readGpsFromExif` (see F0). Only `id` went unused (falls back to the uri).
- `selectInboxPhotos` now uses `isValidGpsCoords(lat, lon)` (was `lat != null`),
  matching the import/upload guard; covered by a new test case.
- Native cleanup: debug `AndroidManifest.xml` storage perms removed; `ios/Podfile`
  `setup_permissions` dropped `'PhotoLibrary'` (the authoritative removal for a
  bare-Podfile setup — needs `pod install`); orphan `NSAppleMusicUsageDescription`
  (which held photo copy, no MPMediaLibrary usage) removed from `Info.plist`.
- HEIC GPS: added to the on-device test matrix (see "Release-blocking QA" above) with
  an `assetRepresentationMode: 'current'` fallback if HEIC drops GPS — **to be verified
  on-device before release**, not changed on a guess.

## Lint note
Repo-wide `npm run lint` = 354 problems (262 errors / 92 warnings) — **entirely
pre-existing** (untouched `screens/userStats/*` etc.). Every file this branch changed
lints to 0 errors (one pre-existing warning in `OnboardingCameraScreen.js:23`,
untouched line). The branch introduced **zero** new lint problems; baseline is not to
be mass-fixed.
