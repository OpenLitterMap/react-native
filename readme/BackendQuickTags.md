# Backend Quick Tags — Mobile Contract

Server-side storage for a user's quick-tag presets, synced across devices. The
mobile app stores presets locally via redux-persist and syncs them with a
bulk-replace API. This is a mobile-developer summary, not the backend source of
truth.

> Mobile Quick Tags UX lives in **QuickTagsSettingsScreen** + the AddTagScreen
> chip bar; state in **`reducers/quick_tags_reducer.js`**.

---

## Endpoints

Both routes are auth-protected (`auth:sanctum`). Mobile uses them in
`reducers/quick_tags_reducer.js` (`fetchQuickTags` GET, `syncQuickTags` PUT).

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/v3/user/quick-tags` | Fetch the user's presets, ordered |
| `PUT` | `/api/v3/user/quick-tags` | **Bulk replace** all presets |

### `GET` response 200

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
            "brands": [{ "id": 5, "quantity": 1 }],
            "sort_order": 0
        }
    ]
}
```

### `PUT` request

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
            "brands": [{ "id": 5, "quantity": 1 }]
        }
    ]
}
```

- **Bulk replace:** the server deletes all existing rows and inserts the payload
  in a transaction. There is no partial update.
- **Response 200:** same shape as GET, with newly server-assigned `id`s.
- **Clearing all:** send `"tags": []` → returns an empty array.
- **Response 422:** the **entire** payload is rejected if any `clo_id` is stale.
- `sort_order` is assigned server-side from array position — the client controls
  ordering purely by the order of the array it sends.

---

## Validation rules the client must respect

| Field | Rule |
|---|---|
| `tags` | array, max **30** entries |
| `clo_id` | required integer, must exist in the catalogue |
| `type_id` | nullable integer |
| `custom_name` | nullable string, **max 60 chars** (null = use catalogue name) |
| `quantity` | integer **1–10** (trusted users: 1–100) |
| `picked_up` | nullable boolean (`null` = inherit user default; sent faithfully, not coerced) |
| `materials` | array of material IDs (may be empty) |
| `brands` | array of `{ id, quantity }` (quantity 1–10; trusted: 1–100) |

Duplicate `clo_id`s are allowed (same object with different metadata presets).

---

## Mobile sync behaviour

- **Fetch on login:** `fetchQuickTags` runs non-blocking after `fetchUser`
  succeeds (`checkValidToken`, `userLogin`, `createAccount`).
- **Push on change:** `useQuickTagsSync` (in `TabRoutes.tsx`) watches
  `state.quickTags.presets`, debounces 3s, then PUTs. Only when authenticated,
  initial fetch has completed, and not on the redux-persist rehydration render.
- **Default seeding:** `useQuickTagsInit` seeds the built-in defaults only once
  both the tag catalogue fetch and the quick-tags fetch have settled and presets
  are still empty.
- **Conflict resolution:** backend is source of truth. On fetch, if the backend
  has tags, replace local; if the backend is empty but local has data, keep
  local (first-sync — local defaults persist until the first push).
- **Field mapping** (backend snake_case ↔ mobile camelCase): `clo_id`↔`cloId`,
  `type_id`↔`typeId`, `custom_name`↔`customName`; `picked_up` is the same.
  `sort_order` is derived from array position and not stored locally. The local
  `id` is ephemeral — server IDs replace it after a sync.

---

## Related Docs

- **MobileTagging.md** — the AddTagScreen tagging UI and chip bar
