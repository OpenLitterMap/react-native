# Mobile API Reference

Endpoints the React Native app uses (or should use). All authenticated endpoints use `Authorization: Bearer <sanctum_token>`.

Base URL configured in `actions/types.js` via `react-native-config`.

---

## Auth

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/auth/token` | `auth_reducer.js` → `userLogin` | Active |
| POST | `/api/auth/register` | `auth_reducer.js` → `createAccount` | Active |
| POST | `/api/validate-token` | `auth_reducer.js` → `checkValidToken` | Active |
| POST | `/api/password/email` | `auth_reducer.js` → `sendResetPasswordRequest` | Active |

### Login — `POST /api/auth/token`

```json
// Request
{ "identifier": "email_or_username", "password": "secret" }

// Response 200
{
  "token": "1|abcdef...",
  "user": {
    "id": 1, "email": "...", "username": "...",
    "xp_redis": 5000, "position": 12, "level": 3,
    "total_images": 42,
    "next_level": { "level": 4, "title": "Litter Wizard", "progress_percent": 50, ... }
  }
}
```

Accepts `identifier`, `email`, or `username` field (priority: identifier > email > username). Throttled 5/min. Revokes previous `mobile` tokens.

### Register — `POST /api/auth/register`

```json
// Request
{ "email": "...", "password": "min8chars", "username": "optional" }

// Response 200
{ "token": "1|abcdef...", "user": { ... } }
```

Username auto-generated if omitted (pattern: `adjective-noun-number`). Token created with name `mobile`.

### Validate Token — `POST /api/validate-token`

Returns `{ "message": "valid" }` on 200. Returns 401 if token is invalid/expired.

---

## User Profile

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/user/profile/index` | `auth_reducer.js` → `fetchUser` | **Active** (migrated from `GET /api/user`) |
| GET | `/api/user` | — | **Deprecated** — expensive position table scan |
| GET | `/api/user/profile/{id}` | Not implemented | Phase 4 — public profiles |
| GET | `/api/user/profile/map` | Not implemented | Phase 4 — user map GeoJSON |

### Profile Index — `GET /api/user/profile/index`

Single call returns everything the profile screen needs. Stats come from Redis with MySQL fallback (fast).

```json
{
  "user": {
    "id": 1, "name": "...", "username": "...", "email": "...",
    "avatar": null, "global_flag": "ie", "member_since": "January 2020",
    "public_profile": true, "show_name": true, "show_username": true,
    "show_name_maps": true, "show_username_maps": true,
    "previous_tags": true, "emailsub": true
  },
  "stats": {
    "uploads": 100, "litter": 450, "xp": 5000,
    "streak": 7, "littercoin": 250,
    "photo_percent": 0.5, "tag_percent": 0.8
  },
  "level": {
    "level": 3, "title": "Litter Wizard",
    "xp": 5000, "xp_into_level": 0, "xp_for_next": 5000,
    "xp_remaining": 0, "progress_percent": 100
  },
  "rank": {
    "global_position": 42, "global_total": 500, "percentile": 91.6
  },
  "global_stats": {
    "total_photos": 20000, "total_litter": 56000
  },
  "achievements": { "unlocked": 15, "total": 30 },
  "locations": { "countries": 5, "states": 12, "cities": 45 },
  "team": { "id": 5, "name": "Team A" }
}
```

`team` is `null` if no active team.

**State mapping:** The `fetchUser.fulfilled` handler in `auth_reducer.js` flattens the nested response into the state model screens expect:

| API Response | State Field |
|---|---|
| `user.*` | Spread directly (includes settings, privacy flags) |
| `stats.xp` | `user.xp_redis` |
| `stats.uploads` | `user.total_images` |
| `stats.litter` | `user.totalTags` |
| `stats.littercoin` | `user.totalLittercoin` |
| `stats.streak` | `user.streak` |
| `rank.global_position` | `user.position` |
| `rank.percentile` | `user.percentile` |
| `level.level` | `user.level` |
| `level.title` | `user.levelTitle` |
| `level.progress_percent` | `user.targetPercentage` |
| `level.xp_remaining` | `user.xpRequired` |
| `team.id` | `user.active_team` |
| `team` | `user.team` |
| `achievements` | `user.achievements` |
| `locations` | `user.locations` |

### Profile Map — `GET /api/user/profile/map` (Phase 4)

Returns GeoJSON for all user photos.

