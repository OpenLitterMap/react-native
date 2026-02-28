# OpenLitterMap API

Base URL: `/api`

## Authentication

Most endpoints require a Bearer token (Sanctum) or active session.

- **Session auth (SPA):** `POST /api/auth/login` sets a session cookie
- **Token auth (Mobile):** `POST /api/auth/token` returns a Sanctum `token`

Include the token as: `Authorization: Bearer <token>`

All `auth:sanctum` routes accept both session cookies and Bearer tokens.

---

## Auth Endpoints

### POST /api/auth/token — Mobile Token Login

**Auth:** None (guest)
**Rate limit:** 5 attempts per minute

**Request:**
```json
{
  "identifier": "email_or_username",
  "password": "secret"
}
```

Backward compat: accepts `email` or `username` field if `identifier` is absent.
Priority: `identifier` > `email` > `username`.
Auto-detects email vs username via `filter_var()`.

**Response (200):**
```json
{
  "token": "1|abcdef1234567890...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "johndoe",
    "name": null,
    "verified": true,
    "total_images": 42,
    "xp": 5000,
    "level": 3,
    "xp_redis": 5000,
    "position": 12,
    "next_level": {
      "level": 4,
      "title": "Litter Wizard",
      "xp": 5000,
      "xp_into_level": 500,
      "xp_for_next": 1000,
      "xp_remaining": 500,
      "progress_percent": 50
    }
  }
}
```

**Error (422):**
```json
{
  "message": "The given data was invalid.",
  "errors": { "identifier": ["The auth.failed message"] }
}
```

Previous tokens named `mobile` are revoked on each login (prevents token buildup).
Token is created with name `mobile`: `$user->createToken('mobile')`.

---

### POST /api/auth/login — Session Login (SPA)

**Auth:** None (guest)
**Rate limit:** 5 attempts per minute (disabled on localhost)

**Request:**
```json
{
  "identifier": "email_or_username",
  "password": "secret",
  "remember": true
}
```

**Response (200):**
```json
{
  "success": true,
  "user": { /* full user object */ }
}
```

Session is regenerated after login. `remember` sets 2-week persistent cookie.

---

### POST /api/auth/logout

**Auth:** Required (web session)
**Middleware:** `web`, `auth:web`

**Response (200):**
```json
{ "success": true }
```

---

### POST /api/auth/register

**Aliases:** `POST /api/register` (legacy mobile)
**Auth:** None (guest)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "username": "optional_3to255_alphanum"
}
```

| Field | Rules |
|-------|-------|
| `email` | required, valid email, max 75, unique |
| `password` | required, min 8 chars |
| `username` | optional (auto-generated if omitted), 3-255 chars, regex `/^[a-zA-Z0-9_-]+$/`, unique |

**Response (200):**
```json
{
  "token": "1|abcdef...",
  "user": { /* full user object, xp=0, level=0 */ }
}
```

Side effects: welcome email (`NewUserRegMail`) sent, `Registered` and `UserSignedUp` events fired, quotas initialized (images_remaining=1000, verify_remaining=5000). `name` is always set to NULL regardless of input. Auto-generated usernames use pattern `{adjective}-{noun}-{number}` (e.g. `violently-enthusiastic-bin-overlord-5432`). Token created with name `mobile`.

---

### POST /api/validate-token — Check Token Validity

**Auth:** Required (Sanctum)

**Response (200):**
```json
{ "message": "valid" }
```

Returns 401 if token is invalid/expired.

---

### GET /api/user — Get Authenticated User

**Auth:** Required (Sanctum)

Returns the full User model with `position` and `xp_redis` appended, plus `littercoin_count`.

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "username": "johndoe",
  "name": null,
  "xp": 5000,
  "total_images": 42,
  "xp_redis": 5000,
  "position": 12,
  "littercoin_count": 3,
  "next_level": {
    "level": 4,
    "title": "Litter Wizard",
    "xp": 5000,
    "xp_into_level": 0,
    "xp_for_next": 5000,
    "xp_remaining": 0,
    "progress_percent": 100
  }
}
```

### GET /api/current-user — Get Authenticated User (Legacy)

**Auth:** Required (session `auth`)

Returns user model with `roles` eager-loaded and `xp_redis` appended. Used by SPA.

---

### POST /api/password/email — Request Password Reset

**Auth:** None
**Rate limit:** 3 per minute

**Request:**
```json
{ "login": "email_or_username" }
```

**Response (200):** Always returns same message (prevents user enumeration):
```json
{ "message": "If an account with these details exists, we will send a password reset link." }
```

---

### POST /api/password/validate-token — Validate Reset Token

**Auth:** None

**Request:**
```json
{ "token": "reset_token", "email": "user@example.com" }
```

**Response:** `{ "valid": true }` (200) or `{ "valid": false }` (422).
Token is not consumed (safe to call multiple times). Tokens expire after 60 minutes.

---

### POST /api/password/reset — Complete Password Reset

**Auth:** None

**Request:**
```json
{
  "token": "reset_token",
  "email": "user@example.com",
  "password": "new_password",
  "password_confirmation": "new_password"
}
```

`password`: min 5 chars, confirmed.

**Response (200):**
```json
{
  "message": "Your password has been reset!",
  "user": { /* full user object */ }
}
```

User is auto-logged in after successful reset. Token is consumed (single-use).

---

### POST /api/settings/delete-account — Delete Account (GDPR)

**Auth:** Required (Sanctum)

**Request:**
```json
{ "password": "current_password" }
```

**Response (200):** `{ "success": true }`
**Error:** `{ "success": false, "msg": "password does not match" }`

Photos preserved as anonymous contributions (user_id set to NULL via DB CASCADE).
Cleans up: teams, metrics, Redis leaderboards, OAuth tokens, subscriptions, roles.

---

## Photo Upload

### POST /api/v3/upload — Web Photo Upload

**Auth:** Required (Sanctum)
**Content-Type:** multipart/form-data

**Request:**

| Field | Type | Rules |
|-------|------|-------|
| `photo` | file | required, jpg/png/jpeg/heif/heic/webp, max 20MB, min 1x1 |

Must contain valid EXIF with GPS coordinates and datetime.

**Response (200):**
```json
{ "success": true, "photo_id": 12345 }
```

