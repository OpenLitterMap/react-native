# Mobile API Reference

**This is the single source of truth for the request/response contract of every backend endpoint the mobile app calls.** The full backend API (web + admin) lives in the backend repo; `BackendAPI.md` in this folder is only a surface map that defers here.

The app calls **33 endpoint paths** (verified by grep across `reducers/`, `screens/`, `utils/`). `/api/v3/tags` is the only path used with two verbs (the app uses **PUT**; POST is documented at the bottom for reference only).

All authenticated endpoints use `Authorization: Bearer <sanctum_token>`. Base URL is configured in `utils/config.js` via `react-native-config`. On `401` the global interceptor in `utils/setupAxiosInterceptors.js` signals session abort (30s timeout).

---

## Auth

| Method | Path | Mobile caller |
|--------|------|---------------|
| POST | `/api/auth/token` | `auth_reducer.js` → `userLogin` |
| POST | `/api/auth/register` | `auth_reducer.js` → `createAccount` |
| POST | `/api/validate-token` | `auth_reducer.js` → `checkValidToken` |
| POST | `/api/password/email` | `auth_reducer.js` → `sendResetPasswordRequest` |

### Login — `POST /api/auth/token`

```json
// Request
{ "identifier": "email_or_username", "password": "secret" }

// Response 200
{ "token": "1|abcdef...", "user": { /* profile object — see fetchUser mapping below */ } }
```

Accepts `identifier`, `email`, or `username` (priority: identifier > email > username). Throttled 5/min. Revokes previous `mobile` tokens. Sanctum returns **401** for invalid credentials.

### Register — `POST /api/auth/register`

```json
// Request
{ "email": "...", "password": "min8chars", "username": "optional" }

// Response 200
{ "token": "1|abcdef...", "user": { ... } }
```

Username auto-generated if omitted (`adjective-noun-number`). Token name `mobile`.

### Validate Token — `POST /api/validate-token`

Request body `{ token }`. Returns `{ "message": "valid" }` on 200, **401** if invalid/expired.

### Password Reset — `POST /api/password/email`

Request `{ login: "email_or_username" }`. Always returns the same message (no user enumeration). The reset itself happens on the web (no mobile reset-completion call).

---

## User Profile

| Method | Path | Mobile caller |
|--------|------|---------------|
| GET | `/api/user/profile/index` | `auth_reducer.js` → `fetchUser` |

Single call returns everything the profile screen needs. Stats come from Redis (fast).

```json
{
  "user": {
    "id": 1, "name": "...", "username": "...", "email": "...",
    "avatar": null, "global_flag": "ie", "member_since": "January 2020",
    "picked_up": true,
    "public_profile": true, "show_name": true, "show_username": true,
    "show_name_maps": true, "show_username_maps": true,
    "previous_tags": true, "emailsub": true, "verification_required": false
  },
  "stats": { "uploads": 100, "tags": 450, "xp": 5000, "streak": 7, "littercoin": 250 },
  "level": { "level": 3, "title": "Litter Wizard", "progress_percent": 100, "xp_remaining": 0 },
  "rank": { "global_position": 42, "global_total": 500, "percentile": 91.6 },
  "achievements": { "unlocked": 15, "total": 30 },
  "locations": { "countries": 5, "states": 12, "cities": 45 },
  "team": { "id": 5, "name": "Team A" }
}
```

- `team` is `null` if no active team.
- `picked_up` — the user's default "litter was picked up" preference for new photos.
- `verification_required` — **`false` = trusted user**. Drives the tiered max-quantity cap (trusted = 100, new = 10) and whether tags auto-publish.

**State mapping** — `fetchUser.fulfilled` flattens this nested shape into the flat model screens use:

