# Upload & Tagging Spec — Idempotent Upload + Idempotent Tagging

**Status:** DRAFT for review (mobile agent + Laravel agent)
**Owners:** Mobile (React Native) ↔ Backend (Laravel)
**Goal:** Eliminate two related production bugs by making both the upload and the
tag-post steps **idempotent**, so a lost-response retry can never corrupt state.

---

## 1. Background — the two bugs

The app uploads in two steps: `POST /api/v3/upload` (binary + GPS) returns a
`photo_id`, then the app posts tags with that id. `imagesArray` (the local inbox)
is persisted, and the upload loop re-runs on every HomeScreen focus, retrying any
photo it still considers unfinished.

**Bug P1 — stranded photo id (the Sentry report).**
`POST /api/v3/tags` → 422 **"The photo id field must be an integer."**
(~494 events / 11 users). When an upload is rejected as a duplicate, the backend
returns a 422 **with no `photo_id`**. The app has no server id to tag with, so it
falls back to a local placeholder id — a string like `"onboarding_…"` or a local
counter — and posts *that*. A string fails the `integer` rule → 422 forever
(persisted record, retried every focus).

**Bug P2 — double-tagging on retry (found during backend review).**
`POST /api/v3/tags` **appends** tags; it does not replace them. For ordinary
(non-trusted) users the authorize gate never fires, so a *repeated* POST silently
**double-tags and double-counts XP**. Our retry-on-focus path uses POST, so any
time a tag-post succeeds server-side but the app loses the response, the next
focus re-POSTs and inflates the photo. Same lost-response race as P1.

---

## 2. Status quo — confirmed against the Laravel codebase

### Upload — `POST /api/v3/upload`
- Controller: `app/Http/Controllers/Uploads/UploadPhotoController.php` (`__invoke`).
- Validation: `app/Http/Requests/UploadPhotoRequest.php`.
- **Duplicate is detected in `UploadPhotoRequest::after()` before the controller
  runs.** Dedup key = `user_id + datetime` (mobile/explicit path; web/EXIF path
  uses the EXIF datetime). It is an application-level `->exists()` check — **no DB
  unique constraint**, and the existing row is **not** fetched.
- Because the duplicate is caught in validation, the duplicate path does **no**
  `Photo::create`, **no** S3 write, **no** XP increment, **no**
  `MetricsService::recordUploadMetrics()`. (Important: `recordUploadMetrics` is
  *not* self-idempotent — it always writes +1 upload / +5 XP. The duplicate
  branch must never reach it.)

Current success response:
```json
{ "success": true, "photo_id": 12345, "lat": 53.1, "lon": -7.2,
  "city": "...", "state": "...", "country": "...", "display_name": "...",
  "xp_awarded": 5, "user_xp_total": 1234 }
```
`photo_id` is a real integer (Photo PK).

Current duplicate response — **HTTP 422**:
```json
{ "success": false, "error": "duplicate",
  "message": "You have already uploaded this photo",
  "errors": { "photo": ["You have already uploaded this photo"] } }
```
- Error code is literally **`"duplicate"`** (not `photo-already-uploaded`; that
  string lives in dead, never-thrown `app/Exceptions/PhotoAlreadyUploaded.php`).
- The app's `classifyError` already matches `error === "duplicate"` and
  `/already uploaded/i`, so classification already works — no change needed there.

### Tags — `POST` vs `PUT /api/v3/tags`
- `PhotoTagsRequest::rules()`: `'photo_id' => ['required','integer', Rule::exists('photos','id')->whereNull('deleted_at')]`
  → a non-integer id yields the exact "must be an integer." message.
- **`POST` (`PhotoTagsController::store`) — APPENDS.** `AddTagsToPhotoAction` only
  ever *creates* `PhotoTag` rows. A second POST adds a second set; summary/XP
  recompute over the doubled set. The only brake is the authorize gate
  (`verified >= VERIFIED(1)` → 403), but ordinary users stay `verified = 0` after
  tagging, so the gate does **not** fire for the typical mobile user.
- **`PUT` (`PhotoTagsController::update`) — REPLACES.** In a transaction it deletes
  existing `PhotoTag`s, resets `summary/xp/total_tags/verified` to 0, then re-adds.
  `MetricsService::processPhoto` converges via a fingerprint guard, so repeats are
  no-ops. `ReplacePhotoTagsRequest` authorize is **ownership-only** (no verified
  gate) — re-tagging is deliberately allowed.

### App (current)
- `useUploadPhotos.js`: per-photo loop. Path 1 (`!uploaded`) → `uploadImage` then
  `postTagsToPhoto` (**POST**). Path 2 (`uploaded === true`) → `postTagsToPhoto`
  (**POST**) directly (the retry/re-tag path).
