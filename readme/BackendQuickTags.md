# Backend: Quick Tags Sync

Server-side storage for user quick tag presets, synced between mobile devices and the web.

## Overview

Users can save up to 30 "quick tag" presets — pre-configured litter objects with quantity, picked_up, materials, and brands. The mobile app stores these locally via redux-persist; the backend provides durable cross-device sync via a bulk-replace API.

## Database

**Table:** `user_quick_tags`

| Column | Type | Notes |
|--------|------|-------|
| id | bigint unsigned | PK |
| user_id | int unsigned | FK -> users.id (cascade delete) |
| clo_id | bigint unsigned | FK -> category_litter_object.id (cascade delete) |
| type_id | int unsigned, nullable | References litter_object_types.id (no FK constraint) |
| custom_name | varchar(60), nullable | User-defined display name; null = use catalog name |
| quantity | tinyint unsigned | Default 1, validated 1-10 |
| picked_up | boolean, nullable | null = inherit user default, true/false = explicit |
| materials | json | Array of material IDs, e.g. `[1, 3]` |
| brands | json | Array of `{"id": int, "quantity": int}` objects |
| sort_order | smallint unsigned | 0-indexed display order |
| timestamps | | created_at, updated_at |

## Key Backend Files

- `app/Models/Users/UserQuickTag.php` — Eloquent model
- `app/Actions/QuickTags/SyncQuickTagsAction.php` — Transactional bulk-replace
- `app/Http/Controllers/API/QuickTagsController.php` — GET + PUT endpoints
- `app/Http/Requests/Api/SyncQuickTagsRequest.php` — Validation rules
- `app/Models/Users/User.php` — `quickTags()` HasMany relation
- `tests/Feature/QuickTags/QuickTagsApiTest.php` — 31 tests

## API Endpoints

Both routes in `v3` group with `auth:sanctum` middleware.

### `GET /api/v3/user/quick-tags`

Returns authenticated user's quick tags ordered by `sort_order`.

**Response 200:**
```json
{
    "success": true,
    "tags": [
        {
            "id": 1,
            "clo_id": 42,
            "type_id": null,
            "custom_name": "Coke bottle",
            "quantity": 2,
            "picked_up": true,
            "materials": [1, 3],
            "brands": [{"id": 5, "quantity": 1}],
            "sort_order": 0
        }
    ]
}
```

Hidden fields: `user_id`, `created_at`, `updated_at`.

### `PUT /api/v3/user/quick-tags`

Bulk-replaces all quick tags. Deletes existing rows and inserts new ones in a DB transaction.

**Request:**
```json
{
    "tags": [
        {
            "clo_id": 42,
            "type_id": null,
            "custom_name": "Coke bottle",
            "quantity": 2,
            "picked_up": true,
            "materials": [1, 3],
            "brands": [{"id": 5, "quantity": 1}]
        }
    ]
}
```

**Response 200:** Same format as GET (returns newly saved tags with server-assigned IDs).

**Response 422:** Rejects entire payload if any `clo_id` is stale.

**Clearing all tags:** Send `"tags": []` — deletes all rows, returns empty array.

## Validation Rules

| Field | Rule |
|-------|------|
| tags | present, array, max 30 |
| tags.*.clo_id | required, integer, exists in category_litter_object |
| tags.*.type_id | nullable, integer, exists in litter_object_types |
| tags.*.custom_name | nullable, string, max 60 |
| tags.*.quantity | required, integer, 1-10 (trusted: 1-100) |
| tags.*.picked_up | nullable, boolean |
| tags.*.materials | present, array (can be empty) |
| tags.*.materials.* | integer, exists in materials |
| tags.*.brands | present, array (can be empty) |
| tags.*.brands.*.id | required, integer, exists in brandslist |
| tags.*.brands.*.quantity | required, integer, 1-10 (trusted: 1-100) |

## Mobile Sync Implementation

### Fetch on login
`fetchQuickTags` thunk dispatched non-blocking after `fetchUser` succeeds in:
- `checkValidToken` (app launch with stored token)
- `userLogin` (fresh login, both enriched and legacy paths)
- `createAccount` (new registration)

### Push on change
`useQuickTagsSync` hook in `TabRoutes.tsx` watches `state.quickTags.presets`. On change, debounces 3s then dispatches `syncQuickTags` (PUT). Only syncs when:
- User is authenticated (`token` exists)
- Initial fetch has completed (`fetchStatus === 'succeeded'`)
- Not on initial render (skips redux-persist rehydration)

### Default seeding race condition fix
`useQuickTagsInit` waits for BOTH:
1. Tag catalog fetch to succeed (`state.tags.fetchStatus === 'succeeded'`)
2. Backend quick tags fetch to complete (`state.quickTags.fetchStatus !== 'loading'`)

Only seeds defaults if both are done and presets are still empty.

### Conflict resolution
Backend is source of truth. On `fetchQuickTags.fulfilled`:
- If backend has tags: replace local state
- If backend is empty and local has data: keep local (first sync scenario — local defaults persist until first push)

### Field mapping
Backend uses `snake_case`, mobile uses `camelCase`:
- `clo_id` <-> `cloId`
- `type_id` <-> `typeId`
- `custom_name` <-> `customName`
- `picked_up` <-> `picked_up` (same — already snake_case in mobile)
- `sort_order` — derived from array position, not stored locally

Local `id` field is ephemeral. After sync, server-assigned IDs replace local IDs.

## Architecture Notes

- Duplicate CLOs allowed (same object with different metadata presets)
- `picked_up: null` stored faithfully — not coerced to false
- Bulk-replace pattern: every PUT deletes + re-inserts in transaction
- `UserQuickTag::insert()` bypasses model casts — JSON fields manually encoded
