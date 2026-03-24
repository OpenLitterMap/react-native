# OpenLitterMap v5 Tagging System

## Overview

OpenLitterMap v5 introduces a flexible, hierarchical tagging system that allows precise classification of litter items. Each photo can have multiple tags organized by categories, objects, and their properties (materials, brands, and custom attributes).

## Core Concepts

### Tag Hierarchy

```
Photo
├── PhotoTag (Primary tagged item)
│   ├── Category (e.g., "smoking", "food", "softdrinks")
│   ├── LitterObject (e.g., "butts", "wrapper", "bottle")
│   ├── Quantity (How many of this item)
│   └── PhotoTagExtraTags (Additional properties)
│       ├── Materials (e.g., "plastic", "glass", "aluminium")
│       ├── Brands (e.g., "coca-cola", "marlboro", "mcdonalds")
│       └── CustomTags (User-defined tags)
```

### Database Structure

```
photos
├── id
├── user_id
├── summary (JSON) - Cached tag structure
├── xp (INT) - Calculated experience points
├── total_tags (INT) - Total item count
├── total_brands (INT) - Total brand count
├── processed_at (TIMESTAMP) - When metrics were processed
├── processed_fp (VARCHAR) - Fingerprint for idempotency
├── processed_tags (TEXT) - Cached tags for metrics
├── processed_xp (INT UNSIGNED) - XP value at last metrics processing
└── migrated_at (TIMESTAMP) - v5 migration timestamp

photo_tags
├── id
├── photo_id
├── category_id
├── litter_object_id
├── custom_tag_primary_id (for custom-only tags)
├── quantity
└── picked_up (BOOLEAN)

photo_tag_extra_tags
├── photo_tag_id
├── tag_type (material|brand|custom_tag)
├── tag_type_id
├── quantity
└── index
```

## Photo Summary Structure

Each photo maintains a `summary` JSON field with this structure:

```json
{
    "tags": {
        "2": {
            "15": {
                "quantity": 5,
                "materials": {
                    "3": 5,
                    "7": 5
                },
                "brands": {
                    "12": 3,
                    "18": 2
                },
                "custom_tags": {}
            }
        }
    },
    "totals": {
        "total_tags": 10,
        "total_objects": 5,
        "by_category": {
            "2": 5
        },
        "materials": 10,
        "brands": 5,
        "custom_tags": 0
    },
    "keys": {
        "categories": {"2": "smoking"},
        "objects": {"15": "butts"},
        "materials": {"3": "plastic", "7": "paper"},
        "brands": {"12": "marlboro", "18": "camel"},
        "custom_tags": {}
    }
}
```

**Key meanings:**
- `"2"` = Category ID (smoking)
- `"15"` = Object ID (butts)
- `"3"` = Material ID (plastic) with quantity 5
- `"7"` = Material ID (paper) with quantity 5
- `"12"` = Brand ID (marlboro) with quantity 3
- `"18"` = Brand ID (camel) with quantity 2

## XP (Experience Points) System

XP rewards users for tagging litter:

| Action           | XP Value    |
|------------------|-------------|
| Upload           | 5           |
| Standard Object  | 1 per item  |
| Material         | 2 per item  |
| Brand            | 3 per item  |
| Custom Tag       | 1 per item  |
| Picked Up        | +5 bonus    |
| Special Objects: |             |
| - Small item     | 10 per item |
| - Medium item    | 25 per item |
| - Large item     | 50 per item |
| - Bags of Litter | 10 per item |

### XP Calculation Details

`AddTagsToPhotoAction::calculateXp()` uses `XpScore` enum multipliers:

