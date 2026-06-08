# Backend Tagging — Mobile Contract

The tag API contract the mobile app consumes when tagging photos. This is a
mobile-developer summary, **not** the backend source of truth — canonical logic
lives in the backend repo (`PhotoTagsController`, `AddTagsToPhotoAction`,
`ClassifyTagsService`).

> Mobile tagging UI: see **MobileTagging.md**.
> XP formula is documented in **XP.md** (mobile shows an incomplete preview).

---

## Core concept — `cloId`

`cloId` = `category_litter_object_id`. It uniquely identifies an **(object,
category) pair**. The same object key (e.g. `bottle`) exists in several
categories (alcohol, softdrinks, food), so the object alone is ambiguous — the
cloId disambiguates it. The mobile app resolves cloIds from the tag catalogue
(`GET /api/tags/all`, see **BackendTagsConfig.md**) and sends them on every tag.

An optional `litter_object_type_id` (`typeId`) further refines an object with
"what was in it" (e.g. a `bottle` of type `beer`).

---

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v3/upload` | Upload photo binary + GPS → returns `photo_id` |
| `POST` | `/api/v3/tags` | Add tags to a freshly uploaded photo |
| `PUT`  | `/api/v3/tags` | Replace **all** tags on a photo (idempotent) |

The mobile flow is two-step: upload the binary, then write tags. `PUT` replaces
the full tag set, so retries are safe. Mobile uses `PUT` for both the auto-upload
path (`upload_flow_reducer.js`) and the edit-existing-photo path
(`server_photos_reducer.js`).

---

## Request body — `{ photo_id, tags }`

The client builds the `tags` array in `utils/buildTagsPayload.js`. There are three entry types:

- **Object tag** (common case) — carries `category_litter_object_id` (cloId), optional `litter_object_type_id`, `quantity`, `picked_up`, `materials` (IDs), `brands` (`[{ id, quantity }]`), `custom_tags`. The backend resolves the category from the cloId, so no separate category field is sent; `picked_up: null` inherits the user default.
- **Brand-only** — `{ brand_only: true, brand: {id, key}, quantity, picked_up }`, when a brand is logged without an object.
- **Custom-only** — `{ custom: true, key, quantity, picked_up }`, one per custom string, consumed by `ClassifyTagsService`. When an image has both CLO tags and image-level custom tags, the custom tags merge into the first object tag's `custom_tags` instead.

**Custom-tag validation (client must respect):** 3–100 chars, `/^[\w\s:-]+$/`.

Exact request JSON for each shape: **[`BackendMobileApi.md` → Tagging](BackendMobileApi.md#tagging)**.

---

## Response — `new_tags` + `summary`

After tags are written (and when reading a photo back via
`GET /api/v3/user/photos`), each photo carries:

- **`summary`** — a JSON object the backend caches as the canonical tag
  structure (counts by category/object/material/brand plus a `keys` map of
  id → display key). The mobile app does not parse `summary` directly for the
  tagging UI; it reads `new_tags`.
- **`new_tags`** — an array the mobile tagging UI converts back into local tag
  state (`utils/getTagsFromBackend.js`).

`result_string` is **deprecated and not returned** — use `summary`.

### `new_tags` entry shape (what the mobile app reads)

```json
{
    "category": { "id": 2, "key": "smoking" },
    "object": { "id": 15, "key": "butts" },
    "type": null,
    "category_litter_object_id": 42,
    "litter_object_type_id": null,
    "quantity": 5,
    "picked_up": true,
    "extra_tags": [
        { "type": "material", "tag": { "id": 3, "key": "plastic" }, "quantity": 5 },
        { "type": "brand", "tag": { "id": 12, "key": "marlboro" }, "quantity": 3 },
        { "type": "custom_tag", "tag": { "id": 7, "key": "dirty-bench" } }
    ]
}
```

- `extra_tags[].type` is one of `material`, `brand`, `custom_tag`.
- A `type` object (e.g. `{ "key": "beer" }`) prefixes the object display name
  ("Beer Bottle").
- Brand-only entries arrive with `brand_only: true` and a `brand` object and no
  category/object — mobile renders them as a standalone brand pill.
- Entries with no category/object **and** no `category_litter_object_id` are
  treated as custom-tag-only: their `extra_tags` custom tags are promoted to
  image-level custom tags.

Display names are resolved at render time from the cached catalogue keyed by
cloId — the API keys above are fallbacks.

---

## Upload response fields

`POST /api/v3/upload` returns `success` + `photo_id`; the app stores `photo_id`
as the photo's `serverPhotoId` (`upload_flow_reducer.js`) and reads the optional
idempotency flags `already_uploaded` / `tagged`. Whether it also returns
`xp_awarded` / `user_xp_total` is **unconfirmed and unused by the app** — see
**BackendMobileApi.md → Open questions**.

---

## Ownership & security

Both `POST` and `PUT` enforce ownership server-side — a user can only tag their
own photos (403 otherwise). The mobile app never sends another user's photo id.

---

## Related Docs

- **MobileTagging.md** — mobile tagging UI, search index, tag pills
- **BackendTagsConfig.md** — tag catalogue structure (`GET /api/tags/all`)
- **XP.md** — XP formula
- **MobileUpload.md** — the two-step upload flow and retry behaviour
