# Mobile Tagging
> How the tagging screen works: search, browse, tag pills, the detail sheet, and the per-image tag model.

## Overview
The tagging system uses a full-screen image viewer with overlay controls. Tag data (including types, materials, and brands) is fetched from the backend API and cached locally. Users can search for tags, browse by category, or quick-add suggestions from other images in the session. Per-image tags are stored as `[{ cloId, quantity, materials, brands, customTags }]` arrays, with a temporary `brandOnly` tag shape supported for brand-first search flows until the user selects a normal object. Display names are resolved at render time from the cached tag index. Users can attach materials, brands, and custom tags to individual tags via the TagDetailSheet.

## Files
- `screens/addTag/AddTagScreen.js` — Main tagging screen (gradient overlays, image viewer, all sub-components)
- `screens/addTag/components/ImageViewer.js` — Gesture-based image viewer (pinch zoom, pan, spring swipe, double-tap, keyboard-dismiss tap)
- `screens/addTag/components/TagPills.js` — Tag chip display with tap-to-expand quantity stepper, category color bars, custom tag pills; a newly-added tag auto-expands so its options show by default
- `screens/addTag/components/TagSearchBar.js` — Search input with category-grouped results (SectionList), browse button, custom tag creation; tiered relevance ranking and a collapsible Brands section
- `screens/addTag/components/TagDetailSheet.js` — Bottom sheet modal: optional **Type** selection, per-tag materials, brands, custom tags; renders a category chooser for incomplete browse candidates
- `screens/addTag/components/CategoryBrowser.js` — Tabbed `[ By Category | Most Tagged ]` accordion browser (base nouns only, pinned "All Objects" section)
- `screens/addTag/components/TagSuggestions.js` — Smart quick-add suggestions derived from other images in session
- `screens/addTag/components/ImageProgressDots.js` — Visual tagged/untagged progress indicator for multi-image batches
- `screens/addTag/components/categoryColors.js` — Category-to-color mapping constant (`CATEGORY_COLORS`, `getCategoryColor`)
- `reducers/tags_reducer.js` — Tag data fetch, search index (objects + types), materials/brands lookups, AsyncStorage cache (7-day TTL)
- `reducers/photos_reducer.js` — Per-image tag storage (`tags`), `swiperIndex`, `findTag`/`filterOutTag` helpers
- `utils/formatKey.js` — Converts snake_case API keys to Title Case for display

## Tag Data Source

Tags come from `GET /api/tags/all` via `fetchAllTags`, cached in AsyncStorage (`tags_cache_v7`, 7-day TTL; invalidated on language change). Force refresh via Settings → Refresh Tags.

The catalogue contents (categories, objects, materials, brands, types, and the `category_objects`/`category_object_types` pivots) and the **`cloId`** concept — the `category_litter_object_id` that disambiguates an (object, category) pair, e.g. `bottle` in alcohol vs beverages — live in **[`BackendTagsConfig.md`](BackendTagsConfig.md)** (dev-oriented counts + a cloId-resolution walkthrough in **[`LocalDev.md`](LocalDev.md)**). What's mobile-specific is how that catalogue is flattened into a search index, below.

**Types** (e.g. "Beer Can", "Coffee Cup") are a v5.1 dimension on a `cloId`. Governing principle: **browse lists show simple nouns; the TagDetailSheet handles precision** — type rows are *not* shown as separate rows in browse, nor in search for vague queries. The user picks a type in the sheet's optional **Type** section after choosing the base object; selecting one sets the tag's `typeId` (→ `litter_object_type_id`, nullable), the object's `cloId` is unchanged. Types still surface in the index as entries with `isType: true`, used for (a) the search "own-name" match and (b) the sheet's valid-type list for the (object, category) pair.

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

Search matches all space-separated terms against `searchText` (translated type/object/category names). Brand names are searched directly from the brand index.

**Ranking** is a fixed relevance ladder (no composite score), so objects always rank above brands: exact object → exact compound → starts-with object → other object/compound → *(material, reserved)* → brand exact → brand prefix → brand contains. Within the dropdown, object results are grouped into category sections ordered by their best tier; the Brands section is appended last.

Three rules tame the "can" problem (one object linked to 3 categories + 42 loose brand substrings):
- **Type own-name match** — a type/compound row is shown only when a query term matches the type's *own* name, not just the inherited object text. So `can` → base **Can** (pick the type in the sheet), while `beer can` → **Beer Can** directly.
- **Brand length-gate** — 1–3 char queries match brand *exact/prefix* only; 4+ chars allow *contains*. (So `can` no longer pulls "Tropicana"/"pelican".)
- **Collapsible Brands** — the Brands section renders collapsed by default with a `Brands matching "{{query}}" · N` header, and auto-opens only when there's no strong object match.