| API field | State field |
|---|---|
| `user.*` | spread directly (settings + privacy flags) |
| `stats.xp` | `user.xp` |
| `stats.uploads` | `user.totalImages` |
| `stats.tags` | `user.totalTags` |
| `stats.littercoin` | `user.totalLittercoin` |
| `stats.streak` | `user.streak` |
| `rank.global_position` | `user.position` |
| `rank.percentile` | `user.percentile` |
| `level.level` / `level.title` | `user.level` / `user.levelTitle` |
| `level.progress_percent` | `user.levelProgress` |
| `level.xp_remaining` | `user.xpToNextLevel` |
| `team.id` / `team` | `user.active_team` / `user.team` |
| `achievements` / `locations` | `user.achievements` / `user.locations` |

`fetchUser` retries 2× (1s/3s backoff) for transient errors (timeout/network/5xx); only **401** clears the session.

---

## Photo Upload

| Method | Path | Mobile caller |
|--------|------|---------------|
| POST | `/api/v3/upload` | `upload_flow_reducer.js` → `uploadImage` |

`Content-Type: multipart/form-data`. The app builds the FormData in `screens/home/useUploadPhotos.js` and sends exactly:

```
photo: <file>      { name: filename, type: "image/jpeg", uri }
lat:   51.925
lon:   -7.872
date:  1770561192   (unix timestamp string; omitted if not finite)
model: "iPhone 14"  (deviceModel)
```

Sending `lat` + `lon` + `date` puts the backend in **mobile mode** (EXIF GPS/datetime validation skipped, `platform = "mobile"`).

**Pre-upload GPS gate (client-side):** `isGeotagged()` (`utils/isGeotagged.js` → `utils/gps.js`) rejects null and `(0,0)` coordinates before the request is built. Already-uploaded images bypass this gate (tag-only path).

```json
// Response 200
{ "success": true, "photo_id": 515917 }
```

`already_uploaded` and `tagged` flags may be present on idempotent-aware backends (default `false`). Errors: `"photo-already-uploaded"`, `"invalid-coordinates"`.

---

## Tagging

| Method | Path | Mobile caller |
|--------|------|---------------|
| PUT | `/api/v3/tags` | `upload_flow_reducer.js` → `addTagsToPhoto` (upload flow) |
| PUT | `/api/v3/tags` | `server_photos_reducer.js` → `editTagsOnPhoto` (My Uploads edit) |

**The app only uses PUT.** PUT is **replace** (delete-then-readd), so a lost-response retry converges instead of double-counting XP — the upload loop relies on this idempotency. The `POST` variant still exists server-side and is documented at the bottom for reference, but the app never calls it.

Before sending, `addTagsToPhoto` guards the id with `isServerPhotoId(photoId)` — a local camera-roll counter or `"onboarding_…"` string fails locally (no network, no Sentry) rather than 422-looping.

```json
// Request — { photo_id, tags } ; tags built by utils/buildTagsPayload.js
{
  "photo_id": 515917,
  "tags": [
    {
      "category_litter_object_id": 42,
      "litter_object_type_id": 1,
      "quantity": 2,
      "picked_up": true,
      "materials": [10, 11],
      "brands": [{ "id": 1, "quantity": 1 }],
      "custom_tags": ["found on bench"]
    }
  ]
}
```

PUT deletes all existing tags + extras, resets summary/XP/verified, then re-runs the tag pipeline atomically. The app must send the **complete** tag set, not a diff. Response is `{ success, photoTags: [...] }`.

**Standalone tag shapes** produced by `buildTagsPayload`:
- **Brand-only:** `{ brand_only: true, brand: { id, key }, quantity, picked_up }`
- **Custom-only** (image has custom text but no CLO tags): one entry per string —
  `{ custom: true, key: "tag-text", quantity: 1, picked_up: null }`
  Backend `ClassifyTagsService` consumes these. Custom tags are validated **3–100 chars, `/^[\w\s:-]+$/`** (mobile validates before send; backend re-validates).

Image-level `img.customTags` are merged (deduplicated) into the first CLO tag's `custom_tags` when CLO tags exist.

---

## Photo Visibility

| Method | Path | Mobile caller |
|--------|------|---------------|
| PATCH | `/api/v3/photos/{id}/visibility` | `screens/userStats/userComponents/MyUploads.js` → `handleToggleVisibility` |

```json
// Request
{ "is_public": true }

// Response 200
{ "success": true }
```