- `postTagsToPhoto` (`upload_flow_reducer.js`) → POST. `editTagsOnPhoto`
  (`server_photos_reducer.js`) → PUT (already exists, used for editing untagged
  server photos).
- `imagesArray` is persisted; rehydrate keeps any image that has a `uri`.

---

## 3. Target design

### 3.1 Idempotent upload (backend)
On a duplicate, **return success with the existing id** instead of a 422. Apply to
**both** the mobile/explicit branch and the web/EXIF branch.

```json
{ "success": true, "photo_id": 12345, "already_uploaded": true, "tagged": false }
```
- Implementation: change the duplicate `->exists()` to `->first()` on the same
  `user_id + datetime` key and return `$photo->id`. `first()` safely handles any
  legacy pre-dedup duplicates.
- **Must remain a pure id-lookup** — must not fall through into the controller's
  create + XP + metrics block. Zero side effects (no double XP / upload count).
- `already_uploaded: true` lets the client branch; `tagged` tells the client
  whether the photo already has tags (so it can skip re-tagging — see 3.2).

### 3.2 Idempotent tagging — app uses **PUT** (replace)
**Decision: the auto-upload flow uses `PUT /api/v3/tags` (replace) for tagging,
not POST.** PUT is idempotent and converges, which eliminates Bug P2's double-count
entirely. A PUT on a brand-new, untagged photo simply adds the tags (it deletes
nothing).

Client tagging rules in the auto-upload loop:
1. If the upload response says `tagged: true` → **skip tagging**; the photo is
   already complete on the server. Remove it from the local inbox.
2. Otherwise → **PUT** the tags (replace). Safe whether the photo had 0 tags
   (fresh) or a partial set (interrupted prior attempt).

> Rationale for PUT-everywhere (vs. POST-fresh / PUT-retry): one code path, fully
> race-proof, no reliance on "is this the first attempt?" which the lost-response
> races make unknowable.
>
> **Q1 — ANSWERED (always-PUT confirmed):** the Laravel agent confirmed PUT on a
> never-tagged photo produces the same XP / `verified` / metrics outcome as the
> current first-time POST (including trusted users and school students). The app
> now uses PUT on both upload-flow tagging paths.

### 3.3 Optional backend hardening (defense in depth)
Add an "already has a summary / already tagged" guard to `POST /api/v3/tags` so a
stray POST from any client (old app versions) can't double-count. Not required if
all clients move to PUT, but cheap insurance during the rollout window.

---

## 4. Exact contracts (target)

**Upload request** (mobile, unchanged): `multipart/form-data` with `photo`,
`lat`, `lon`, `date` (unix-seconds string), `model`.

**Upload success — new photo:** as today (`success`, `photo_id`, location,
`xp_awarded`, `user_xp_total`).

**Upload success — duplicate (NEW):**
```json
{ "success": true, "photo_id": <int>, "already_uploaded": true, "tagged": <bool> }
```

**Tag write — `PUT /api/v3/tags`:**
```json
{ "photo_id": <int>, "tags": [ /* buildTagsPayload output */ ] }
```
Must accept the same `tags` shapes the app already sends, including the
custom-tag-only form `{ "custom": true, "key": "tag-text" }` (see **Q5**).

---

## 5. App-side changes (mobile agent)

1. **Keep** `utils/isServerPhotoId.js` + the guard in `postTagsToPhoto` — a
   permanent safety net so a non-integer id can never hit the network again.
2. `uploadImage` thunk: surface `already_uploaded` and `tagged` from the response
   in its fulfilled payload.
3. Auto-upload tagging → **PUT**. Generalize a tag-write thunk (reuse/extend
   `editTagsOnPhoto`, or add PUT support + abort `signal` to `postTagsToPhoto`)
   so the upload flow can PUT with cancellation support.
4. In `useUploadPhotos.js`: after a successful upload, **skip tagging when
   `tagged === true`**; otherwise PUT the tags. Path 2 (local retry) → PUT.
5. **Transitional fallback** (keep until the backend ships): the current
   `photo-already-uploaded` → drop-from-inbox handler in `photos_reducer.js`
   stays, so a *new app + old backend* duplicate is handled safely (no loop, no
   double-count; local tags are dropped, photo resurfaces in the untagged section).
6. **Later cleanup** (after the idempotent backend is fully deployed and old app
   versions age out): remove the `photo-already-uploaded` rejected branch, the
   unused `failedCounts.alreadyUploaded` counter, and the dead
   `photo-already-uploaded`/`photo_already_uploaded` matches in `classifyError`.

