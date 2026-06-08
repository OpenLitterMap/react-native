# Mobile Tagging
> How the tagging screen works: search, browse, tag pills, the detail sheet, and the per-image tag model.

## Overview
The tagging system uses a full-screen image viewer with overlay controls. Tag data (including types, materials, and brands) is fetched from the backend API and cached locally. Users can search for tags, browse by category, or quick-add suggestions from other images in the session. Per-image tags are stored as `[{ cloId, quantity, materials, brands, customTags }]` arrays, with a temporary `brandOnly` tag shape supported for brand-first search flows until the user selects a normal object. Display names are resolved at render time from the cached tag index. Users can attach materials, brands, and custom tags to individual tags via the TagDetailSheet.

## Files
- `screens/addTag/AddTagScreen.js` — Main tagging screen (gradient overlays, image viewer, all sub-components)
- `screens/addTag/components/ImageViewer.js` — Gesture-based image viewer (pinch zoom, pan, spring swipe, double-tap, keyboard-dismiss tap)
- `screens/addTag/components/TagPills.js` — Tag chip display with tap-to-expand quantity stepper, category color bars, custom tag pills
- `screens/addTag/components/TagSearchBar.js` — Search input with category-grouped results (SectionList), browse button, custom tag creation, and brand-first results
- `screens/addTag/components/TagDetailSheet.js` — Bottom sheet modal for per-tag materials, brands, and custom tags
- `screens/addTag/components/CategoryBrowser.js` — Category chip browser with filtered FlatList for tag discovery
- `screens/addTag/components/TagSuggestions.js` — Smart quick-add suggestions derived from other images in session
- `screens/addTag/components/ImageProgressDots.js` — Visual tagged/untagged progress indicator for multi-image batches
- `screens/addTag/components/categoryColors.js` — Category-to-color mapping constant (`CATEGORY_COLORS`, `getCategoryColor`)
- `reducers/tags_reducer.js` — Tag data fetch, search index (objects + types), materials/brands lookups, AsyncStorage cache (7-day TTL)
- `reducers/photos_reducer.js` — Per-image tag storage (`tags`), `swiperIndex`, `findTag`/`filterOutTag` helpers
- `utils/formatKey.js` — Converts snake_case API keys to Title Case for display

## Tag Data Source

Tags come from `GET /api/tags/all` via `fetchAllTags`, cached in AsyncStorage (`tags_cache_v7`, 7-day TTL; invalidated on language change). Force refresh via Settings → Refresh Tags.

The catalogue contents (categories, objects, materials, brands, types, and the `category_objects`/`category_object_types` pivots) and the **`cloId`** concept — the `category_litter_object_id` that disambiguates an (object, category) pair, e.g. `bottle` in alcohol vs beverages — live in **[`BackendTagsConfig.md`](BackendTagsConfig.md)** (dev-oriented counts + a cloId-resolution walkthrough in **[`LocalDev.md`](LocalDev.md)**). What's mobile-specific is how that catalogue is flattened into a search index, below.

**Types** (e.g. "Beer Bottle", "Coffee Cup") are search aids: they add the parent object's `cloId` to the image, they aren't stored separately. They surface in the index as entries with `isType: true`.

## Search Index (tags_reducer state)

The reducer flattens the API response into a search index plus O(1) lookup maps. See `reducers/tags_reducer.js` for the full shape.

| Field | Meaning |
|-------|---------|
| `objectEntries` | Flat search list — one entry per (object, category) pair plus type variants. Each entry carries `cloId`, display/category names, `isMultiCategory`, and a precomputed `searchText`. Type entries add `isType`, `typeId`, `typeName`, `parentDisplayName`. |
| `entriesByCloId` | Base entries keyed by `cloId` (no type variants) — render-time display name resolution. |
| `typeEntriesByKey` | Type entries keyed by `"cloId-typeId"`. |
| `categoriesById` | Category lookup (`id`, `key`, translated `displayName`). |
| `typesById` / `materialsById` / `brandsById` | Lookup maps by id for types, materials, and brands. |
| `fetchStatus`, `lastFetchedAt` | Fetch lifecycle + cache timestamp. |

Cached in AsyncStorage under the `tags_cache_v7` key with a 7-day TTL (cache also invalidates on language change). Force refresh via Settings > Refresh Tags.

## Search Behavior

Search matches all space-separated terms against `searchText` (which includes translated display values for type, object, and category names). Brand names are also searched directly from the brand index and shown inline with normal tag results. Examples:
- `"bottle"` → matches Bottle in Alcohol, Bottle in Beverages, Beer Bottle, Wine Bottle, Water Bottle, etc.
- `"beer bottle"` → matches Beer Bottle (type entry for Bottle + Alcohol)
- `"can food"` → matches Can in Food
- `"coca"` → matches the `Coca-Cola` brand before the drawer opens

