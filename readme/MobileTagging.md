# Mobile Tagging (v5)
> OpenLitterMap React Native v7.0

## Overview
The v5 tagging system uses a full-screen image viewer with overlay controls. Tag data (including types, materials, and brands) is fetched from the backend API and cached locally. Users can search for tags, browse by category, or quick-add suggestions from other images in the session. Per-image tags are stored as `[{ cloId, quantity, materials, brands, customTags }]` arrays. Display names are resolved at render time from the cached tag index. Users can attach materials, brands, and custom tags to individual tags via the TagDetailSheet.

## Files
- `screens/addTag/AddTagScreen.js` — Main tagging screen (gradient overlays, image viewer, all sub-components)
- `screens/addTag/components/ImageViewer.js` — Gesture-based image viewer (pinch zoom, pan, swipe, double-tap, focus mode)
- `screens/addTag/components/TagPills.js` — Tag chip display with tap-to-expand quantity stepper, category color bars, custom tag pills
- `screens/addTag/components/TagSearchBar.js` — Search input with category-grouped results (SectionList), browse button, custom tag creation
- `screens/addTag/components/TagDetailSheet.js` — Bottom sheet modal for per-tag materials, brands, and custom tags
- `screens/addTag/components/CategoryBrowser.js` — Category chip browser with filtered FlatList for tag discovery
- `screens/addTag/components/TagSuggestions.js` — Smart quick-add suggestions derived from other images in session
- `screens/addTag/components/ImageProgressDots.js` — Visual tagged/untagged progress indicator for multi-image batches
- `screens/addTag/components/categoryColors.js` — Category-to-color mapping constant (`CATEGORY_COLORS`, `getCategoryColor`)
- `reducers/tags_reducer.js` — Tag data fetch, search index (objects + types), materials/brands lookups, AsyncStorage cache (7-day TTL)
- `reducers/photos_reducer.js` — Per-image tag storage (`tags`), `swiperIndex`, `findTag`/`filterOutTag` helpers
- `utils/formatKey.js` — Converts snake_case API keys to Title Case for display

## Tag Data Source

Tags are fetched from `GET /api/tags/all` via the `fetchAllTags` thunk. The response contains:

| Key | Count | Description |
|-----|-------|-------------|
| `categories` | 11 | smoking, alcohol, beverages, food, etc. |
| `objects` | 113 | butts, bottle, can, wrapper, etc. |
| `category_objects` | 117 | Pivot table — each entry maps one (category, object) pair to a unique `cloId` |
| `types` | 17 | Sub-type names (beer, wine, coffee, water, etc.) |
| `category_object_types` | 41 | Links types to parent cloIds for search enrichment |
| `materials` | 38 | Material options (plastic, paper, glass, etc.) |
| `brands` | 2,615 | Brand names for brand tagging |

### cloId (category_litter_object_id)
The `cloId` is the unique identifier for an (object, category) pair. It comes from `category_objects[].id` in the API response. Objects like "bottle" and "can" exist in multiple categories and are disambiguated by cloId:

```
can (object_id=14):
  cloId=14  → can + alcohol
  cloId=26  → can + beverages
  cloId=40  → can + food
```

17 legacy objects with empty `categories: []` are excluded from the search index.

### Types
Types are sub-classifications linked to parent cloIds via `category_object_types`. They enrich the search index so users can find specific items:
- "Beer Bottle" → resolves to Bottle + Alcohol cloId
- "Coffee Cup" → resolves to Cup + Beverages cloId

Type entries have `isType: true` and store both their type name and parent object context. When selected, they add the parent cloId to the image (types are search aids, not stored separately).

## Search Index (tags_reducer state)

```js
{
    objectEntries: [          // ~158 items (117 base + 41 type entries)
        // Base entry
        {
            cloId: 1,
            objectId: 1,
            objectKey: 'butts',
            categoryId: 1,
            categoryKey: 'smoking',
            displayName: 'Butts',
            categoryDisplayName: 'Smoking',
            isMultiCategory: false,
            searchText: 'butts smoking'
        },
        // Type entry
        {
            cloId: 13,                        // Parent cloId (Bottle + Alcohol)
            objectId: 13,
            objectKey: 'bottle',
            categoryId: 2,
            categoryKey: 'alcohol',
            displayName: 'Beer Bottle',       // typeName + parentDisplayName
            categoryDisplayName: 'Alcohol',
            isMultiCategory: true,
            isType: true,
            typeId: 1,
            typeName: 'Beer',
            parentDisplayName: 'Bottle',
            searchText: 'beer bottle alcohol'
        }
    ],
    categoriesById: {
        1: { id: 1, key: 'smoking', displayName: 'Smoking' }
    },
    entriesByCloId: {         // Base entries only (not type variants)
        1: { cloId: 1, objectId: 1, ... }
    },
    typeEntriesByKey: {       // Type entries keyed by "cloId-typeId"
        '13-1': { ... }
    },
    typesById: {              // Type lookup
        1: { id: 1, key: 'beer', name: 'Beer' }
    },
    materialsById: {          // Material lookup by ID
        1: { id: 1, key: 'plastic', name: 'Plastic' }
    },
    brandsById: {             // Brand lookup by ID
        1: { id: 1, key: 'coca_cola', name: 'Coca Cola' }
    },
    loading: false,
    lastFetchedAt: 1234567890
}
```