- **Upload base:** always 5 XP per photo
- **Object:** `quantity × objectXp` (default 1; special objects override: small=10, medium=25, large=50, bagsLitter=10)
- **Brand extra tags:** `brand.quantity × 3` (brands have their own independent quantity)
- **Material extra tags:** `parentTag.quantity × 2` (materials use parent tag's quantity — set membership)
- **Custom tag extra tags:** `parentTag.quantity × 1` (same as materials — set membership)

### XP Calculation Example

```
Photo with:
- 3 cigarette butts (qty=3)
- 2 materials (plastic, paper)
- 1 brand (marlboro, brandQty=2)
- 1 custom tag

XP = 5 (upload base)
   + 3 × 1 (3 objects at 1 XP each)
   + 2 × (3 × 2) (2 materials × parentQty × materialXP)
   + 2 × 3 (brand: brandQty × brandXP)
   + 3 × 1 (custom tag: parentQty × customXP)
   = 5 + 3 + 12 + 6 + 3 = 29 XP
```

## Brand-Object Relationships

### NOTE: Brands are deferred — doing them later.

### Discovery Process
```bash
# Step 1: Discover 1-to-1 relationships
php artisan olm:define-brand-relationships

# Step 2: Create relationships for remaining brands (≥10% threshold)
php artisan olm:auto-create-brand-relationships --apply
```

### How Brands Attach During Migration
1. **Pivot lookup**: Check taggables table for existing relationships
2. **Quantity matching**: Match brands to objects with same quantity
3. **Fallback**: Unmatched brands create brands-only PhotoTag

### Database Structure
```
taggables
├── category_litter_object_id  // Links to pivot table
├── taggable_type              // 'App\Models\Litter\Tags\BrandList'
├── taggable_id                // Brand ID from brandslist
└── quantity                   // Occurrence count
```

```
brandslist table:
├── id              // Primary key
├── key             // Brand key/slug (e.g., "coca-cola", "marlboro")  
├── crowdsourced    // Boolean
└── is_custom       // Boolean
```

## Tag Migration from v4 to v5

### Old Format (v4)
```php
[
    'smoking' => [
        'butts' => 5,
        'cigaretteBox' => 1
    ],
    'brands' => [
        'marlboro' => 3,
        'camel' => 2
    ]
]
```

### New Format (v5)
```php
PhotoTag::create([
    'photo_id' => $photo->id,
    'category_id' => 2,  // smoking
    'litter_object_id' => 15,  // butts
    'quantity' => 5,
    'picked_up' => true
]);

// Attach brands as extra tags
$photoTag->attachExtraTags([
    ['id' => 12, 'quantity' => 3],  // marlboro
    ['id' => 18, 'quantity' => 2],  // camel
], 'brand', 0);
```

## Special Cases

### 1. Brands-Only Photos
When a photo only has brands without specific objects:

```php
PhotoTag::create([
    'photo_id' => $photo->id,
    'category_id' => $brandsCategoryId,
    'quantity' => $totalBrandQuantity,
    'picked_up' => !$photo->remaining
]);
```

### 2. Custom Tags Only
For photos with only custom tags:

```php
PhotoTag::create([
    'photo_id' => $photo->id,
    'custom_tag_primary_id' => $customTag->id,
    'quantity' => $quantity,
    'picked_up' => !$photo->remaining
]);
```

### 3. Deprecated Tag Mapping
Old tags are automatically mapped to new equivalents:

| Old Tag                | New Object     | Materials Added |
|------------------------|----------------|-----------------|
| `beerBottle`           | `beer_bottle`  | `[glass]`       |
| `beerCan`              | `beer_can`     | `[aluminium]`   |
| `coffeeCups`           | `cup`          | `[paper]`       |
| `plasticFoodPackaging` | `packaging`    | `[plastic]`     |
| `waterBottle`          | `water_bottle` | `[plastic]`     |

**Note**: Materials are automatically added based on the deprecated tag mappings. For example, `beerBottle` automatically adds `glass` material to the object.

Full mapping in `ClassifyTagsService::normalizeDeprecatedTag()`.

### 4. Unknown Tags
Unknown tags are automatically created as new objects:

```php
$created = LitterObject::firstOrCreate(
    ['key' => 'mystery_item'],
    ['crowdsourced' => true]
);
```

### 5. Multiple Brands per Object
A single object can have multiple brands attached:
- Example: `butts` object with both `marlboro` and `camel` brands
- Stored in `photo_tag_extra_tags` with `tag_type='brand'`

### 6. Multiple Objects per Brand
Brands can validly attach to multiple objects:
- Example: `mcdonalds` → `cup`, `packaging`, `lid`, `wrapper`
- Relationships defined in `taggables` table

## Validation Rules

- Quantities must be positive integers
- Category-Object relationships must be valid
- Materials/Brands must be attached to objects
- Custom tags can be standalone or attached
- XP calculation uses enum-defined values
- Fingerprinting prevents duplicate processing

## API Response Format

```json
{
  "photo_id": 12345,
  "tags": {
    "smoking": {
      "butts": {
        "quantity": 5,
        "materials": ["plastic", "paper"],
        "brands": ["marlboro", "camel"]
      }
    }
  },
  "metrics": {
    "total_items": 5,
    "total_brands": 2,
    "xp_earned": 30
  },
  "location": {
    "country": "Ireland",
    "state": "Munster",
    "city": "Cork"
  }
}
```

## Web Frontend Replace/Edit Tags (PUT /api/v3/tags)

The `/tag?photo=<id>` URL loads a specific photo for editing. If the photo already has tags, AddTags.vue enters **edit mode** and uses `PUT /api/v3/tags` to replace all existing tags.

### Flow

1. **Load photo:** `GET_SINGLE_PHOTO(id)` calls `/api/v3/user/photos?id=X&id_operator==&per_page=1` — filters by authenticated user (ownership enforced server-side)
2. **Convert existing tags:** `convertExistingTags(photo)` transforms `new_tags` API format back into the frontend's tag format (handles object, brand-only, material-only, custom-only)
3. **User edits tags** — same UI as normal tagging (search, add, remove, quantity, materials/brands)
4. **Submit:** `REPLACE_TAGS({ photoId, tags })` calls `PUT /api/v3/tags`

### Backend (`PhotoTagsController::update()`)

```php
// 1. Delete old tags + extras
$photo->photoTags()->each(function ($tag) {
    $tag->extraTags()->delete();
    $tag->delete();
});

// 2. Reset summary, XP, verification
$photo->update(['summary' => null, 'xp' => 0, 'verified' => 0]);

// 3. Re-add tags (generates new summary, XP, fires TagsVerifiedByAdmin)
$this->addTagsToPhotoAction->run(Auth::id(), $photo->id, $tags);
```

**MetricsService delta handling:** When `TagsVerifiedByAdmin` fires, `ProcessPhotoMetrics` → `MetricsService::processPhoto()` detects the photo was previously processed (has `processed_at`). It calls `doUpdate()` which calculates deltas between old `processed_tags` and the new summary, then applies positive/negative adjustments to all MySQL + Redis metrics.

### Security

- `ReplacePhotoTagsRequest` checks `$photo->user_id === $this->user()->id` — returns 403 for non-owners
- `GET_SINGLE_PHOTO` calls `/api/v3/user/photos` which filters by `Auth::user()->id` — cannot load another user's photo
- Both `PhotoTagsRequest` (POST) and `ReplacePhotoTagsRequest` (PUT) enforce ownership

### Frontend files

| File | Change for edit mode |
|---|---|
| `AddTags.vue` | Reads `route.query.photo`, loads specific photo, `isEditMode` ref, `convertExistingTags()`, uses `REPLACE_TAGS` on submit |
| `TaggingHeader.vue` | `isEditMode` prop — hides Skip/Pagination, shows "Editing" badge, "Update" button |
| `Uploads.vue` | Navigates to `/tag?photo=<id>` on photo click and "Tag this photo" link |
| `stores/photos/requests.js` | `GET_SINGLE_PHOTO()`, `REPLACE_TAGS()` actions |

### Test file

`tests/Feature/Tags/ReplacePhotoTagsTest.php` — 5 tests (replace tags, already-tagged photos, ownership, auth, extra tags cleanup)

---

## Web Frontend Tagging (POST /api/v3/tags)

The Vue frontend (`/tag` route → `AddTags.vue`) sends tags via `POST /api/v3/tags` to `PhotoTagsController` → `AddTagsToPhotoAction` (v5). The frontend sends 4 distinct tag types:

### 1. Object tag (with optional materials/brands/custom tags)
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
**Backend:** `resolveTag()` looks up object, auto-resolves category from `object->categories()->first()`. Category need NOT be sent.

### 2. Custom-only tag
```json
{ "custom": true, "key": "dirty-bench", "quantity": 1, "picked_up": null }
```
**Backend:** `$tag['custom']` is boolean true (flag), `$tag['key']` is the actual tag name. Creates `CustomTagNew` record via `$tag['key']`.

### 3. Brand-only tag
```json
{ "brand_only": true, "brand": { "id": 1, "key": "coca-cola" }, "quantity": 1, "picked_up": null }
```
**Backend:** Creates PhotoTag with `category_id=null`, `litter_object_id=null`, attaches brand as extra tag.

### 4. Material-only tag
```json
{ "material_only": true, "material": { "id": 2, "key": "plastic" }, "quantity": 1, "picked_up": null }
```
**Backend:** Same pattern as brand-only — PhotoTag with null FKs, material as extra tag.

### Frontend files

| File | Purpose |
|---|---|
| `resources/js/views/General/Tagging/v2/AddTags.vue` | Main tagging page — search index, tag selection, submit |
| `resources/js/views/General/Tagging/v2/components/UnifiedTagSearch.vue` | Debounced tag search combobox with grouped results |
| `resources/js/views/General/Tagging/v2/components/TagCard.vue` | Tag card with type pills, category display, formatKey |
| `resources/js/views/General/Tagging/v2/components/ActiveTagsList.vue` | Container for active tags |
| `resources/js/views/General/Tagging/v2/components/TaggingHeader.vue` | Header: XP bar, level title, pagination, unresolved warning |
| `resources/js/views/General/Tagging/v2/components/PhotoViewer.vue` | Photo display with zoom |
| `resources/js/stores/photos/requests.js` | `UPLOAD_TAGS()` → POST, `REPLACE_TAGS()` → PUT, `GET_SINGLE_PHOTO()` |
| `resources/js/stores/tags/requests.js` | `GET_ALL_TAGS()` → GET /api/tags/all |

### Tag data loading
`GET /api/tags/all` returns flat arrays: `{ categories, objects, materials, brands, types, category_objects, category_object_types }`. Objects include their categories via eager load: `LitterObject::with(['categories:id,key'])`. `category_object_types` only returns `category_litter_object_id` and `litter_object_type_id` (no `id` column).

### Frontend search index (category disambiguation)

`AddTags.vue` builds a `searchableTags` computed that generates **one entry per (object, category) pair** instead of one per object. This prevents data corruption when the same object exists in multiple categories (e.g., "bottle" exists in alcohol, beverages, and food).

Each entry has:
- `id`: composite `obj-{objectId}-cat-{categoryId}` for deduplication
- `cloId`: pre-resolved `category_litter_object_id` from the store's `getCloId(categoryId, objectId)`
- `categoryId`, `categoryKey`: the specific category for this entry
- `lowerKey`: precomputed `key.toLowerCase()` for fast search filtering

**Type entries** are also generated from `categoryObjectTypes` with composite id `type-{cloId}-{typeId}`. Type search results show the parent object and category as context.

### Display formatting

`formatKey(key)` converts `snake_case` keys to `Title Case`: `key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())`. Used in search results, tag cards, detail badges, and recent tags.

Tag cards show `"Bottle · Alcohol"` format (object + category). Type pills replace the old `<select>` dropdown — clicking an active pill deselects it.

### Validation

`hasUnresolvedTags` computed blocks submit when any object tag lacks a pre-resolved `cloId`. Unresolved tags show a red border and the TaggingHeader shows a warning indicator. Submit button is disabled.

### Keyboard shortcuts

Ctrl+Enter always works (even in inputs) but checks `hasUnresolvedTags`. All other shortcuts (number keys 1-5, arrow keys) early-return if the focused element is INPUT, SELECT, or TEXTAREA.

### Search UX

`UnifiedTagSearch.vue` uses 100ms debounce on the search query. Results are grouped by type: `['object', 'type', 'material', 'brand', 'customTag']`. Category breadcrumbs are shown for object results, parent object names for type results.

### Level titles

`TaggingHeader.vue` displays user level titles from a hardcoded map matching `config/levels.php` (50 entries: "Beginner" through "Founder").

---

## Related Docs

- **Migration.md** — v4→v5 migration rules, brand matching logic, deprecated mappings
- **MigrationScript.md** — how to run the `olm:v5` artisan command
- **Upload.md** — upload/tagging architecture, metrics pipeline, Redis key alignment
- **Mobile.md** — mobile v4 tag shim (ConvertV4TagsAction)
