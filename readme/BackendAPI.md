# OpenLitterMap API — Mobile Surface Map

> **This is the mobile-relevant surface map.** The full backend API (web SPA + admin + moderation + map) is documented in the **backend repo**. Endpoints the mobile app actually consumes have their complete request/response contract in **[`BackendMobileApi.md`](BackendMobileApi.md)** — treat that file as the single source of truth and do **not** duplicate payloads here.

Base URL: `/api`. Mobile uses stateless Sanctum tokens: `Authorization: Bearer <token>`. The full backend also supports SPA session auth, but the mobile app never uses it.

The app calls **33 endpoint paths** (verified by grep across `reducers/`, `screens/`, `utils/`). One line each below, grouped by area — follow the link for the contract.

---

## Auth

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/token` | Mobile token login → `{ token, user }` |
| POST | `/api/auth/register` | Create account → `{ token, user }` |
| POST | `/api/validate-token` | Boot-time JWT check (401 if stale) |
| POST | `/api/password/email` | Request password-reset email |

→ full contracts in [BackendMobileApi.md → Auth](BackendMobileApi.md#auth)

## User Profile

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/user/profile/index` | Authenticated profile + stats + rank + level (one call) |

→ [BackendMobileApi.md → User Profile](BackendMobileApi.md#user-profile)

## Images / Upload / Tagging

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/v3/upload` | Upload photo binary + GPS (multipart) → `photo_id` |
| PUT | `/api/v3/tags` | Replace all tags on a photo (idempotent; app never uses POST) |
| PATCH | `/api/v3/photos/{id}/visibility` | Toggle a photo public/private |

→ [BackendMobileApi.md → Photo Upload / Tagging / Photo Visibility](BackendMobileApi.md#photo-upload)

## My Uploads (Photos)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v3/user/photos` | User's photos, paginated + filterable (also untagged count via `tagged=false`) |
| GET | `/api/v3/user/photos/stats` | Upload totals + tagged percentage |
| GET | `/api/v3/user/photos/locations` | Distinct upload locations (filter sheet) |
| POST | `/api/profile/photos/delete` | Delete one photo (param is `photoid`) |

→ [BackendMobileApi.md → My Uploads (Photos)](BackendMobileApi.md#my-uploads-photos)

## Tags Catalogue / Quick Tags

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tags/all` | 7 flat arrays → client-built search index (7-day cache) |
| GET | `/api/v3/user/quick-tags` | Fetch user's quick-tag presets |
| PUT | `/api/v3/user/quick-tags` | Bulk-replace quick-tag presets |
| GET | `/api/v3/user/top-tags` | User's most-used tags (seed presets) |

→ [BackendMobileApi.md → Tags Catalogue](BackendMobileApi.md#stats--leaderboard--levels--locations--app-version) · [Quick Tags](BackendMobileApi.md#quick-tags)

## Teams

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/teams/create` | Create team |
| POST | `/api/teams/join` | Join by code |
| POST | `/api/teams/leave` | Leave team |
| POST | `/api/teams/active` | Set active team |
| POST | `/api/teams/inactivate` | Clear active team |
| GET | `/api/teams/list` | User's teams |
| GET | `/api/teams/members` | Team members (school safeguarding pseudonyms) |
| GET | `/api/teams/leaderboard` | Top teams by total tags |

→ [BackendMobileApi.md → Teams](BackendMobileApi.md#teams)

## Settings

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/settings/update/` | Update one allowed key/value |
| POST | `/api/settings/privacy/{endpoint}` | Toggle a single privacy boolean |
| PATCH | `/api/settings` | Update social links |
| POST | `/api/settings/delete-account/` | Delete account (GDPR) |

→ [BackendMobileApi.md → Settings](BackendMobileApi.md#settings)

## Stats / Leaderboard / Levels / Locations / Version

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/global/stats-data` | Global totals + new-user growth windows |
| GET | `/api/leaderboard` | Ranked users (time + location filters) |
| GET | `/api/levels` | XP-threshold → title map |
| GET | `/api/locations/country` | Country list |
| GET | `/api/locations/{type}/{id}` | Location drill-down |
| GET | `/api/mobile-app-version` | Latest store versions (update prompt) |

→ [BackendMobileApi.md → Stats / Leaderboard / Levels / Locations / App Version](BackendMobileApi.md#stats--leaderboard--levels--locations--app-version)

---

## Shared reference

### Verification pipeline
| Value | Status |
|-------|--------|
| 0 | UNVERIFIED (uploaded, no tags) |
| 1 | VERIFIED (tagged; school photos await teacher approval) |
| 2 | ADMIN_APPROVED (admin/trusted, or teacher-approved) |
| 3 | BBOX_APPLIED |
| 4 | BBOX_VERIFIED |
| 5 | AI_READY |

The mobile app only reads `summary`/`new_tags` to decide tagged vs untagged; it does not act on raw `verified` values.

### Error response patterns
Controllers use **`msg`** (auth, team join, photo endpoints) or **`message`** (team member/settings, newer endpoints) inconsistently, always alongside `success: false`. Sanctum always returns **401** for expired/invalid tokens (never 419).

### XP scoring
See [BackendMobileApi.md → Reference](BackendMobileApi.md#reference). The backend is authoritative; the mobile preview is an estimate.

---

## Non-mobile backend (names only — not covered here)

The mobile app does **not** call any of these. They are documented in the backend repo; listed so readers know they exist:

- **Web SPA auth/session** — `/api/auth/login`, `/api/auth/logout`, `/api/current-user`, password `validate-token` / `reset`.
- **Admin & moderation** — `/api/admin/*` (photo review queue, verify, reset-tags, user trust/approve-all, username moderation), `/api/bbox/*`.
- **Map / GeoJSON** — `/api/points`, `/api/points/{id}`, `/api/points/stats`, `/api/clusters`, `/api/clusters/zoom-levels`, `/api/global/points`, `/api/tags-search`, `/api/city`, `/api/user/profile/map`, team map/cluster/point endpoints.
- **Cleanups** — `/api/cleanups/*`.
- **Littercoin / merchants** — `/api/littercoin/merchants`.
- **World Cup** — `/api/locations/world-cup`.
- **Achievements** — `/api/achievements` (data is already inlined in `/api/user/profile/index`).
- **Community stats** — `/api/community/stats`.
- **Public profiles** — `/api/user/profile/{id}` (planned mobile feature; not yet called).
- **Data export** — `/api/user/profile/download`, `/api/download`, `/api/teams/download`.
- **Rich location analytics** — `/api/locations/{type}/{id}/{categories,timeseries,leaderboard,tags/*}`.
- **Legacy submit/tag routes** — `/api/photos/submit`, `/api/photos/submit-with-tags`, `/api/photos/upload/with-or-without-tags`, `/api/photos/delete`, `/api/add-tags`, `/api/v2/add-tags-to-uploaded-image`, `/api/v2/photos/get-untagged-uploads`, `/api/user`, `/api/history/paginated`, `/api/settings/toggle`, `/api/settings/details`. All superseded by the v3/Sanctum endpoints above.