**Important:** Coordinates are `[lat, lon]` — NOT the standard GeoJSON `[lon, lat]`. The mobile app must swap these when rendering on a map.

---

## Photo Upload

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/v3/upload` | `images_reducer.js` → `uploadImage` | Active |
| POST | `/api/photos/upload/with-or-without-tags` | — | **Removed** |

### Upload — `POST /api/v3/upload`

```
Content-Type: multipart/form-data

photo: <file>           (required)
lat: 51.925             (optional — triggers mobile mode when all 3 present)
lon: -7.872             (optional)
date: 1770561192        (optional — unix timestamp in seconds)
picked_up: true|false   (optional — defaults to user's global preference)
model: "iPhone"         (optional — defaults to EXIF Model or "Unknown")
```

Response: `{ "success": true, "photo_id": 515917 }`

Errors: `"photo-already-uploaded"`, `"invalid-coordinates"` (rejects 0,0)

---

## Tagging

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/v3/tags` | `images_reducer.js` → `postTagsToPhoto` | Active |
| PUT | `/api/v3/tags` | `images_reducer.js` → `editTagsOnPhoto` | Active — **full replace** (not merge) |

### Post Tags — `POST /api/v3/tags`

```json
// Request
{
  "photo_id": 515917,
  "tags": [
    {
      "category_litter_object_id": 1,
      "litter_object_type_id": null,
      "quantity": 1,
      "picked_up": false,
      "materials": [],
      "brands": [],
      "custom_tags": []
    }
  ]
}

// Response 200 — always returns this shape
{
  "success": true,
  "photoTags": [
    {
      "id": 312673, "photo_id": 515917,
      "category_litter_object_id": 1,
      "category_id": 1, "litter_object_id": 1,
      "litter_object_type_id": null,
      "quantity": 1, "picked_up": false
    }
  ]
}
```

**Gates:** 403 if not owned, 403 if already verified.

### Replace Tags — `PUT /api/v3/tags`

Same request format. **This is a full replace, not a merge.** Deletes ALL existing tags first, resets XP/verification. The mobile app must send the complete set of tags, not just changes. Allows re-tagging verified photos. Used by `editTagsOnPhoto` thunk.

---

## Photo Queue

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/v3/user/photos?tagged=false` | `images_reducer.js` → `getUntaggedImages` | Active |
| GET | `/api/v2/photos/get-untagged-uploads` | — | **Removed** |

### Untagged Photos — `GET /api/v3/user/photos?tagged=false&per_page=100`

Uses the same user photos endpoint with `tagged=false` filter.

```json
// Response 200
{
  "photos": [{
    "id": 123,
    "filename": "https://s3.../photo.jpg",
    "datetime": "2026-01-15T10:30:00Z",
    "lat": 40.7128, "lon": -74.0060,
    "picked_up": false,
    "platform": "web",
    "new_tags": [],
    "summary": null,
    "total_tags": 0
  }],
  "pagination": {
    "current_page": 1,
    "last_page": 1,
    "per_page": 100,
    "total": 42
  }
}
```

- `filename` = full S3 URL, use directly as image source
- `picked_up`: `true` = picked up, `false` = not picked up (always boolean at photo level)
- `platform`: `"web"` or `"mobile"`

---

## Photo Deletion

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/profile/photos/delete` | `my_uploads_reducer.js` → `deleteUploadPhoto` | Active |

### Delete Photo — `POST /api/profile/photos/delete`

```json
// Request
{ "photoid": 123 }

// Response 200
{ "message": "Photo deleted successfully!" }
```

Note: the param is `photoid` (no underscore). Reverses metrics (XP, total_images decremented), removes S3 files, soft-deletes. 403 if not owned. Used from both HomeScreen (uploaded image deletion) and MyUploads (swipe-to-delete).

---

## Tag Index

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/tags/all` | `tags_reducer.js` → `fetchAllTags` | Active |

Public endpoint, no auth required. Returns flat arrays: `categories`, `objects`, `materials`, `brands`, `types`, `category_objects`, `category_object_types`. Cached locally for 7 days.

The mobile app joins these into `entriesByCloId` for the tagging search index. See `tags_reducer.js` for the join logic.

---

## Upload History

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/v3/user/photos` | `my_uploads_reducer.js` → `fetchUploads` | **Active** (migrated from `/history/paginated`) |
| GET | `/api/v3/user/photos/stats` | `my_uploads_reducer.js` → `fetchUploadStats` | **Active** — upload statistics |
| POST | `/api/profile/photos/delete` | `my_uploads_reducer.js` → `deleteUploadPhoto` | **Active** — delete single photo |

### User Photos — `GET /api/v3/user/photos`

Auth required (Sanctum). Paginated (8 per page), ordered by `created_at` DESC.

**Query params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Page number (default 1) |
| `tagged` | bool | `true` = verified, `false` = unverified |
| `tag` | string | Filter by litter object key (LIKE search) |
| `custom_tag` | string | Filter by custom tag key (LIKE search) |
| `date_from` | string | Start date (ISO) |
| `date_to` | string | End date (ISO) |

```json
// Response 200
{
  "photos": [{
    "id": 123,
    "filename": "https://...",
    "datetime": "2020-01-15T10:30:00Z",
    "lat": 40.7128, "lon": -74.0060,
    "model": "iPhone 12",
    "remaining": true,
    "team": { "id": 5, "name": "Team A" },
    "new_tags": [{
      "id": 1,
      "category_litter_object_id": "smoking_cigarette",
      "quantity": 3,
      "picked_up": true,
      "category": { "id": 1, "key": "smoking" },
      "object": { "id": 2, "key": "cigarette" },
      "extra_tags": []
    }],
    "summary": ["cigarette"],
    "xp": 12,
    "total_tags": 1
  }],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 8,
    "total": 40
  },
  "user": { "id": 1, "name": "...", "email": "..." }
}
```

Tags are under the `new_tags` key (v5 format with nested category/object/extra_tags). The UI renders `new_tags` directly via `TagChips` component.

**Migration from `/history/paginated`:** The old endpoint had no auth middleware (unguarded). The new endpoint uses Sanctum auth. Key differences: `page` (not `loadPage`), no `paginationAmount` (fixed 8 per page), no `filterCountry`, response uses `pagination` object instead of Laravel paginator fields.

### Upload Stats — `GET /api/v3/user/photos/stats`

Auth required. Returns aggregate upload statistics for the stats header.

```json
{
  "totalPhotos": 100,
  "totalTags": 450,
  "totalXp": 5000,
  "leftToTag": 5
}
```

### Delete Photo — `POST /api/profile/photos/delete`

Auth required. Soft-deletes a photo owned by the user. Reverses metrics (XP, total_images).

```json
// Request
{ "photoId": 123 }

// Response 200
{ "message": "Photo deleted successfully!" }
```

403 if photo not owned by user.

---

## Global Stats

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/global/stats-data` | `stats_reducer.js` → `getStats` | Active |

Public, no auth. Returns: `total_tags`, `total_images`, `total_users`, `new_users_today`, `new_users_last_7_days`, `new_users_last_30_days`.

---

## Leaderboard

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/leaderboard` | `leaderboards_reducer.js` → `getLeaderboardData` | Active |

Public, no auth. Authenticated users also receive `currentUserRank`; unauthenticated receive `null`.

Params: `timeFilter` (all-time, today, yesterday, this-month, last-month, this-year, last-year), `page` (100 per page).

Also supports `locationType` and `locationId` for location-scoped leaderboards (not yet used by mobile).

```json
// Response 200
{
  "success": true,
  "users": [
    {
      "user_id": 42,
      "public_profile": true,
      "name": "Sean",
      "username": "@seanlynch",
      "xp": "1,234",
      "global_flag": "ie",
      "social": { "twitter": "https://twitter.com/..." },
      "team": "CleanCoast",
      "rank": 1
    }
  ],
  "hasNextPage": false,
  "total": 150,
  "activeUsers": 450,
  "totalUsers": 1000,
  "currentUserRank": 42
}
```

**Note:** The `xp` field is a **formatted string with commas** (e.g. `"1,234"`). The mobile app renders it as-is (no math). If numeric XP is ever needed, parse with `parseInt(xp.replace(/,/g, ''), 10)`.

---

## Levels

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/levels` | `screens/profile/helpers/xpLevels.js` | Active |

Returns XP thresholds for level display. Cached locally for 7 days.

---

## Locations

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/locations/country` | `locations_reducer.js` → `fetchCountries` | Active |
| GET | `/api/locations/{type}/{id}` | `locations_reducer.js` → `fetchLocationChildren` | Active |

Public, no auth. Types: `country`, `state`, `city`.

---

## Settings

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/settings/update` | `settings_reducer.js` → `saveSettings` | Active — **preferred** |
| POST | `/api/settings/privacy/{endpoint}` | `settings_reducer.js` → `toggleSettingsSwitch` | Active |
| PATCH | `/api/settings` | `settings_reducer.js` → `saveSocialAccounts` | Active — uses `SettingsController` (different from `POST /api/settings/update` which uses `UserSettingsController`) |
| POST | `/api/settings/delete-account` | `settings_reducer.js` → `deleteAccount` | Active |

### Update Setting — `POST /api/settings/update`

```json
{ "key": "username", "value": "new_value" }
```

Allowed keys: `name`, `username`, `email`, `global_flag`, `items_remaining`, `previous_tags`, `emailsub`, `public_profile`. Note: `picked_up` key remaps to `items_remaining` (inverted boolean).

### Privacy Toggles — `POST /api/settings/privacy/{endpoint}`

| Endpoint | Setting |
|----------|---------|
| `maps/name` | `show_name_maps` |
| `maps/username` | `show_username_maps` |
| `leaderboard/name` | `show_name` |
| `leaderboard/username` | `show_username` |
| `createdby/name` | `show_name_createdby` |
| `createdby/username` | `show_username_createdby` |
| `toggle-previous-tags` | `previous_tags` |

All privacy endpoints confirmed valid and registered.

---

## Teams

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| POST | `/api/teams/create` | `team_reducer.js` → `createTeam` | Active |
| POST | `/api/teams/join` | `team_reducer.js` → `joinTeam` | Active |
| POST | `/api/teams/leave` | `team_reducer.js` → `leaveTeam` | Active |
| POST | `/api/teams/active` | `team_reducer.js` → `changeActiveTeam` | Active |
| POST | `/api/teams/inactivate` | `team_reducer.js` → `inactivateTeam` | Active — confirmed valid |
| GET | `/api/teams/list` | `team_reducer.js` → `getUserTeams` | Active |
| GET | `/api/teams/members` | `team_reducer.js` → `getTeamMembers` | Active |
| GET | `/api/teams/leaderboard` | `team_reducer.js` → `getTopTeams` | Active |

---

## Utility

| Method | Route | Mobile File | Status |
|--------|-------|-------------|--------|
| GET | `/api/mobile-app-version` | `shared_reducer.js` → `checkAppVersion` | Active |

---

## Migration Roadmap

### Completed
- [x] CSRF fixed on `POST /api/v3/tags`
- [x] Replace `GET /api/user` with `GET /api/user/profile/index` in `fetchUser`
- [x] Update `auth_reducer.js` to destructure new nested response shape
- [x] Migrate `fetchUploads` from unguarded `/history/paginated` to `GET /api/v3/user/photos`
- [x] Add materials, brands, custom tags to tagging UI (TagDetailSheet)
- [x] Upload payload sends per-tag materials, brands, custom_tags
- [x] Custom tags from search bar (image-level, merged into first tag on upload)
- [x] Upload history stats via `GET /api/v3/user/photos/stats`
- [x] Delete photos via `POST /api/profile/photos/delete`
- [x] Removed `uploadTagsToWebImage` (v4) — all tagging uses `postTagsToPhoto` (v5)
- [x] Removed `deleteWebImage` — all deletion uses `deleteUploadPhoto`
- [x] Switched register to `POST /api/auth/register`
- [x] Removed `tagsToResultString` conversion — v5 `new_tags` is the only format
- [x] Removed legacy cache cleanup (`tags_cache`, `tags_cache_v2`)
- [x] Implemented tag editing via `PUT /api/v3/tags` (`editTagsOnPhoto`)

### Deprecated Endpoints Removed
These legacy endpoints are no longer called by the mobile app:
- `POST /api/register` → use `POST /api/auth/register`
- `POST /api/v2/add-tags-to-uploaded-image` → use `POST /api/v3/tags`
- `DELETE /api/photos/delete` → use `POST /api/profile/photos/delete`
- `GET /api/user` → use `GET /api/user/profile/index`
- `GET /api/history/paginated` → use `GET /api/v3/user/photos`

### Next: Enhanced Features
- [ ] Public profiles via `GET /api/user/profile/{id}`
- [ ] Location-scoped leaderboards (`locationType` + `locationId` params)
- [ ] Achievements display — data already available from profile/index (`achievements.unlocked`, `achievements.total`)
- [ ] User photo map via `GET /api/user/profile/map` — **coordinates are [lat, lon] not [lon, lat]**