**Validation errors:**
- "Could not read EXIF data from the image."
- "The image does not contain a date. Please check your camera settings."
- "You have already uploaded this photo"
- "Sorry, no GPS on this one."
- "Error: Could not read GPS coordinates from this image..."

Side effects: S3 upload (full + bbox thumbnail), reverse geocoding via `ResolveLocationAction`, `ImageUploaded` broadcast event. No metrics/XP processing (happens at tagging time).

---

### POST /api/photos/submit — Legacy Mobile Upload (v1)

**Auth:** Required (Sanctum)
**Content-Type:** multipart/form-data

**Request:**

| Field | Type | Rules |
|-------|------|-------|
| `photo` | file | required, jpg/png/jpeg/heic/heif |
| `lat` | numeric | required |
| `lon` | numeric | required |
| `date` | string/int | required, ISO 8601 or Unix timestamp |
| `model` | string | optional, defaults to 'Mobile app v2' |
| `picked_up` | bool | optional |

Mobile sends coordinates directly (not from EXIF).

**Response (200):** `{ "success": true, "photo_id": 12345 }`
**Error:** `{ "success": false, "msg": "error-3" | "photo-already-uploaded" | "invalid-coordinates" }`

---

### POST /api/photos/submit-with-tags — Legacy Mobile Upload + Tags (v2)

**Aliases:** `/api/photos/upload-with-tags`, `/api/photos/upload/with-or-without-tags`
**Auth:** Required (Sanctum)

Same as `/photos/submit` plus:

| Field | Type | Rules |
|-------|------|-------|
| `tags` | array/JSON string | optional, v4 tag format |
| `custom_tags` | array/JSON string | optional |

**v4 tag format (legacy mobile):**
```json
[{
  "category": "smoking",
  "object": "cigarette_butt",
  "brand_only": false,
  "brand": null,
  "material_only": false,
  "material": "paper",
  "custom": null,
  "key": "cigarette_butt"
}]
```

Tags are auto-converted from v4 to v5 format via `ConvertV4TagsAction`.

---

### DELETE /api/photos/delete — Delete Photo (Legacy Mobile)

**Auth:** Required (Sanctum)

**Request:**
```json
{ "photoId": 123 }
```

**Response (200):** `{ "success": true }`
**Error (403):** `{ "success": false, "msg": "Photo not found" }` (not found or not owned)

Reverses metrics if photo was processed (`processed_at` not null). Soft-deletes photo, removes S3 files. Decrements user `xp` and `total_images` (with `max(0, ...)` guard).

---

### GET /api/check-web-photos — Check for Untagged Photos (Legacy)

**Auth:** Required (Sanctum)

**Response (200):**
```json
{ "photos": [{ "id": 1, "filename": "photo.jpg" }] }
```

Returns user's untagged photos (`verified = 0`), selecting only `id` and `filename`.

---

## Tags

### GET /api/tags — Get Available Tags (Nested by Category)

**Auth:** None (public)

**Query params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category key (e.g. `smoking`) |
| `object` | string | Filter by object key (partial match) |
| `materials` | string | Comma-separated material keys |
| `search` | string | Prefix search across all keys |

**Response (200):**
```json
{
  "tags": {
    "smoking": {
      "id": 1,
      "key": "smoking",
      "litter_objects": [
        {
          "id": 5,
          "key": "cigarette_butt",
          "materials": [
            { "id": 10, "key": "paper" }
          ]
        }
      ]
    }
  }
}
```

---

### GET /api/tags/all — Get All Tags (Flat Arrays)

**Auth:** None (public)

**Response (200):**
```json
{
  "categories": [{ "id": 1, "key": "smoking" }],
  "objects": [{ "id": 5, "key": "cigarette_butt", "categories": [...] }],
  "materials": [{ "id": 10, "key": "paper" }],
  "brands": [{ "id": 100, "key": "marlboro" }],
  "types": [{ "id": 20, "key": "aluminum", "name": "Aluminum Can" }],
  "category_objects": [{ "id": 1, "category_id": 1, "litter_object_id": 5 }],
  "category_object_types": [{ "category_litter_object_id": 1, "litter_object_type_id": 20 }]
}
```

Note: `category_object_types` has no `id` column — use composite key for dedup.

---

### POST /api/v3/tags — Add Tags to Photo

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "photo_id": 12345,
  "tags": [
    {
      "category_litter_object_id": 1,
      "litter_object_type_id": null,
      "quantity": 1,
      "picked_up": true,
      "materials": [1, 2],
      "brands": [4],
      "custom_tags": ["found on bench"]
    }
  ]
}
```

| Field | Type | Rules |
|-------|------|-------|
| `photo_id` | int | required, must exist (not soft-deleted), owned by user |
| `tags` | array | required, min 1 |
| `tags.*.category_litter_object_id` | int | FK to `category_litter_object` |
| `tags.*.litter_object_type_id` | int/null | FK to `litter_object_types` |
| `tags.*.quantity` | int | min 1 |
| `tags.*.picked_up` | bool/null | optional |
| `tags.*.materials` | array | material IDs |
| `tags.*.brands` | array | brand IDs |
| `tags.*.custom_tags` | array | string tags |

**Gates:**
- 403 if user doesn't own photo
- 403 if photo already verified (`verified >= 1`)

**Response (200):**
```json
{
  "success": true,
  "photoTags": [{ "id": 1, "photo_id": 12345, "category_litter_object_id": 1, ... }]
}
```

Category is auto-resolved from `category_litter_object_id`. Generates summary, calculates XP, triggers metrics processing via `TagsVerifiedByAdmin` event.

---

### PUT /api/v3/tags — Replace All Tags on Photo

**Auth:** Required (Sanctum)

Same request format as POST. Key differences:
- **No verification gate** — allows re-tagging verified photos
- Deletes all existing tags + extras first
- Resets summary, XP, and verified status to 0
- Re-runs full tag pipeline (summary + XP + metrics delta)

---

### POST /api/add-tags — Legacy Mobile Tagging

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "photo_id": 123,
  "litter": [{ /* v4 tag objects */ }],
  "custom_tags": ["tag1"],
  "picked_up": true
}
```

Also accepts `tags` field instead of `litter`.
Auto-converts v4 format to v5 via `ConvertV4TagsAction`.

**Response:** `{ "success": true, "msg": "tags-added" }`

---

## User Profile

### GET /api/user/profile/index — Authenticated Profile