Toggles a single photo's public/private state from My Uploads. School-team photos are skipped client-side (`item.school_team` short-circuits).

---

## My Uploads (Photos)

| Method | Path | Mobile caller |
|--------|------|---------------|
| GET | `/api/v3/user/photos` | `uploads_reducer.js` → `fetchUploads`; `server_photos_reducer.js` → untagged count/fetch |
| GET | `/api/v3/user/photos/stats` | `server_photos_reducer.js` → `fetchUntaggedCount` (Promise.all with untagged count) |
| GET | `/api/v3/user/photos/locations` | `uploads_reducer.js` → `fetchUserLocations` |
| POST | `/api/profile/photos/delete` | `uploads_reducer.js` → `deleteUploadPhoto` |

### User Photos — `GET /api/v3/user/photos`

Auth (Sanctum). Paginated (8/page), ordered `created_at` DESC. Optional query params: `page`, `tagged` (bool), `tag` (LIKE), `custom_tag` (LIKE), `date_from`, `date_to`. The untagged dashboard badge fetches with `tagged=false`.

```json
// Response 200
{
  "photos": [{
    "id": 123,
    "filename": "https://.../photo.jpg",   // full S3 URL — use directly
    "datetime": "2020-01-15T10:30:00Z",
    "lat": 40.7128, "lon": -74.0060,
    "model": "iPhone 12",
    "picked_up": false,
    "is_public": true,
    "school_team": false,
    "team": { "id": 5, "name": "Team A" },
    "new_tags": [{
      "id": 1,
      "category_litter_object_id": 42,
      "litter_object_type_id": 1,
      "quantity": 3,
      "picked_up": true,
      "category": { "id": 1, "key": "smoking" },
      "object": { "id": 2, "key": "cigarette" },
      "extra_tags": [
        { "type": "brand",    "quantity": 1, "tag": { "id": 10, "key": "marlboro" } },
        { "type": "material", "quantity": 1, "tag": { "id": 50, "key": "paper" } }
      ]
    }],
    "summary": ["cigarette"],   // null = untagged, array = tagged
    "xp": 12,
    "total_tags": 1
  }],
  "pagination": { "current_page": 1, "last_page": 5, "per_page": 8, "total": 40 }
}
```

The UI renders `new_tags` directly (v5 format, nested category/object/extra_tags). `summary: null` or empty `new_tags` ⇒ untagged.

### Upload Stats — `GET /api/v3/user/photos/stats`

```json
{ "totalPhotos": 150, "totalTags": 412, "leftToTag": 23, "taggedPercentage": 85 }
```

`taggedPercentage` is an integer 0–100; `leftToTag` = photos with `summary IS NULL`.

### Photo Locations — `GET /api/v3/user/photos/locations`

Returns the distinct countries/places the user has uploaded to, used by the My Uploads filter sheet.

```json
{ "locations": [ /* location descriptors */ ] }
```

The reducer stores `response.data.locations` (defaults to `[]`); a null is kept on failure so the filter sheet retries on next open.

### Delete Photo — `POST /api/profile/photos/delete`

```json
// Request — note the param is "photoid" (lowercase, no underscore)
{ "photoid": 123 }

// Response 200
{ "message": "Photo deleted successfully!" }
```

Reverses metrics (XP, total_images), removes S3 files, soft-deletes. **403** if not owned. Called from both HomeScreen (delete an uploaded image) and My Uploads (swipe-to-delete).

---

## Quick Tags

| Method | Path | Mobile caller |
|--------|------|---------------|
| GET | `/api/v3/user/quick-tags` | `quick_tags_reducer.js` → `fetchQuickTags` |
| PUT | `/api/v3/user/quick-tags` | `quick_tags_reducer.js` → `syncQuickTags` |
| GET | `/api/v3/user/top-tags` | `screens/setting/QuickTagsSettingsScreen.js` ("Use My Tags") |

### Get / Sync Quick Tags — `GET` / `PUT /api/v3/user/quick-tags`

