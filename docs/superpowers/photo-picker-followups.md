# Photo-picker migration — follow-ups (post-Codex review, 2026-06-09)

Triaged from Codex's review of `fix/photo-picker-migration`. Items already fixed on
the branch are NOT listed here (see commits). This file tracks what was deliberately
deferred or needs a decision.

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

## 6-star UX pass (Codex "Medium" ×2) — bounded, pending approval

> Reported, not yet implemented — the maintainer asked to approve UX changes first.
> Do these as one tight pass, no scope creep.

### F2 — No-GPS card: per-row → summary count
`NoGpsPicksCard` (`InboxSection.js`) renders one thumbnail row per skipped photo.
Selecting ~100 screenshots ⇒ a wall of rows pushing the queue offscreen.
**Proposed:** collapse to a summary ("N photos skipped — no location data") with maybe
the first 1–3 thumbnails + "and N more", dismissible. Keep the per-photo intent (still
tells them which/how many) without the unbounded list.

### F3 — Bounded "Reading photo locations…" progress for large multi-selects
`selectionLimit: 0` allows unlimited picks; `handleSelectMore` then reads EXIF
serially with a 5 s timeout each and no progress UI — a large/corrupt selection can
look frozen.
**Proposed:** a lightweight import state with progress (e.g. "Reading 12/80…"),
bounded concurrency for the EXIF reads, optional cancel, and a final summary
(imported / no-GPS / failed). Keep it tight.

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
- `includeExtra: true` removed from both picker calls (permission-free hygiene; we
  don't need timestamp/id — GPS comes from `readGpsFromExif`). It never injected a
  manifest permission, so compliance was not actually at risk via it.
- `selectInboxPhotos` now uses `isValidGpsCoords(lat, lon)` (was `lat != null`),
  matching the import/upload guard; covered by a new test case.
- Native cleanup: debug `AndroidManifest.xml` storage perms removed; `ios/Podfile`
  `setup_permissions` dropped `'PhotoLibrary'` (the authoritative removal for a
  bare-Podfile setup — needs `pod install`); orphan `NSAppleMusicUsageDescription`
  (which held photo copy, no MPMediaLibrary usage) removed from `Info.plist`.
- HEIC GPS: added to the on-device test matrix in the spec (Phase 0 §2) with an
  `assetRepresentationMode: 'current'` fallback — verified on-device, not changed on a
  guess.

## Lint note
Repo-wide `npm run lint` = 354 problems (262 errors / 92 warnings) — **entirely
pre-existing** (untouched `screens/userStats/*` etc.). Every file this branch changed
lints to 0 errors (one pre-existing warning in `OnboardingCameraScreen.js:23`,
untouched line). The branch introduced **zero** new lint problems; baseline is not to
be mass-fixed.