Cached in AsyncStorage under `tags_cache_v5` key with 7-day TTL. Force refresh available via Settings > Refresh Tags.

## Search Behavior

Search matches all space-separated terms against `searchText` (which includes type name, object name, and category name). Examples:
- `"bottle"` → matches Bottle in Alcohol, Bottle in Beverages, Beer Bottle, Wine Bottle, Water Bottle, etc.
- `"beer bottle"` → matches Beer Bottle (type entry for Bottle + Alcohol)
- `"can food"` → matches Can in Food

Results are grouped by category in the dropdown using SectionList with colored section headers. Each result shows a left color bar matching the category, and type entries show a small "TYPE" badge. Max 100 results.

### Custom Tags from Search Bar
When search text doesn't match any existing tags:
- A "Create" button appears offering to create a custom tag with the entered text
- Pressing enter/return also creates the custom tag automatically
- Custom tags are stored at the image level (`image.customTags[]`) and displayed as indigo pills in TagPills

### Browse Mode
Tap the grid icon in the search bar to open the CategoryBrowser. This shows:
- Horizontal scrollable category chips (with entry counts)
- Filtered FlatList of all entries in the selected category
- "All" mode shows every entry sorted alphabetically

## Tag Pills (Quantity Editing)

Tag pills have category-colored left borders and a tap-to-expand interaction:

- **Collapsed**: Shows tag name + close button. Quantity > 1 shows a badge overlay. A small amber dot indicates the tag has extras (materials, brands, or custom tags) attached.
- **Expanded** (tap the pill): Shows `[-] name ×qty [+] [...] [×]` inline controls.
  - `[-]` decrements (at qty=1, shows trash icon to remove)
  - `[+]` increments (max 10)
  - `[...]` opens TagDetailSheet for materials/brands/custom tags
  - `[×]` removes the tag
  - Tap the pill body again to collapse
- **Custom tag pills**: Shown in indigo with a pricetag icon. No quantity/detail controls, only a close button.
- Smooth transitions via LayoutAnimation.

## Tag Detail Sheet (Materials, Brands, Custom Tags)

The TagDetailSheet is a bottom sheet modal opened from the expanded pill's `[...]` button. It allows attaching extra metadata to a specific tag.

### Sections
1. **Header**: Tag display name + category, colored by getCategoryColor
2. **Quantity**: ± stepper (same max of 10)
3. **Materials** (+2 XP each): Toggleable chips showing all available materials from `materialsById`. Uses `t('litter.materials.{key}')` for translated names.
4. **Brands** (+3 XP each): Search input with filtered results (max 5). Selected brands shown as removable chips. Uses `brandsById` for O(1) name lookup.
5. **Custom Tags** (+1 XP each): Text input with "Add" button. Added tags shown as removable chips.
6. **Done button**: Closes the sheet.

### Data Flow
- `AddTagScreen` stores `detailTag` as a key string (`"cloId-typeId"`), parsed via `useMemo` to `detailCloId`/`detailTypeId`
- Five handler callbacks use a `dispatchDetailAction` factory to avoid boilerplate
- `brandsById` is passed directly for O(1) lookups (not the sorted array)
- `materialsArray` and `brandsArray` are sorted `Object.values()` for display

## Tag Suggestions