Both return `{ "tags": [...] }`. PUT is a **bulk replace** of the user's preset rows (backend transaction). Request body:

```json
// PUT request
{ "tags": [ /* localToBackend(preset) — cloId, typeId, customName, quantity, picked_up, materials, brands */ ] }
```

The reducer maps each returned row through `backendToLocal`. PUT is debounced on local edits; a `locallyEdited` flag guards against fetch/sync ping-pong.

### Top Tags — `GET /api/v3/user/top-tags?limit=20`

Seeds quick-tag presets from the user's most-used tags.

```json
{ "tags": [ { "clo_id": 42, "type_id": 1, "brand_id": null }, ... ] }
```

Each row is resolved against the local catalogue (`entriesByCloId`) to build a preset. Empty list ⇒ "not enough tags yet" alert.

---

## Settings

| Method | Path | Mobile caller |
|--------|------|---------------|
| POST | `/api/settings/update/` | `settings_reducer.js` → `saveSettings` |
| POST | `/api/settings/privacy/{endpoint}` | `settings_reducer.js` → `toggleSettingsSwitch` |
| PATCH | `/api/settings` | `settings_reducer.js` → `saveSocialAccounts` |
| POST | `/api/settings/delete-account/` | `settings_reducer.js` → `deleteAccount` |

> The trailing slashes on `/api/settings/update/` and `/api/settings/delete-account/` are intentional — that is exactly what the reducers send.

### Update Setting — `POST /api/settings/update/`

```json
// Request — single key/value
{ "key": "username", "value": "new_value" }

// Response 200 / 422
{ "success": true }
{ "success": false, "msg": "This email is already taken." }
```

Backend `ALLOWED_SETTINGS` keys are all lowercase. Common keys: `name`, `username`, `email`, `global_flag`, `picked_up`, `previous_tags`, `emailsub`, `public_profile`. On success the reducer optimistically patches `state.auth.user[key]`.

### Privacy Toggles — `POST /api/settings/privacy/{endpoint}`

No request body — each endpoint toggles one boolean and returns its new value `{ "<key>": <bool> }`. `{endpoint}` comes from the reducer's `PRIVACY_ENDPOINTS` map (e.g. `maps/name`, `maps/username`, `leaderboard/name`, `leaderboard/username`, `toggle-previous-tags`). The reducer reads the single returned key and normalises non-`show_name`/`show_username` values to `0|1`.

### Social Links — `PATCH /api/settings`

```json
// Request — any subset, all must be valid URLs
{ "social_twitter": "https://twitter.com/user", "social_instagram": "https://instagram.com/user" }

// Response 200
{ "message": "success" }
```

Allowed: `social_twitter`, `social_facebook`, `social_instagram`, `social_linkedin`, `social_reddit`, `social_personal`.

### Delete Account — `POST /api/settings/delete-account/`

```json
// Request
{ "password": "current_password" }

// Response 200
{ "success": true }
// Failure
{ "success": false, "msg": "password does not match" }
```

Irreversible. On success the app clears AsyncStorage and dispatches `logout()`.

---

## Teams

| Method | Path | Mobile caller |
|--------|------|---------------|
| POST | `/api/teams/create` | `team_reducer.js` → `createTeam` |
| POST | `/api/teams/join` | `team_reducer.js` → `joinTeam` |
| POST | `/api/teams/leave` | `team_reducer.js` → `leaveTeam` |
| POST | `/api/teams/active` | `team_reducer.js` → `changeActiveTeam` |
| POST | `/api/teams/inactivate` | `team_reducer.js` → `inactivateTeam` |
| GET | `/api/teams/list` | `team_reducer.js` → `getUserTeams` |
| GET | `/api/teams/members` | `team_reducer.js` → `getTeamMembers` |
| GET | `/api/teams/leaderboard` | `team_reducer.js` → `getTopTeams` |

### Create — `POST /api/teams/create`
`{ name, identifier, teamType }` → `{ success, team: {...} }`. The client sends `teamType: 1` and `identifier` (the desired team code) — `team_reducer.js → createTeam`. ⚠️ Confirm field names with the backend (see Open questions).