Results are grouped by category in the dropdown using SectionList with colored section headers. Each result shows a left color bar matching the category, type entries show a small "TYPE" badge, and standalone brand results show a "BRAND" badge. Max 100 results.

If the user adds a standalone brand first, that tag acts as a temporary seed. The next normal object tag absorbs that brand into its `brands` list so materials, brands, quantity, and the detail sheet all continue through the standard object-tag flow.

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

Tag pills have category-coloured left borders and a tap-to-expand interaction (transitions animated via `LayoutAnimation`):

- **Collapsed**: tag name + close button. Quantity > 1 shows a badge; a small amber dot marks a tag that has extras (materials/brands/custom tags) attached.
- **Expanded** (tap the pill): inline `[-] name ×qty [+] [...] [×]` controls — decrement (trash at qty=1), increment (capped at the per-user max quantity), open TagDetailSheet, remove, and tap again to collapse.
- **Custom tag pills**: indigo with a pricetag icon, close button only — no quantity/detail controls.

Maximum quantity is tiered: trusted users (`verification_required === false`) get `MAX_QUANTITY_TRUSTED` (100), everyone else `MAX_QUANTITY_DEFAULT` (10). See `screens/addTag/components/tagUtils.js`.

## Tag Detail Sheet (Materials, Brands, Custom Tags)

The TagDetailSheet is a bottom sheet modal opened from the expanded pill's `[...]` button. It allows attaching extra metadata to a specific tag. Supports swipe-down-to-close (Pan gesture via react-native-gesture-handler + reanimated translateY tracking, scroll-aware — only activates when ScrollView is at top).

### Sections
1. **Header**: tag display name + category (coloured via `getCategoryColor`).
2. **Quantity**: ± stepper (same per-user max as the pills).
3. **Materials** (+2 XP each): toggleable chips from `materialsById`, translated names.
4. **Brands** (+3 XP each): search input with filtered results (max 5); selected brands shown as removable chips.
5. **Custom Tags** (+1 XP each): text input + "Add"; added tags shown as removable chips.
6. **Done button**: closes the sheet.

`AddTagScreen` tracks the open sheet by a `"cloId-typeId"` key and delegates the material/brand/custom-tag/quantity edits to the active image's draft.

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

All tag mutations are reducer actions keyed by `imageIndex` + `(cloId, typeId)`: tag CRUD (`addTagV5`/`removeTagV5`/`updateTagQuantityV5`), tag extras (`toggleMaterialOnTag`, `addBrandToTag`/`removeBrandFromTag`, `addCustomTagToTag`/`removeCustomTagFromTag`), image-level custom tags (`addImageCustomTag`/`removeImageCustomTag`), `togglePickedUp`, and `changeSwiperIndex`. Module-level `findTag`/`filterOutTag` helpers locate a tag by `(cloId, typeId)`. See `reducers/photos_reducer.js` for argument shapes.

## Tag Write Payload (PUT /api/v3/tags)

On save, `utils/buildTagsPayload.js` converts the image's `tags` into the CLO wire format and the app sends `{ photo_id, tags }` (PUT = replace). Two mobile-specific notes: there is **no** top-level `picked_up` (it lives inside each tag object), and image-level `image.customTags` merge into the first tag's `custom_tags`. Full request shape + the brand-only/custom-only variants: **[`BackendMobileApi.md` → Tagging](BackendMobileApi.md#tagging)**.

## XP Estimate

The top bar shows a live `+{xp} XP` badge that pulses when the estimate changes. It's a **best-effort preview** and is deliberately incomplete — it counts a flat 1 XP per object and skips the special-object overrides. Full formula, values, and the preview's known gaps: **[`XP.md`](XP.md)**.

## Visual Design

The top and bottom overlays use dark-to-transparent gradients for a vignette that keeps the image visible behind the controls.

Each category has a distinct colour, used in tag pill left borders, search result colour bars, category browser chips, and section headers. The mapping (`CATEGORY_COLORS` / `getCategoryColor`) lives in `screens/addTag/components/categoryColors.js`.

## Image Viewer
AddTagScreen uses a gesture-based full-screen image viewer (`ImageViewer.js`) built with `react-native-gesture-handler` v2 and `react-native-reanimated` v4:
- **Pinch zoom**: 1x–4x with focal point tracking
- **Pan**: Pans zoomed image, swipes between images at 1x with spring settling
- **Double tap**: Toggle between 1x and 2x zoom centered on tap point
- **Single tap**: Dismisses the keyboard when the main search input is focused
- **Swipe persistence**: Draft tags are committed before the index changes so tags remain when moving between images

## Navigation
- HomeScreen → `ADD_TAGS` route → AddTagScreen (modal)
- Back button (top-left arrow) → `navigation.goBack()` (commits the draft first)
- Done/Next button (bottom-right) → advances to next untagged image, or finishes when all tagged