---

## 6. Rollout / compatibility matrix

| App | Backend | Behavior |
|-----|---------|----------|
| new | new | Duplicate → `success + photo_id (+ tagged)` → PUT tags (or skip). Fully fixed. |
| new | old | Duplicate → 422 `"duplicate"` → transitional drop (no loop, tags dropped). Safe. |
| **old** | **new** | Duplicate → `success + photo_id` → old app POSTs tags to the real id. **Bug P1 fixed with no app update.** (P2 double-count still possible on this old path — the optional §3.3 POST guard closes it.) |
| old | old | The original buggy state — **fixed retroactively the moment the backend deploys.** |

**Key leverage:** the backend change alone fixes already-installed app versions.
The optional `POST /tags` guard (§3.3) is what fully protects those old clients
from P2 during the window before they update.

---

## 7. Open questions for the Laravel agent

- **Q1 — ✅ ANSWERED: always-PUT.** PUT on a never-tagged photo produces the same
  XP / `verified` / `total_tags` / `MetricsService` outcome as first-time POST,
  including trusted users and school students. App now uses PUT on both upload-flow
  tagging paths; the POST-for-fresh / PUT-for-retry fallback is not needed.
- **Q2 (`tagged` flag definition):** How should the backend derive `tagged` in the
  duplicate response — `summary` present? `total_tags > 0`? a `PhotoTag` exists?
  Define it precisely so the client can trust "skip tagging."
- **Q3 (datetime stability):** Dedup matches on `user_id + datetime`. The app
  sends `date` as a unix-seconds **string**; the original row stored a parsed
  `datetime`. Confirm the parse is **stable** (same timezone/format both times) so
  `->first()` reliably finds the original row. If parsing can differ between the
  first and second upload, dedup (and the id-lookup) could miss.
- **Q4 (legacy duplicates):** For photos uploaded before dedup existed there may be
  multiple rows for one `user_id + datetime`. `->first()` returns one — acceptable,
  or should it pick the most recent / the one with a summary?
- **Q5 (custom tags via PUT):** Does `PUT /api/v3/tags` handle the custom-tag-only
  payload `{ custom: true, key: "..." }` identically to POST (the
  `ClassifyTagsService` path)?
- **Q6 (XP on duplicate):** Confirm the duplicate branch awards **0** upload XP
  (no `recordUploadMetrics`), and that subsequent PUT tagging awards tag XP exactly
  once.

---

## 8. Test plan

**Backend:**
- Duplicate upload returns `success + existing photo_id + already_uploaded` with no
  new Photo / no XP / no metrics delta (assert counts unchanged).
- `tagged` flag correct for tagged vs untagged duplicates.
- PUT twice with the same tags converges (XP/summary/total_tags stable).
- (If adopted) POST `/tags` on an already-tagged photo is rejected/redirected.

**App — done:**
- `isServerPhotoId` unit test (`__tests__/utils/isServerPhotoId.test.js`).
- `addTagsToPhoto` thunk writes via **PUT** (never POST) and rejects a non-integer
  id without a network call (`__tests__/reducers/addTagsToPhoto.test.js`). Covers
  Path 1 and Path 2 (both route through this thunk).
- `removeTaggedPhoto` clears the photo + records its uri — the `tagged:true` skip
  path; and the transitional `"duplicate"` 422 drops the stranded photo without a
  loop (`__tests__/reducers/photosInbox.test.js`).

---

## 9. Decisions captured
- ✅ Idempotent upload: duplicate → `{ success, photo_id, already_uploaded, tagged }`
  *(backend — pending implementation by the Laravel agent)*.
- ✅ Tagging via **PUT** (replace) in the auto-upload flow — Q1 confirmed
  PUT-first-time == POST-first-time. **Implemented app-side** (`addTagsToPhoto`,
  both paths PUT; `tagged:true` → skip + inbox cleanup).
- ✅ Keep the `isServerPhotoId` guard permanently — **implemented**.
- ✅ Keep the transitional drop handler until the backend ships, then clean up —
  **in place**.
- ⏳ Optional `POST /tags` already-tagged guard — backend decision, based on how
  long old app versions are expected to linger.

**Remaining backend work (Laravel agent):** implement the idempotent duplicate
branch (mobile + web/EXIF), answer Q2–Q6, optionally add the POST `/tags` guard.

**Deferred app cleanup (after idempotent backend deploys + old versions age out):**
remove the `photo-already-uploaded` rejected branch, the unused
`failedCounts.alreadyUploaded` counter, and the dead `photo-already-uploaded`
matches in `classifyError`.