### Join — `POST /api/teams/join`
`{ identifier: "team_code" }` → `{ success, team, activeTeam }`. Preserves an existing active team (only auto-activates if the user had none). `{ success: false, msg: "already-joined" }`.

### Leave — `POST /api/teams/leave`
`{ team_id }` → `{ success, team, activeTeam }`. Backend auto-assigns a new active team (or null). **403** `not-a-member` / `you-are-last-member`.

### Set Active — `POST /api/teams/active`
`{ team_id }` → `{ success, team }`. Errors `team-not-found` / `not-a-member`.

### Inactivate — `POST /api/teams/inactivate`
Sets the active team to null.

### List User's Teams — `GET /api/teams/list`
```json
{ "success": true, "teams": [
  { "id": 1, "name": "My Team", "identifier": "abc123", "type_name": "community",
    "total_members": 5, "total_tags": 1200, "total_images": 300 }
] }
```
Team objects use **`total_tags`** (not `total_litter`), `total_images`, `total_members`.

### Members — `GET /api/teams/members?team_id=X`
```json
{ "success": true, "total_members": 25, "result": [ { "id": 123, "name": "Student 1", "pivot": { "total_photos": 10, "total_litter": 30 } } ] }
```
School teams apply safeguarding pseudonyms ("Student 1", …). Member pivot exposes `pivot.total_photos` and `pivot.total_litter`.

### Teams Leaderboard — `GET /api/teams/leaderboard`
Same team shape as `list`, ranked by total tags; only teams with `leaderboards = true` appear.

---

## Stats / Leaderboard / Levels / Locations / App Version

| Method | Path | Mobile caller |
|--------|------|---------------|
| GET | `/api/global/stats-data` | `stats_reducer.js` → `getStats` |
| GET | `/api/leaderboard` | `leaderboards_reducer.js` → `getLeaderboardData` |
| GET | `/api/levels` | `screens/profile/helpers/xpLevels.js` |
| GET | `/api/locations/country` | `locations_reducer.js` → `fetchCountries` |
| GET | `/api/locations/{type}/{id}` | `locations_reducer.js` → `fetchLocationChildren` |
| GET | `/api/mobile-app-version` | `shared_reducer.js` → `checkAppVersion` |
| GET | `/api/tags/all` | `tags_reducer.js` → `fetchAllTags` |

### Global Stats — `GET /api/global/stats-data`
Public. Returns `total_tags`, `total_images`, `total_users`, `new_users_last_24_hours`, `new_users_last_7_days`, `new_users_last_30_days`. Drives the animated Global Impact counters (24h / 7d / 30d windows).

### Leaderboard — `GET /api/leaderboard`
Public; authenticated callers also get `currentUserRank`. Query: `timeFilter` (`all-time` | `today` | `yesterday` | `this-month` | `last-month` | `this-year` | `last-year`), `locationType` (`global` | `country` | `state` | `city`) + `locationId` (**must be paired**), `page` (100/page).

```json
{
  "success": true,
  "users": [ { "user_id": 42, "public_profile": true, "name": "Sean", "username": "@seanlynch",
               "xp": 1234, "global_flag": "ie", "social": { "twitter": "..." }, "team": "CleanCoast", "rank": 1 } ],
  "hasNextPage": false, "total": 150, "activeUsers": 450, "totalUsers": 1000, "currentUserRank": 42
}
```
`xp` is an **integer** (format client-side). `name`/`username`/`team` are `""` when hidden; `username` is `@`-prefixed by the backend. Zero-XP users excluded. Error: `{ success: false, msg: "..." }`.

### Levels — `GET /api/levels`
Public. XP-threshold → title map for the level UI. Cached locally 7 days.

### Locations — `GET /api/locations/country`, `GET /api/locations/{type}/{id}`
Public. Country list, then drill-down children. Types: `country`, `state`, `city`.

### App Version — `GET /api/mobile-app-version`
Public. `{ ios: { url, version }, android: { url, version } }` — drives the update prompt.

