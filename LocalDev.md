# LocalDev.md
> OpenLitterMap React Native v7.0 — Local Development Notes

## Local Server

- URL: `https://olm.test` (Laravel Valet, HTTPS with self-signed cert)
- HTTP redirects to HTTPS (301)
- Set via `.env`: `CURRENT_ENVIRONMENT='local'` → `http://olm.test` in `actions/types.js`
  - Note: `actions/types.js` hardcodes `'http://olm.test'` but Valet forces HTTPS

## GET /api/tags/all — Response Shape

**Top-level keys:**
```
{
    categories:            11 items
    objects:              113 items
    materials:             38 items
    brands:             2,615 items
    types:                 17 items
    category_objects:     117 items    ← THIS IS THE PIVOT TABLE (cloId source)
    category_object_types: 41 items
}
```

### categories
```json
{ "id": 1, "key": "smoking" }
{ "id": 2, "key": "alcohol" }
{ "id": 3, "key": "beverages" }
{ "id": 4, "key": "food" }
...
```
11 total: smoking, alcohol, beverages, food, personal_care, medical, industrial, vehicles, marine, electronics, pets

### objects
```json
{ "id": 1, "key": "butts", "categories": [{ "id": 1, "key": "smoking" }] }
{ "id": 14, "key": "can", "categories": [
    { "id": 2, "key": "alcohol" },
    { "id": 3, "key": "beverages" },
    { "id": 4, "key": "food" }
]}
```
- Each object has a `categories` array (eager-loaded)
- **NO pivot.id on the category relationship** — cloId is NOT here
- 96 objects have categories, 17 have empty `categories: []`
- Key format: all `snake_case` (e.g., `broken_glass`, `cigarette_box`, `car_part`, `coffee_pod`)

### category_objects — THE PIVOT TABLE (cloId)
```json
{ "id": 1, "category_id": 1, "litter_object_id": 1 }
{ "id": 13, "category_id": 2, "litter_object_id": 13 }
{ "id": 25, "category_id": 3, "litter_object_id": 13 }
```
- `id` = the **cloId** (category_litter_object_id)
- Maps one (category, object) pair to a unique identifier
- 117 entries total

### Multi-category objects (disambiguated by cloId)
```
can (object_id=14):
  cloId=14  → can + alcohol
  cloId=26  → can + beverages
  cloId=40  → can + food

bottle (object_id=13):
  cloId=13  → bottle + alcohol
  cloId=25  → bottle + beverages

battery (object_id=76):
  cloId=83  → battery + electronics
  cloId=84  → battery + vehicles

broken_glass (object_id=18):
  cloId=18  → broken_glass + alcohol
  cloId=27  → broken_glass + beverages

cup (object_id=22):
  cloId=22  → cup + alcohol
  cloId=28  → cup + beverages
```

### Objects with empty categories (17)
These have no `category_objects` entries either:
```
beer_bottle, beer_can, bottletops, brokenglass, chemical,
crisp_large, crisp_small, filters, glass_jar, oil, paper,
plastic_packaging, polystyrene, receipt, sweet_wrapper,
tobacco, wine_bottle
```
These appear to be legacy/duplicate objects (e.g., `brokenglass` duplicates `broken_glass`, `beer_can` duplicates `can + alcohol`). They should NOT appear in the mobile tagging UI.

### materials
```json
{ "id": 1, "key": "aluminium" }
{ "id": 2, "key": "bronze" }
```
38 total. Not used in v1 tagging.

### brands
```json
{ "id": 118, "key": "100smoothie" }
```
2,615 total. Not used in v1 tagging.

### types
```json
{ "id": 1, "key": "beer", "name": "Beer" }
{ "id": 10, "key": "coffee", "name": "Coffee" }
```
17 total. Types have a `name` field (others only have `key`). Not used in v1 tagging.

### category_object_types
```json
{ "category_litter_object_id": 13, "litter_object_type_id": 1 }
```
Links category_objects to types. Not used in v1 tagging.

## cloId Resolution

The cloId is **NOT** on the object's category pivot — it's in the separate `category_objects` array. To build the search index:

```
For each entry in category_objects:
  cloId = entry.id
  object = objects[entry.litter_object_id]
  category = categories[entry.category_id]
  → { cloId, objectId, objectKey, categoryId, categoryKey }
```

Skip any `category_objects` entry where the object or category lookup fails (shouldn't happen — no orphans found).

Also skip objects with empty categories (17 legacy items) — they have no `category_objects` entries.

## Web App Tagging Schema (from readme/Tags.md)

### How the web frontend sends tags (POST /api/v3/tags)

The web Vue frontend sends this format per tag:
```json
{
    "object": { "id": 5, "key": "butts" },
    "quantity": 3,
    "picked_up": true,
    "materials": [{ "id": 2, "key": "plastic" }],
    "brands": [{ "id": 1, "key": "marlboro" }],
    "custom_tags": ["dirty-bench"]
}
```

**Key detail: The web does NOT send `clo_id` or `category` in the payload.**
The backend `resolveTag()` auto-resolves the category from `object->categories()->first()`.

### How the web uses cloId

The web pre-resolves cloId on the *frontend* for validation only:
- `searchableTags` computed builds one entry per (object, category) pair
- Each entry has a `cloId` looked up via `getCloId(categoryId, objectId)`
- `hasUnresolvedTags` computed blocks submit if any tag lacks a resolved `cloId`
- But the cloId is **not sent in the POST payload**

### Web search index structure
```
Each entry has:
- id: composite "obj-{objectId}-cat-{categoryId}"
- cloId: pre-resolved from store's getCloId()
- categoryId, categoryKey
- lowerKey: precomputed key.toLowerCase() for fast search
```

### formatKey (web implementation)
```js
key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
```
All keys are snake_case → "Title Case" (e.g., `broken_glass` → "Broken Glass").

### XP calculation (v1 mobile — objects only, no materials/brands)
```
XP = 5 (upload base)
   + sum of quantities (1 XP per item)
   + 5 if picked_up
```
Full XP table: upload=5, object=1/item, material=2/item, brand=3/item, custom=1/item, picked_up=+5.

### Tag types (4 total, only #1 for mobile v1)
1. **Object tag** — `{ object: {id, key}, quantity, picked_up, materials, brands, custom_tags }`
2. Custom-only tag — `{ custom: true, key: "dirty-bench", quantity, picked_up }`
3. Brand-only tag — `{ brand_only: true, brand: {id, key}, quantity, picked_up }`
4. Material-only tag — `{ material_only: true, material: {id, key}, quantity, picked_up }`

## RESOLVED: Mobile payload format

**Decision**: Mobile sends `category` explicitly (unlike web which omits it).
This ensures correct disambiguation for multi-category objects like bottle, can, etc.
The web relies on `object->categories()->first()` which is wrong for multi-category objects.

Mobile POST /api/v3/tags payload:
```json
{
    "photo_id": 123,
    "tags": [
        {
            "object": { "id": 5, "key": "butts" },
            "category": { "id": 1, "key": "smoking" },
            "quantity": 3,
            "picked_up": true,
            "materials": [],
            "brands": [],
            "custom_tags": []
        }
    ],
    "picked_up": 1
}
```

The `cloId` is used client-side only (for search index, per-image storage, and
validation). It is NOT sent in the POST payload.