When tagging multiple images, `TagSuggestions` scans all other images in the session and shows the most-used tags (that aren't already on the current image) as quick-add chips. This eliminates repetitive searching for common tags.

## Image Progress

`ImageProgressDots` replaces the plain "1/10" counter with interactive dots:
- Green dot = image has tags
- Dim dot = untagged
- Large dot = current image
- Tappable for navigation
- Shows "X/Y tagged" summary text

## Per-Image Tag Storage

Tags on each image in `state.photos.imagesArray`:

```js
image.tags = [
    { cloId: 1, quantity: 3, materials: [1, 5], brands: [{ id: 42, quantity: 1 }], customTags: ['near café'] },
    { cloId: 14, quantity: 1, materials: [], brands: [], customTags: [] }
]
image.customTags = ['found near river']   // Image-level custom tags (from search bar)
image.picked_up = true
```

Display names are resolved at render time from `state.tags.entriesByCloId[cloId]`.

## Key Actions (photos_reducer)

### Tag helpers (module-level)
- `findTag(tags, cloId, typeId)` — Find a tag by (cloId, typeId) match
- `filterOutTag(tags, cloId, typeId)` — Filter out a tag by (cloId, typeId) match

### Tag CRUD
- `addTagV5({ imageIndex, cloId, typeId? })` — Add tag or increment quantity (initializes materials/brands/customTags)
- `removeTagV5({ imageIndex, cloId, typeId? })` — Remove tag entirely
- `updateTagQuantityV5({ imageIndex, cloId, typeId?, quantity })` — Set exact quantity (removes if ≤ 0)

### Tag extras
- `toggleMaterialOnTag({ imageIndex, cloId, typeId?, materialId })` — Toggle material on/off
- `addBrandToTag({ imageIndex, cloId, typeId?, brandId })` — Add brand (deduped)
- `removeBrandFromTag({ imageIndex, cloId, typeId?, brandId })` — Remove brand
- `addCustomTagToTag({ imageIndex, cloId, typeId?, text })` — Add per-tag custom tag (trimmed, deduped)
- `removeCustomTagFromTag({ imageIndex, cloId, typeId?, text })` — Remove per-tag custom tag

### Image-level
- `addImageCustomTag({ imageIndex, text })` — Add image-level custom tag (trimmed, deduped)
- `removeImageCustomTag({ imageIndex, text })` — Remove image-level custom tag
- `togglePickedUpByIndex(imageIndex)` — Toggle picked_up on a single image
- `changeSwiperIndex(index)` — Change which image is currently selected

## POST Payload Format (sent by HomeScreen upload flow)

```json
{
    "photo_id": 123,
    "tags": [
        {
            "category_litter_object_id": 1,
            "litter_object_type_id": null,
            "quantity": 3,
            "picked_up": true,
            "materials": [1, 5],
            "brands": [{ "id": 42, "quantity": 1 }],
            "custom_tags": ["near café", "found near river"]
        }
    ],
    "picked_up": 1
}
```

Image-level custom tags (`image.customTags`) are merged into the first tag entry's `custom_tags` array on upload. Materials are sent as an array of material IDs. Brands are sent as `[{ id, quantity }]`.

## XP Estimate
```
XP = 5 (upload base)
   + sum(tag quantities)
   + sum(materials per tag) × 2
   + sum(brands per tag) × 3
   + sum(custom tags per tag) × 1
   + image-level custom tags × 1
   + 5 (if picked_up)
```
The XP badge in the top bar pulses with a scale animation when the estimate changes.

## Visual Design

### Gradient Overlays
The top and bottom sections use `LinearGradient` (from `react-native-linear-gradient`) instead of flat semi-transparent backgrounds:
- **Top**: fades from dark (0.65 opacity) to transparent
- **Bottom**: fades from transparent to dark (0.8 opacity)

This creates a natural vignette effect keeping the image visible between overlays.

### Category Colors
Each category has a distinct color defined in `categoryColors.js`:
```
smoking=#E85D75, alcohol=#845EC2, beverages=#00C9A7, food=#F9A825,
personal_care=#FF8A65, medical=#E53935, industrial=#78909C,
vehicles=#5C6BC0, marine=#0097A7, electronics=#7E57C2, pets=#8D6E63
```
Used in tag pill left borders, search result color bars, category browser chips, and section headers.

## Image Viewer
AddTagScreen uses a gesture-based full-screen image viewer (`ImageViewer.js`) built with `react-native-gesture-handler` v2 and `react-native-reanimated` v3:
- **Pinch zoom**: 1x–4x with focal point tracking
- **Pan**: Pans zoomed image, swipes between images at 1x
- **Double tap**: Toggle between 1x and 2x zoom centered on tap point
- **Single tap**: Toggle focus mode (show/hide UI overlays)

## Navigation
- HomeScreen → `ADD_TAGS` route → AddTagScreen (modal)
- Back button (top-left arrow) → navigates back to HOME
- Done/Next button (bottom-right) → advances to next untagged image or navigates HOME when all tagged
- Swipe down gesture (>100px) → dismisses to HOME