### Tags Catalogue — `GET /api/tags/all`
Public. Returns **7 flat arrays** the client joins into a search index; cached in AsyncStorage (`tags_cache_v7`, 7-day TTL).

```json
{
  "categories":    [{ "id": 1, "key": "smoking" }, ...],
  "objects":       [{ "id": 5, "key": "cigarette_butt", "categories": [{ "id": 1, "key": "smoking" }] }, ...],
  "materials":     [{ "id": 10, "key": "plastic" }, ...],
  "brands":        [{ "id": 1, "key": "coca_cola" }, ...],
  "types":         [{ "id": 1, "key": "wine" }, ...],
  "category_objects":      [{ "id": 42, "category_id": 2, "litter_object_id": 12 }, ...],
  "category_object_types": [{ "category_litter_object_id": 42, "litter_object_type_id": 1 }, ...]
}
```

**Building the index (the `cloId` concept):**
1. Each object can belong to multiple categories. Make one entry per (object, category) pair, pre-resolving `cloId` (= `category_litter_object.id`) from `category_objects`. E.g. `bottle (alcohol) → cloId 42`, `bottle (soft_drinks) → cloId 87`.
2. Types add specificity: join `category_object_types` → `types`. "wine" → `cloId 42, typeId 1` ⇒ submit `{ category_litter_object_id: 42, litter_object_type_id: 1 }` to tag a "wine bottle".
3. Brands and materials are standalone (no join).

Notes: `category_object_types` has **no `id`** — dedup on `(category_litter_object_id, litter_object_type_id)`. Not all objects have types (`litter_object_type_id` is nullable). Objects use `key`, not `display_name` — display names are resolved client-side and localised via `litter.json`.

---

## Reference

### XP scoring (backend authority)
Upload **+5**; per object **+1** (special: `dumping_small` +10, `dumping_medium` +25, `dumping_large` +50, `bags_litter` +10); per brand **+3**; per material **+2**; per custom tag **+1**. Brands use their own quantity; materials/custom tags use the parent tag's quantity. The mobile XP preview is a best-effort estimate and does not model every special-object bonus (see `XP.md`).

### Appendix — `POST /api/v3/tags` (NOT used by the app)

The backend still exposes a `POST /api/v3/tags` that **appends** tags (and applies a verification gate: 403 if `verified >= 1`). The app deliberately uses **PUT** everywhere so retries can't double-count. Documented here only so readers don't reintroduce the POST path; same request/response shape as PUT above.

---

## Open questions (pending backend confirmation)

These fields are documented from **observed client behaviour** and have **not** been re-verified against the Laravel source. A clarification request has been sent to the backend; update this file (and clear the ⚠️ markers) as answers land.

1. **Profile stats key** — is the user's tag total `stats.tags` or `stats.litter`? (Mapped to `user.totalTags`.)
2. **`onboarding_completed_at`** — returned on the profile `user` object, and set on first tag submission? (Mobile onboarding is gated on `user.onboarding_completed_at != null`.)
3. **`PUT /api/v3/tags` response** — does it return `photoTags` (what `editTagsOnPhoto` reads) or `new_tags`/`summary`/`xp`/`total_tags`?
4. **`POST /api/v3/upload` response** — does it return `xp_awarded`/`user_xp_total`, and the idempotency flags `already_uploaded`/`tagged`? (Idempotent-upload contract is unspecified — flags are plumbed but unused client-side.)
5. **`/api/tags/all` category keys** — `beverages` vs `softdrinks`, and is `unclassified` a category? (Must match `litter.json`.)
6. **`POST /api/teams/create`** — `{name, identifier, teamType}` (what we send) or `{name, description, type_id}`?
7. **Error contract** — canonical error shape per endpoint (`msg` vs `message`) so `classifyError` is reliable.
8. **XP special-object keys** — the exact `XpScore` enum keys for the bonus objects (`dumping_small`/`dumping_medium`/`dumping_large`/`bags_litter`?), so the mobile XP preview can map them. (`XP.md` and this file currently disagree.)

Full context: the backend clarification prompt produced alongside the 2026-06-08 docs audit.
