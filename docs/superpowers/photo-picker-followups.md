# Photo-picker migration — follow-ups (post-Codex review, 2026-06-09)

Triaged from Codex's review of `fix/photo-picker-migration`. Items already fixed on
the branch are NOT listed here (see commits). This file tracks what was deliberately
deferred or needs a decision.

## Needs a product decision (do NOT implement blind)

### F1 — Auto-upload after tagging? (Codex "High")
**Finding:** there is no auto-upload-on-focus. `uploadPhotos` is invoked only by the
manual "Upload (N)" bar (`HomeScreen.js`) and the retry timer (`useUploadPhotos.js`).
No `useFocusEffect`/focus listener triggers upload in `screens/home/`.
**Key fact:** this is **pre-existing, not a migration regression** — `openlittermap/v7`'s
HomeScreen had the same manual bar and no focus trigger. CLAUDE.md (lines 28, 33) and
`readme/MobileUpload.md` (lines 5, 32) claim auto-upload-on-focus; those docs are
**stale/aspirational** — the code has never done it on this branch or its base.
**Decision needed:**
- (A) Wire the documented behaviour: add a HomeScreen `useFocusEffect` that calls
  `uploadPhotos()` when returning after tagging (matches the docs; clears the queue
  automatically), OR
- (B) Keep the manual "Upload (N)" bar as the intended UX and **correct the 4 stale
  doc claims** to match.
Owner: maintainer. Until decided, code + docs are left as-is.

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
