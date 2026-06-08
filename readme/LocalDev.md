# LocalDev.md
> OpenLitterMap React Native — Local Development Notes

## Local Server

- Laravel: `http://0.0.0.0:8000` (serves on all interfaces)
- Web: `olm.test` via Laravel Valet
- Minio (S3-compatible storage): `http://127.0.0.1:9000`
- Mobile API URL: `http://192.168.1.28:8000` (LAN IP, set in `utils/config.js`)

### Minio Image URLs

Minio stores photo URLs in the `filename` column as `http://127.0.0.1:9000/olm-public/...`. The phone **cannot reach `127.0.0.1`** (that's the host's loopback, not the phone's). `ImageViewer.js` includes a dev-only rewrite that replaces `127.0.0.1` with the LAN host extracted from the API base URL.

**To fix permanently**: Set `AWS_URL=http://192.168.1.28:9000/olm-public` in your Laravel `.env` so new uploads store the reachable LAN IP. Existing DB records need:
```sql
UPDATE photos SET filename = REPLACE(filename, '127.0.0.1', '192.168.1.28');
```

### Environment

Set via `.env`: `CURRENT_ENVIRONMENT='local'` → uses `http://192.168.1.28:8000` in `utils/config.js`

## GET /api/tags/all — Response Shape

The catalogue the app caches (`tags_cache_v7`, 7-day TTL). Field-by-field documentation
lives in `BackendTagsConfig.md`; this section focuses on the **cloId** mechanics that the
local search index depends on.

**Top-level keys:**
```
{
    categories:            11 items
    objects:              113 items
    materials:             38 items
    brands:             2,615 items
    types:                 17 items
    category_objects:     117 items    ← THE PIVOT TABLE (cloId source)
    category_object_types: 41 items
}
```
`categories` are the backend tagging categories. ⚠️ **Unconfirmed:** whether the soft-drinks
key is `beverages` or `softdrinks`, and whether `unclassified` is included — our docs have
disagreed (see `BackendMobileApi.md` → Open questions). The client matches whatever keys the
API returns against `litter.json` (which uses `softdrinks`/`unclassified`).

### objects
```json
{ "id": 1, "key": "butts", "categories": [{ "id": 1, "key": "smoking" }] }
{ "id": 14, "key": "can", "categories": [
    { "id": 2, "key": "alcohol" }, { "id": 3, "key": "beverages" }, { "id": 4, "key": "food" }
]}
```
- Each object has an eager-loaded `categories` array, but **the cloId is NOT here** — there's no `pivot.id` on this relationship.
- 96 objects have categories; 17 have empty `categories: []` (legacy/duplicate items, e.g. `brokenglass` duplicates `broken_glass`). These should NOT appear in the tagging UI.
- Keys are all `snake_case` (`broken_glass`, `cigarette_box`, `coffee_pod`).

### category_objects — THE PIVOT TABLE (cloId)
```json
{ "id": 1,  "category_id": 1, "litter_object_id": 1 }
{ "id": 13, "category_id": 2, "litter_object_id": 13 }
{ "id": 25, "category_id": 3, "litter_object_id": 13 }
```
- `id` = the **cloId** (category_litter_object_id) — maps one (category, object) pair to a unique identifier. 117 entries.

### Multi-category objects (disambiguated by cloId)
```
can     (object 14): cloId 14 → can+alcohol,  cloId 26 → can+beverages,  cloId 40 → can+food
bottle  (object 13): cloId 13 → bottle+alcohol, cloId 25 → bottle+beverages
battery (object 76): cloId 83 → battery+electronics, cloId 84 → battery+vehicles
```

## cloId Resolution

The cloId is **NOT** on the object's category pivot — it's in the separate `category_objects` array. To build the search index:

```
For each entry in category_objects:
  cloId    = entry.id
  object   = objects[entry.litter_object_id]
  category = categories[entry.category_id]
  → { cloId, objectId, objectKey, categoryId, categoryKey }
```

Skip entries where the object/category lookup fails (no orphans found), and skip the 17 objects with empty categories.

## Mobile tag payload (PUT /api/v3/tags)

Tags are sent in **CLO format** built by `utils/buildTagsPayload.js`: `{ photo_id, tags }`, where each tag carries `category_litter_object_id` (the cloId — it encodes both category and object, so no separate `object`/`category` is sent) plus `quantity`, per-tag `picked_up`, `materials`, `brands`, `custom_tags`. The cloId is also used client-side only (search index, per-image storage, validation).

Full request JSON + the brand-only/custom-only variants: **[`BackendMobileApi.md` → Tagging](BackendMobileApi.md#tagging)**. Mobile tagging UI: `MobileTagging.md`. XP: `XP.md`.