**Auth:** Required (Sanctum)

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John",
    "username": "johndoe",
    "email": "john@example.com",
    "avatar": "https://...",
    "created_at": "2020-01-15T10:30:00Z",
    "member_since": "January 2020",
    "global_flag": "us",
    "public_profile": true,
    "show_name": true,
    "show_username": true,
    "show_name_maps": true,
    "show_username_maps": true,
    "previous_tags": true,
    "emailsub": true
  },
  "stats": {
    "uploads": 100,
    "litter": 450,
    "xp": 5000,
    "streak": 7,
    "littercoin": 250,
    "photo_percent": 0.5,
    "tag_percent": 0.8
  },
  "level": {
    "level": 3,
    "title": "Litter Wizard",
    "xp": 5000,
    "xp_into_level": 0,
    "xp_for_next": 5000,
    "xp_remaining": 0,
    "progress_percent": 100
  },
  "rank": {
    "global_position": 42,
    "global_total": 500,
    "percentile": 91.6
  },
  "global_stats": {
    "total_photos": 20000,
    "total_litter": 56000
  },
  "achievements": { "unlocked": 15, "total": 30 },
  "locations": { "countries": 5, "states": 12, "cities": 45 },
  "team": { "id": 5, "name": "Team A" }
}
```

Stats from Redis with MySQL fallback. `team` is null if no active team.

---

### GET /api/user/profile/{id} — Public Profile

**Auth:** None (public)

**Path Parameters:**

| Parameter | Type | Description   |
|-----------|------|---------------|
| `id`      | int  | The user's ID |

**Response (public profile):**

```json
{
  "public": true,
  "user": {
    "id": 42,
    "name": "Sean",
    "username": "seanlynch",
    "avatar": null,
    "global_flag": "ie",
    "member_since": "January 2020"
  },
  "stats": {
    "uploads": 500,
    "litter": 2000,
    "xp": 15000
  },
  "level": {
    "level": 7,
    "title": "Trashmonster",
    "xp": 15000,
    "xp_into_level": 0,
    "xp_for_next": 35000,
    "xp_remaining": 35000,
    "progress_percent": 0
  },
  "rank": {
    "global_position": 5,
    "global_total": 1457,
    "percentile": 99.7
  },
  "achievements": {
    "unlocked": 12,
    "total": 50
  },
  "locations": {
    "countries": 3,
    "states": 8,
    "cities": 15
  }
}
```

**Response (private profile):**

```json
{
  "public": false
}
```

**Notes:**
- `name` and `username` respect the user's privacy settings (`show_name`, `show_username`). They return `null` when hidden.
- Returns `404` if the user ID does not exist.

---

### GET /api/user/profile/map — User's Photo GeoJSON

**Auth:** Required (Sanctum)

**Query params (optional):**

| Param | Type | Description |
|-------|------|-------------|
| `period` | string | `created_at`, `datetime`, `updated_at` |
| `start` | string | YYYY-MM-DD |
| `end` | string | YYYY-MM-DD |

**Response:** GeoJSON FeatureCollection. Only includes `verified >= 2` (ADMIN_APPROVED). Coordinates as `[lat, lon]`. Respects `show_name_maps` and `show_username_maps` privacy settings.

---

### POST /api/user/profile/download — Request Data Export

**Auth:** Required (Sanctum)

**Query params (optional):**

| Param | Type | Description |
|-------|------|-------------|
| `dateField` | string | `created_at`, `datetime`, `updated_at` |
| `fromDate` | string | YYYY-MM-DD (default: 2017) |
| `toDate` | string | YYYY-MM-DD (default: now) |

**Response:** `{ "success": true }`

Queues CSV export, emails S3 download link when ready.

---

## User Photos

### GET /api/v3/user/photos — User's Photos (Paginated + Filterable)

**Auth:** Required (Sanctum)

**Query params (all optional):**

| Param | Type | Description |
|-------|------|-------------|
| `tagged` | bool | `true` = verified >= 1, `false` = verified = 0 |
| `id` | int | Filter by photo ID |
| `id_operator` | string | Comparison operator (default `=`) |
| `tag` | string | Filter by litter object key (LIKE search) |
| `custom_tag` | string | Filter by custom tag key (LIKE search) |
| `date_from` | string | Start date (ISO) |
| `date_to` | string | End date (ISO) |

Pagination: 8 per page, ordered by `created_at` DESC.

**Response (200):**
```json
{
  "photos": [{
    "id": 123,
    "filename": "https://...",
    "datetime": "2020-01-15T10:30:00Z",
    "lat": 40.7128,
    "lon": -74.0060,
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
      "extra_tags": [
        { "type": "brand", "quantity": 3, "tag": { "id": 10, "key": "marlboro" } },
        { "type": "material", "quantity": 3, "tag": { "id": 50, "key": "paper" } }
      ]
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

Tags are under the `new_tags` key (v5 format with nested category/object/extra_tags).

---

### GET /api/v3/user/photos/stats — Upload Statistics

**Auth:** Required (Sanctum)

**Response (200):**
```json
{
  "totalPhotos": 100,
  "totalTags": 450,
  "leftToTag": 10,
  "taggedPercentage": 90
}
```

---

### POST /api/user/profile/photos/delete — Bulk Delete Photos

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "selectAll": false,
  "inclIds": [123, 124, 125],
  "exclIds": [],
  "filters": "{}"
}
```

Reverses metrics, removes S3 files, soft-deletes. Only deletes user's own photos.

---

### POST /api/profile/photos/delete — Delete Single Photo

**Auth:** Required (Sanctum)

**Request:**
```json
{ "photoId": 123 }
```

**Response (200):** `{ "message": "Photo deleted successfully!" }`
**Error:** 403 if photo not owned by user.

Reverses metrics, removes S3 files, soft-deletes, decrements user XP and total_images.

---

### GET /api/user/profile/photos/index — Unverified Photos (Legacy)

**Auth:** Required (Sanctum)

Paginated list of user's unverified photos (`verified = 0`), 300 per page, ordered by `created_at` DESC.

**Response (200):**
```json
{
  "paginate": { /* Laravel paginator */ },
  "count": 50
}
```

---

### GET /api/user/profile/photos/filter — Filter User's Photos (Legacy)

**Auth:** Required (Sanctum)

**Query params:** `filters` (JSON string), `selectAll` (bool), `inclIds` (array), `exclIds` (array)

**Response (200):**
```json
{
  "count": 50,
  "paginate": { /* Laravel paginator */ }
}
```

---

### GET /api/user/profile/photos/previous-custom-tags — Previous Custom Tags

**Auth:** Required (Sanctum)

**Response (200):**
```json
["found on bench", "near park entrance"]
```

---

## Settings

### POST /api/settings/details — Update Name/Email/Username

**Auth:** Required (Sanctum)

**Request:**
```json
{ "name": "John", "email": "john@example.com", "username": "johndoe" }
```

| Field | Rules |
|-------|-------|
| `name` | min 3, max 25 |
| `email` | required, email, max 75, unique |
| `username` | required, min 3, max 75, unique |

**Response:** `{ "message": "success", "email_changed": false }`

---

### PATCH /api/settings/details/password — Change Password

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "oldpassword": "current",
  "password": "new_password",
  "password_confirmation": "new_password"
}
```

`password`: min 5, confirmed.

**Response:** `{ "message": "success" }` or `{ "message": "fail" }` (wrong old password)

---

### POST /api/settings/update — Update Setting by Key/Value

**Auth:** Required (Sanctum)

**Request:**
```json
{ "key": "username", "value": "new_value" }
```

**Allowed keys and rules:**

| Key | Rules | Notes |
|-----|-------|-------|
| `name` | string, min 3, max 25 | |
| `username` | string, min 3, max 75 | unique validation |
| `email` | email, max 75 | unique validation |
| `global_flag` | nullable, string, max 10 | ISO country code |
| `items_remaining` | boolean | |
| `previous_tags` | boolean | |
| `emailsub` | boolean | |
| `public_profile` | boolean | |

Legacy mobile: `picked_up` key remaps to `items_remaining` (inverted value).

**Response:** `{ "success": true }` or `{ "success": false, "msg": "..." }`

---

### POST /api/settings/privacy/update — Update All Privacy Flags

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "show_name": true,
  "show_username": false,
  "show_name_maps": true,
  "show_username_maps": false,
  "show_name_createdby": true,
  "show_username_createdby": false,
  "prevent_others_tagging_my_photos": false
}
```

---

### Privacy Toggle Endpoints

All POST, auth required. Each toggles a single boolean and returns the new value.

| Endpoint | Toggles | Response key |
|----------|---------|-------------|
| `/api/settings/privacy/maps/name` | show_name_maps | `show_name_maps` |
| `/api/settings/privacy/maps/username` | show_username_maps | `show_username_maps` |
| `/api/settings/privacy/leaderboard/name` | show_name | `show_name` |
| `/api/settings/privacy/leaderboard/username` | show_username | `show_username` |
| `/api/settings/privacy/createdby/name` | show_name_createdby | `show_name_createdby` |
| `/api/settings/privacy/createdby/username` | show_username_createdby | `show_username_createdby` |
| `/api/settings/privacy/toggle-previous-tags` | previous_tags | `previous_tags` |
| `/api/settings/email/toggle` | emailsub | `sub` |

---

### PATCH /api/settings — Update Social Links

**Auth:** Required (Sanctum)

**Request (all optional, must be valid URLs):**
```json
{
  "social_twitter": "https://twitter.com/user",
  "social_facebook": "https://facebook.com/user",
  "social_instagram": "https://instagram.com/user",
  "social_linkedin": "https://linkedin.com/in/user",
  "social_reddit": "https://reddit.com/u/user",
  "social_personal": "https://example.com"
}
```

**Response:** `{ "message": "success" }`

---

### POST /api/settings/save-flag — Set Country Flag

**Auth:** Required (Sanctum)

**Request:** `{ "country": "us" }`
**Response:** `{ "message": "success" }`

---

### GET /api/settings/flags/countries — Available Flag Countries

**Auth:** None (public)

**Response:** Key-value pairs of `shortcode` -> `country name`.

---

### POST /api/settings/phone/submit — Set Phone Number

**Auth:** Required (Sanctum)

**Request:** `{ "phonenumber": "+1234567890" }`

---

### POST /api/settings/phone/remove — Remove Phone Number

**Auth:** Required (Sanctum)

**Response:** `{ "message": "success" }`

---

## Leaderboard

### GET /api/leaderboard

Returns ranked users by XP. Requires authentication.

**Query Parameters:**

| Parameter      | Type   | Default    | Description                                                                 |
|----------------|--------|------------|-----------------------------------------------------------------------------|
| `timeFilter`   | string | `all-time` | One of: `all-time`, `today`, `yesterday`, `this-month`, `last-month`, `this-year`, `last-year` |
| `locationType` | string | —          | Filter by location scope: `country`, `state`, `city`. Must be paired with `locationId`. |
| `locationId`   | int    | —          | ID of the location to filter by. Must be paired with `locationType`.        |
| `page`         | int    | `1`        | Page number (100 results per page).                                         |

**Response:**

```json
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

**User object fields:**

| Field            | Type        | Description                                                     |
|------------------|-------------|-----------------------------------------------------------------|
| `user_id`        | int         | User ID. Use to link to public profile.                         |
| `public_profile` | bool        | Whether the user's profile is publicly viewable.                |
| `name`           | string      | Display name (empty string if user hides name on leaderboards). |
| `username`       | string      | `@username` (empty string if user hides username).              |
| `xp`             | string      | Formatted XP with commas (e.g. `"1,234"`).                     |
| `global_flag`    | string/null | ISO country code for flag display (e.g. `"ie"`, `"gb"`).       |
| `social`         | object/null | Social links keyed by type (`twitter`, `facebook`, `personal`). |
| `team`           | string      | Active team name (empty string if none or hidden).              |
| `rank`           | int         | Position in the leaderboard (1-indexed).                        |

**Time filters explained:**

| Filter       | Description                        |
|--------------|------------------------------------|
| `all-time`   | Cumulative XP across all time      |
| `today`      | XP earned today (UTC)              |
| `yesterday`  | XP earned yesterday (UTC)          |
| `this-month` | XP earned in the current month     |
| `last-month` | XP earned in the previous month    |
| `this-year`  | XP earned in the current year      |
| `last-year`  | XP earned in the previous year     |

**Error responses:**

- Missing one of `locationType`/`locationId`: `{ "success": false, "msg": "Both locationType and locationId required for location filtering" }`
- Invalid `locationType`: `{ "success": false, "msg": "Invalid locationType" }`
- Invalid `timeFilter`: `{ "success": false, "msg": "Invalid time filter" }`

Filters on `xp > 0`. Users with `public_profile=true` have clickable profiles at `/profile/{user_id}`.

---

## Achievements

### GET /api/achievements

**Auth:** Required (Sanctum)

**Response (200):**
```json
{
  "overview": {
    "uploads": {
      "progress": 42,
      "next_threshold": 50,
      "percentage": 84,
      "unlocked": [
        { "id": 1, "threshold": 10, "metadata": { "name": "First Steps", "icon": "rocket" } }
      ],
      "next": { "id": 2, "threshold": 50, "percentage": 84 }
    },
    "streak": { "..." : "..." },
    "total_categories": { "..." : "..." },
    "total_objects": { "..." : "..." }
  },
  "categories": [{
    "id": 1,
    "key": "smoking",
    "name": "Smoking",
    "achievement": { "..." : "..." },
    "objects": [{
      "id": 1,
      "key": "cigarette",
      "name": "Cigarette",
      "achievement": { "..." : "..." }
    }]
  }],
  "summary": { "total": 150, "unlocked": 42, "percentage": 28 }
}
```

Hierarchical: overview > categories > objects. Sorted by progress (highest first).

---

## Global Map

### GET /api/points — Map Points (GeoJSON)

**Auth:** None (public)

**Query params:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `bbox` | object | required | `{left, bottom, right, top}` bounding box |
| `zoom` | int | required | Zoom level (0-22) |
| `page` | int | 1 | Page number |
| `per_page` | int | 1000 | Results per page (max 500) |
| `categories` | array | — | Category keys to filter |
| `litter_objects` | array | — | Object keys to filter |
| `materials` | array | — | Material keys to filter |
| `brands` | array | — | Brand keys to filter |
| `custom_tags` | array | — | Custom tag keys to filter |
| `from` | string | — | Start date (YYYY-MM-DD) |
| `to` | string | — | End date (YYYY-MM-DD) |
| `year` | int | — | Filter by year (overrides from/to) |
| `username` | string | — | Filter by username |

**Response (200):** GeoJSON FeatureCollection
```json
{
  "type": "FeatureCollection",
  "features": [{
    "type": "Feature",
    "geometry": { "type": "Point", "coordinates": [-74.006, 40.713] },
    "properties": {
      "id": 123,
      "datetime": "2025-02-28T10:30:00Z",
      "verified": 2,
      "picked_up": false,
      "summary": { "..." : "..." },
      "filename": "photo.jpg",
      "username": "johndoe",
      "name": "John",
      "team": "Team A",
      "social": null
    }
  }],
  "page": 1,
  "last_page": 10,
  "per_page": 1000,
  "total": 9500,
  "has_more_pages": true,
  "meta": {
    "bbox": [-74.006, 40.713, -74.005, 40.714],
    "zoom": 12,
    "generated_at": "2025-02-28T16:30:00Z"
  }
}
```

Only `is_public = true` photos. Masks identity for safeguarded teams. `filename` shown only if `verified >= 2`. Caches non-username-filtered requests for 2 minutes.

---

### GET /api/points/{id} — Single Photo Point

**Auth:** None (public)

Returns single photo data. Used as fallback when photo isn't in current GeoJSON page.

**Response (200):**
```json
{
  "id": 123,
  "lat": 40.7128,
  "lon": -74.0060,
  "datetime": "2025-02-28T10:30:00Z",
  "verified": 2,
  "filename": "photo.jpg",
  "username": "johndoe",
  "name": "John",
  "social": null,
  "flag": "ie",
  "team": "Team A",
  "summary": { ... }
}
```

Identity fields (`username`, `name`, `social`, `flag`) are `null` when team has safeguarding enabled. Privacy settings (`show_name_maps`, `show_username_maps`) are respected.

---

### GET /api/points/stats — Map Stats for Viewport

**Auth:** None (public)

Same query params as `/api/points`.

**Response (200):**
```json
{
  "data": {
    "photos": 150,
    "tags": 500,
    "categories": 8,
    "objects": 25,
    "brands": 12
  },
  "meta": {
    "bbox": [-74.006, 40.713, -74.005, 40.714],
    "zoom": 12,
    "categories": null,
    "litter_objects": null,
    "materials": null,
    "brands": null,
    "custom_tags": null,
    "from": null,
    "to": null,
    "username": null,
    "year": null,
    "generated_at": "2025-02-28T16:30:00Z",
    "cached": false
  }
}
```

---

### GET /api/clusters — Map Clusters (GeoJSON)

**Auth:** None (public)

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `zoom` | numeric | Snapped to nearest configured zoom level |
| `bbox` | array/string | `bbox[left]`, `bbox[bottom]`, `bbox[right]`, `bbox[top]` — or comma-separated string `-180,-90,180,90` |
| `lat`, `lon` | numeric | Optional, creates bbox if no bbox provided |

**Response:** GeoJSON FeatureCollection with cluster points containing `properties.count`.

Supports ETag-based caching (`If-None-Match` header returns 304 if unchanged). Response includes `Cache-Control`, `ETag`, and `X-Cluster-Zoom` headers.

---

### GET /api/clusters/zoom-levels — Available Cluster Zoom Levels

**Auth:** None (public)

**Response (200):**
```json
{
  "zoom_levels": [2, 4, 6, 8, 10, 12],
  "global_zooms": [2, 4, 6],
  "tile_zooms": [8, 10, 12]
}
```

---

### GET /api/global/stats-data — Global Statistics (Deprecated)

**Auth:** None (public)

**Response:**
```json
{
  "total_litter": 500000,
  "total_photos": 50000,
  "previousXp": 250000,
  "nextXp": 500000,
  "littercoin": 1000,
  "total_users": 10000
}
```

---

## Locations

### GET /api/locations/global — Global Stats + Country List

**Auth:** None (public)

---

### GET /api/locations/{type} — List Locations by Type

**Auth:** None (public)
**Types:** `country`, `state`, `city`

**Query params (optional):**

| Param | Type | Description |
|-------|------|-------------|
| `period` | string | `today`, `yesterday`, `this_month`, `last_month`, `this_year` |
| `year` | int | Custom year (2015-current) |
| `month` | int | Custom month 1-12 (requires year) |

**Response (200):**
```json
{
  "stats": {
    "photos": 50000,
    "tags": 150000,
    "xp": 2500000,
    "contributors": 5000,
    "countries": 110,
    "total_users": 10000
  },
  "activity": {
    "today": { "photos": 150, "tags": 500, "xp": 15000 },
    "this_month": { "photos": 3000, "tags": 10000, "xp": 300000 }
  },
  "locations": [{
    "id": 1,
    "name": "United States",
    "shortcode": "US",
    "photos": 20000,
    "tags": 60000,
    "xp": 1000000,
    "contributors": 2000,
    "pct_tags": 40.0,
    "pct_photos": 40.0,
    "avg_tags_per_person": 30.0,
    "avg_photos_per_person": 10.0,
    "created_at": "2015-01-01T00:00:00Z",
    "created_by": "John Doe",
    "last_updated_at": "2025-02-28T10:30:00Z",
    "last_updated_by": "Jane Smith"
  }],
  "location_type": "country",
  "breadcrumbs": [{ "name": "World", "type": "global", "id": null }]
}
```

Response keys are `locations` and `location_type` (not `children`/`children_type`).

---

### GET /api/locations/{type}/{id} — Location Detail + Children

Same query params as index. Returns `location`, `stats`, `meta`, `activity`, `locations` (children), `location_type`, `breadcrumbs`.

---

### GET /api/locations/{type}/{id}/categories — Location Category Breakdown

### GET /api/locations/{type}/{id}/timeseries — Location Time Series

### GET /api/locations/{type}/{id}/leaderboard — Location Leaderboard

### Location Tag Endpoints (all under `/api/locations/{type}/{id}/tags/`)

| Endpoint | Description |
|----------|-------------|
| `/top` | Top tags at this location |
| `/summary` | Tag summary |
| `/by-category` | Tags grouped by category |
| `/cleanup` | Cleanup data |
| `/trending` | Trending tags |

---

### Legacy: GET /api/v1/locations/{type}/{id}

Same as above, constrained to `country|state|city` types and numeric IDs.

---

## Teams

### GET /api/teams/types — Team Types (Public, no auth)

**Response:** `{ "success": true, "types": [{ "id": 1, "team": "School" }, ...] }`

Returns team types ordered by `id` descending.

---

### POST /api/teams/create — Create Team

**Auth:** Required (Sanctum)

**Request:**
```json
{ "name": "Team Name", "description": "...", "type_id": 1 }
```

---

### POST /api/teams/join — Join Team

**Auth:** Required (Sanctum)

**Request:** `{ "identifier": "team_code" }`
**Response:** `{ "success": true, "team": { ... }, "activeTeam": { ... } }`
**Error:** `{ "success": false, "msg": "already-joined" }`

---

### POST /api/teams/leave — Leave Team

**Auth:** Required (Sanctum)

**Request:** `{ "team_id": 1 }`
**Response:** `{ "success": true, "team": { ... }, "activeTeam": { ... } }`
**Errors (403):** `not-a-member`, `you-are-last-member`

User cannot be the only member.

---

### POST /api/teams/active — Set Active Team

**Auth:** Required (Sanctum)

**Request:** `{ "team_id": 1 }`
**Response:** `{ "success": true, "team": { ... } }`
**Errors:** `{ "success": false, "message": "team-not-found" | "not-a-member" }`

---

### POST /api/teams/inactivate — Deactivate All Teams

**Auth:** Required (Sanctum)

Sets active team to null.

---

### PATCH /api/teams/update/{team} — Update Team

**Auth:** Required (team leader only)

**Response:** `{ "success": true, "team": { ... } }`
**Error (403):** `{ "success": false, "message": "member-not-allowed" }`

---

### GET /api/teams/joined — User's Joined Teams

**Auth:** Required (Sanctum)

**Response:** Raw array of team objects (user's teams collection).

---

### GET /api/teams/list — List User's Teams

**Auth:** Required (Sanctum)

**Response:** `{ "success": true, "teams": [ ... ] }`

---

### GET /api/teams/members?team_id=X — Team Members

**Auth:** Required (Sanctum)

**Response:**
```json
{
  "success": true,
  "total_members": 25,
  "result": [{ "id": 123, "name": "Student 1", ... }]
}
```

School teams apply safeguarding: deterministic pseudonyms ("Student 1", "Student 2", etc.).

---

### GET /api/teams/data?team_id=X&period=all — Team Dashboard Data

**Auth:** Required (Sanctum)

| Param | Type | Description |
|-------|------|-------------|
| `team_id` | int | required (0 = all user's teams) |
| `period` | string | `today`, `week`, `month`, `year`, `all` (default) |

**Response:**
```json
{
  "photos_count": 150,
  "litter_count": 500,
  "members_count": 25,
  "verification": {
    "unverified": 10,
    "verified": 20,
    "admin_approved": 50,
    "bbox_applied": 30,
    "bbox_verified": 25,
    "ai_ready": 15
  }
}
```

---

### GET /api/teams/leaderboard — Teams Leaderboard

**Auth:** Required (Sanctum)

Teams ranked by total litter. Only teams with `leaderboards=true` shown.

---

### POST /api/teams/leaderboard/visibility — Toggle Leaderboard Visibility

**Auth:** Required (team leader)

**Request:** `{ "team_id": 1 }`
**Response:** `{ "success": true, "visible": true }` (where `visible` = team's `leaderboards` field)
**Error (403):** `{ "success": false, "message": "member-not-allowed" }`

---

### POST /api/teams/settings — Update Team Privacy

**Auth:** Required (Sanctum)

**Request:**
```json
{
  "team_id": 1,
  "settings": {
    "show_name_maps": true,
    "show_username_maps": true,
    "show_name_leaderboards": false,
    "show_username_leaderboards": false
  }
}
```

Use `"all": true` instead of `team_id` to apply to all user's teams.

**Response:** `{ "success": true }`
**Error (403):** `{ "message": "Not a member of this team." }`

---

### GET /api/teams/photos?team_id=X&status=pending — Team Photos

**Auth:** Required (team member)

| Param | Type | Description |
|-------|------|-------------|
| `team_id` | int | required |
| `status` | string | `pending`, `approved`, `all` (default) |
| `page` | int | page number |

**Response:**
```json
{
  "success": true,
  "photos": {
    "data": [{
      "id": 123,
      "filename": "photo.jpg",
      "is_public": false,
      "verified": 1,
      "team_approved_at": null,
      "photoTags": [{ ... }],
      "user": { "id": 123, "name": "Student Name" }
    }],
    "total": 50,
    "current_page": 1
  },
  "stats": { "total": 150, "pending": 50, "approved": 100 }
}
```

---

### GET /api/teams/photos/{photo} — Single Team Photo

**Auth:** Required (team member)

**Response:** `{ "success": true, "photo": { ... } }`
**Errors:** `{ "success": false, "message": "not-a-team-photo" }` (404), `{ "success": false, "message": "not-a-member" }` (403)

---

### PATCH /api/teams/photos/{photo}/tags — Update Team Photo Tags

**Auth:** Required (team leader / `manage school team` permission)

Deletes existing tags, recreates with new data, regenerates summary + XP.

---

### POST /api/teams/photos/approve — Approve Photos

**Auth:** Required (team leader / `manage school team` permission)

**Request:**
```json
{ "team_id": 1, "photo_ids": [123, 124] }
```
Or: `{ "team_id": 1, "approve_all": true }`

**Response:** `{ "success": true, "approved_count": 3, "message": "3 photos approved and published." }`

Idempotent (WHERE `is_public = 0`). Sets `is_public=true`, fires `TagsVerifiedByAdmin` for metrics.

---

### POST /api/teams/photos/revoke — Revoke Photo Approval

**Auth:** Required (team leader / `manage school team` permission)

**Request:**
```json
{ "team_id": 1, "photo_ids": [123, 124] }
```
Or: `{ "team_id": 1, "revoke_all": true }`

**Response:** `{ "success": true, "revoked_count": 2, "message": "2 photos revoked." }`

Idempotent (WHERE `is_public = true`). Reverses metrics, sets `is_public=false`, `verified=1`.

---

### DELETE /api/teams/photos/{photo}?team_id=X — Delete Team Photo

**Auth:** Required (team leader / `manage school team` permission)

**Response:**
```json
{
  "success": true,
  "message": "Photo deleted.",
  "stats": { "total": 149, "pending": 49, "approved": 100 }
}
```

Reverses metrics, removes S3 files, soft-deletes.

---

### GET /api/teams/photos/map?team_id=X — Team Photo Map Points

**Auth:** Required (team member)

Returns max 5000 points with `id`, `lat`, `lng`, `tags`, `verified`, `is_public`, `date`.

---

### GET /api/teams/clusters/{team} — Team Clusters (GeoJSON)

**Auth:** Required (Sanctum)

**Query params:** `zoom`, `bbox`

---

### GET /api/teams/points/{team} — Team Points (GeoJSON)

**Auth:** Required (team member)

**Query params:** `bbox`, `layers`

---

### POST /api/teams/download — Download Team Data

**Auth:** Required (Sanctum)

**Request:** `{ "team_id": 1 }`
**Response:** `{ "success": true }`
**Error:** `{ "success": false, "message": "not-a-member" }`

Queues background export job.

---

## Community & Map Data

### GET /api/community/stats — Community Statistics

**Auth:** None (public)

**Response (200):**
```json
{
  "photosPerMonth": 3000,
  "litterTagsPerMonth": 10000,
  "usersPerMonth": 50,
  "statsByMonth": {
    "photosByMonth": [100, 200, 300],
    "usersByMonth": [10, 20, 30],
    "periods": ["Jan 2024", "Feb 2024", "Mar 2024"]
  }
}
```

---

### GET /api/mobile-app-version — Mobile App Version

**Auth:** None (public)

**Response (200):**
```json
{
  "ios": {
    "url": "https://apps.apple.com/us/app/openlittermap/id1475982147",
    "version": "6.1.0"
  },
  "android": {
    "url": "https://play.google.com/store/apps/details?id=com.geotech.openlittermap",
    "version": "6.1.0"
  }
}
```

---

### GET /api/history/paginated — Paginated Tagging History

**Auth:** Optional (changes filter behavior)

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `loadPage` | int | Page number (default: 1) |
| `filterCountry` | string | Country filter or `'all'` (default) |
| `filterDateFrom` | string | Start date filter |
| `filterDateTo` | string | End date filter |
| `filterTag` | string | Search in summary JSON |
| `filterCustomTag` | string | Search custom tags |
| `paginationAmount` | int | Results per page |

**Response (200):** `{ "success": true, "photos": { /* paginated */ } }`

If authenticated: shows user's own photos. If unauthenticated: shows `verified >= 2` and `is_public = true` photos only.

---

### GET /api/countries/names — Country Name List

**Auth:** None (public)

**Response (200):**
```json
{
  "success": true,
  "countries": [
    { "id": 1, "country": "United States", "shortcode": "US", "manual_verify": true }
  ]
}
```

Only returns countries with `manual_verify = true` (or shortcode `pr`).

---

### GET /api/global/points — Global Map Points (Legacy)

**Auth:** None (public)

GeoJSON endpoint for the global map. Filters: `is_public = true`. Supports `bbox`, `layers`, `fromDate`, `toDate`, `year`, `username` query params.

---

### GET /api/global/art-data — Litter Art Data (Deprecated)

**Auth:** None (public)

Returns GeoJSON of photos with `art_id != null`, `verified >= 2`, `is_public = true`.

---

### GET /api/global/search/custom-tags — Search Custom Tags

**Auth:** None (public)

**Query params:** `search` (required, string prefix)

**Response (200):**
```json
{ "success": true, "tags": ["plastic wrapper", "plastic bottle"] }
```

Returns top 20 matching custom tags ordered by frequency.

---

### GET /api/tags-search — Display Tags on Map

**Auth:** None (public)

**Query params:** `custom_tag`, `custom_tags` (comma-separated), `brand`

Returns GeoJSON FeatureCollection of matching photos (`is_public = true`, max 5000).

---

### POST /api/download — Download Location Data

**Auth:** Optional

**Request:**
```json
{ "locationType": "city", "locationId": 42, "email": "user@example.com" }
```

`email` is optional if authenticated (uses auth user's email). Queues CSV export job, emails download link.

**Response:** `{ "success": true }` or `{ "success": false }`

---

## Cleanups

### POST /api/cleanups/create — Create Cleanup Event

**Auth:** Required

**Request:**
```json
{
  "name": "Beach Cleanup",
  "date": "2025-03-15",
  "lat": 40.7128,
  "lon": -74.0060,
  "time": "10:00 AM",
  "description": "Annual beach cleanup event",
  "invite_link": "beach-cleanup-2025"
}
```

| Field | Rules |
|-------|-------|
| `name` | required, min 5 |
| `date` | required |
| `lat` | required |
| `lon` | required |
| `time` | required, min 3 |
| `description` | required, min 5 |
| `invite_link` | required, unique, min 1 |

**Response:** `{ "success": true, "cleanup": { ... } }`

Creator is automatically joined.

---

### GET /api/cleanups/get-cleanups — Get All Cleanups (GeoJSON)

**Auth:** None (public)

**Response:** `{ "success": true, "geojson": { /* GeoJSON FeatureCollection */ } }`

---

### POST /api/cleanups/{inviteLink}/join — Join Cleanup

**Auth:** Optional (returns error message if unauthenticated)

**Response:** `{ "success": true, "cleanup": { ... } }`
**Errors:** `{ "success": false, "msg": "unauthenticated" | "already joined" | "cleanup not found" }`

---

### POST /api/cleanups/{inviteLink}/leave — Leave Cleanup

**Auth:** Required

**Response:** `{ "success": true }`
**Errors:** `{ "success": false, "msg": "not found" | "cannot leave" | "already left" }`

Creator cannot leave their own cleanup.

---

### GET /api/city — Get City Map Data (Legacy)

**Auth:** None (public)

**Query params:** `city` (required, URL-decoded name), `min` / `max` (dates, format `d-m-Y`), `hex` (optional, default 100)

**Response (200):**
```json
{
  "center_map": [40.7128, -74.0060],
  "map_zoom": 13,
  "litterGeojson": { "type": "FeatureCollection", "features": [...] },
  "hex": 100
}
```

Filters: `is_public = true`, `verified > 0`.

---

### POST /api/littercoin/merchants — Become a Merchant

**Auth:** None specified in route

Registers interest as a Littercoin merchant.

---

### GET /api/locations/world-cup — World Cup Data

**Auth:** None (public)

Returns location data for the World Cup leaderboard.

---

### POST /api/settings/toggle — Toggle Items Remaining

**Auth:** Required (Sanctum)

Toggles the `items_remaining` boolean for the user.

**Response:** `{ "message": "success", "value": true }`

---

### POST /api/profile/photos/remaining/{id} — Toggle Photo Remaining Flag

**Auth:** Required (Sanctum)

Toggles the `remaining` field on a specific photo.

**Response:** `{ "success": true }`

---

### POST /api/user/profile/photos/tags/bulkTag — Bulk Tag Photos (Deprecated)

**Auth:** Required (Sanctum)
**Status:** 410 Gone

**Response:** `{ "message": "Use POST /api/v3/tags for tagging" }`

---

### POST /api/profile/upload-profile-photo — Upload Profile Photo (Stub)

**Auth:** Required (Sanctum)
**Status:** 501 Not Implemented

Not yet implemented.

---

## Admin Endpoints

Admin endpoints under `/api/admin/` require the `admin` middleware. These are internal and not documented for mobile use. Includes: photo queue, verification, tag management, merchant approval.

---

## Bounding Box Endpoints

Bbox endpoints under `/api/bbox/` require the `can_bbox` middleware. Used for bounding box annotation workflow. Includes: index, create, skip, update tags, verify.

---

## Legacy Mobile Endpoints (v2)

These remain for backward compatibility with older app versions:

### GET /api/v2/photos/get-untagged-uploads — Untagged Photos (Deprecated)

**Auth:** Required (Sanctum)

**Response:** `{ "count": 5, "photos": [{ "id": 1, "filename": "...", "remaining": 1, "platform": "web" }] }`

Returns first 100 untagged photos (`verification = 0`). `photos` is `null` if count is 0.

---

### GET /api/v2/photos/web/load-more — Load More Untagged (Deprecated)

**Auth:** Required (Sanctum)

**Query param:** `photo_id` (int, load photos after this ID)

Returns up to 10 photos with `id` and `filename` only.

---

### Other Legacy Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v2/photos/web/index` | Alias for get-untagged-uploads |
| `POST /api/v2/add-tags-to-uploaded-image` | Add v4 tags (same as `/api/add-tags`) |
| `POST /api/upload` | Upload photo (legacy alias for v3/upload) |

---

## Reference

### Verification Pipeline

| Value | Status | Meaning |
|-------|--------|---------|
| 0 | UNVERIFIED | Uploaded, no tags |
| 1 | VERIFIED | Tagged (school students land here, awaiting teacher approval) |
| 2 | ADMIN_APPROVED | Verified by admin/trusted user OR teacher-approved |
| 3 | BBOX_APPLIED | Bounding boxes drawn |
| 4 | BBOX_VERIFIED | Bounding boxes verified |
| 5 | AI_READY | Ready for OpenLitterAI training |

### Level System

| XP Threshold | Level | Title |
|-------------|-------|-------|
| 0 | 0 | Complete Noob |
| 100 | 1 | Still A Noob |
| 500 | 2 | Post-Noob |
| 1,000 | 3 | Litter Wizard |
| 5,000 | 4 | Trash Warrior |
| 10,000 | 5 | Early Guardian |
| 15,000 | 6 | Trashmonster |
| 50,000 | 7 | Force of Nature |
| 100,000 | 8 | Planet Protector |
| 200,000 | 9 | Galactic Garbagething |
| 500,000 | 10 | Interplanetary |
| 1,000,000 | 11 | SuperIntelligent LitterMaster |

### XP Scoring

| Action | XP per unit |
|--------|------------|
| Upload | 5 |
| Object tag | 1 (special overrides exist) |
| Brand | 3 |
| Material | 2 |
| Custom tag | 1 |

Brands use their own `quantity`. Materials and custom_tags use parent tag's `quantity`.

### Error Response Patterns

Controllers use two error field names inconsistently:
- `msg` — Used by: auth endpoints, team join, legacy photo endpoints
- `message` — Used by: team member/settings endpoints, team photos, newer endpoints

Both return `success: false` with the error string.

### Auth Architecture

- **SPA (web):** Session-based via `auth:web` + Sanctum cookie
- **Mobile:** Stateless Sanctum tokens via `Authorization: Bearer {token}`
- **Dual guard:** Most routes use `auth:sanctum` (supports both session and token)
- Token login revokes previous tokens (prevents buildup)
- Registration returns both session + token (immediate use from either client)