Each result shows a left colour bar matching the category; type entries show a small "TYPE" badge and standalone brand results a "BRAND" badge. Max 100 results.

Selecting a simple-noun result that has types (and no type chosen) **opens the TagDetailSheet** so the type can be set there — since type rows are no longer listed in search. Results with a type already (e.g. *Beer Can*) add directly.

If the user adds a standalone brand first, that tag acts as a temporary seed. The next normal object tag absorbs that brand into its `brands` list so materials, brands, quantity, and the detail sheet all continue through the standard object-tag flow.

### Custom Tags from Search Bar
When search text doesn't match any existing tags:
- A "Create" button appears offering to create a custom tag with the entered text
- Pressing enter/return also creates the custom tag automatically
- Custom tags are stored at the image level (`image.customTags[]`) and displayed as indigo pills in TagPills

### Browse Mode
Tap the grid icon in the search bar to open the CategoryBrowser — a tabbed panel:
- **By Category** (default): a collapsed accordion (all sections start collapsed). A synthetic **"All Objects"** section is pinned first (each base object once — no category/type variants); the remaining sections are one per category. Headers show name + object count + chevron. Rows are simple nouns only — no type rows.
- **Most Tagged**: a hardcoded alphabetical fallback for now (real most-tagged ordering is a later pass; TODO in code).

Rows don't add directly — they emit a **candidate** to the TagDetailSheet. An "All Objects" pick (`{objectId, categoryId:null}`) resolves its category in the sheet (auto when the object is in one category, chooser when in several); a category-row pick (`{objectId, categoryId, cloId}`) pre-fills the category. The sheet then offers the optional Type section. Single-category, type-less objects are added directly (fast path).

## Tag Pills (Quantity Editing)

Tag pills have category-coloured left borders and a tap-to-expand interaction (transitions animated via `LayoutAnimation`):

- **Collapsed**: tag name + close button. Quantity > 1 shows a badge; a small amber dot marks a tag that has extras (materials/brands/custom tags) attached.
- **Expanded** (tap the pill): inline `[-] name ×qty [+] [...] [×]` controls — decrement (trash at qty=1), increment (capped at the per-user max quantity), open TagDetailSheet, remove, and tap again to collapse.
- **Custom tag pills**: indigo with a pricetag icon, close button only — no quantity/detail controls.

A **newly-added** tag's pill auto-expands so its options are visible by default. This fires only on a genuine incremental add — not on first render, not when editing a photo that already has tags, and not on photo switches (which replace the whole tag set).

Maximum quantity is tiered: trusted users (`verification_required === false`) get `MAX_QUANTITY_TRUSTED` (100), everyone else `MAX_QUANTITY_DEFAULT` (10). See `screens/addTag/components/tagUtils.js`.

## Tag Detail Sheet (Materials, Brands, Custom Tags)

The TagDetailSheet is a bottom sheet modal opened from the expanded pill's `[...]` button, or automatically when a browse/search selection needs precision (category and/or type). It attaches extra metadata to a specific tag. Swipe-down-to-close uses a Pan gesture (react-native-gesture-handler + reanimated translateY) declared `simultaneousWithExternalGesture` with the RNGH `ScrollView`. It snapshots the scroll position at the gesture's start (`onBegin`) and only drags/closes when the swipe *began* at the top — so swiping up from the bottom scrolls to the top instead of closing.

### Sections (in order)
1. **Header**: tag display name + category (coloured via `getCategoryColor`).
2. **Quantity**: ± stepper (same per-user max as the pills).
3. **Picked Up**: Yes / No / Unknown (+5 XP when Yes).
4. **Type** (optional, only when the (object, category) pair has types): chips for each valid type plus **"Skip / Not sure"** (= no type, `typeId` null). Selecting one re-keys the tag in place via the `SET_TYPE` draft action (preserves quantity/materials/brands/custom).
5. **Brands** (+3 XP each): search input with filtered results (max 5); selected brands as removable chips.
6. **Materials** (+2 XP each): toggleable chips from `materialsById`, translated names.
7. **Custom Tags** (+1 XP each): text input + "Add"; added tags as removable chips.
8. **Done button**: closes the sheet.

### Candidate resolution
The sheet can open on an incomplete **candidate** (no live tag yet) when a multi-category object is picked from "All Objects": it renders a **category chooser** first, and on selection creates the tag and (if the cloId has types) stays open for type selection. Single-category picks auto-resolve.

`AddTagScreen` tracks the open sheet by a `"cloId-typeId"` key (and a separate candidate object), and delegates the type/material/brand/custom-tag/quantity edits to the active image's draft (`useTagDraft`).

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
