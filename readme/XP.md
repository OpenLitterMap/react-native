# OpenLitterMap — XP System
> How XP is scored and levelled. The backend is authoritative; the mobile app shows an estimate (see Mobile Preview).

## XP Values

| Action | XP | Notes |
|--------|-----|-------|
| Upload a photo | **5** | Base XP, always awarded |
| Each litter object tagged | **1** | Multiplied by quantity |
| Each material tagged | **2** | Multiplied by parent tag's quantity |
| Each brand tagged | **3** | Brands have their own independent quantity |
| Each custom tag | **1** | Multiplied by parent tag's quantity |
| Picked up | **5** | Bonus when `remaining = false` |

### Special Object Overrides

Some objects (litter-size categories) award more than the default 1 XP per item — a large item rewards more because it takes more effort to document and pick up:

| Object | XP per item |
|--------|-------------|
| small | 10 |
| medium | 25 |
| large | 50 |
| bags of litter | 10 |

⚠️ The exact backend object **keys** are unconfirmed — this doc and `BackendMobileApi.md` disagree (`small`/`medium`/`large`/`bagsLitter` vs `dumping_small`/`dumping_medium`/`dumping_large`/`bags_litter`). Confirm against the backend `XpScore` enum before mapping them client-side (`BackendMobileApi.md` → Open questions).

---

## Formula

```
Total XP = Upload + Objects + Materials + Brands + Custom Tags + Picked Up Bonus

Upload       = 5 (always)
Objects      = Σ(quantity × object_xp)         object_xp = 1 (or special override)
Materials    = Σ(parent_quantity × 2)           per material on each tag
Brands       = Σ(brand_quantity × 3)            brands use their OWN quantity
Custom Tags  = Σ(parent_quantity × 1)           per custom tag on each tag
Picked Up    = 5 if remaining == false, 0 otherwise
```

### Quantity Rules

- **Objects**: `quantity` is set by the user (e.g., "3 cigarette butts"). XP = `quantity × xp_per_object`.
- **Materials**: Set membership — each material on a tag uses the **parent tag's quantity** as the multiplier. If you tag 3 bottles with plastic and glass, that's `3×2 + 3×2 = 12` material XP.
- **Brands**: Independent quantities — each brand has its own quantity. If you tag Coca-Cola (qty 2) on a can, that's `2×3 = 6` brand XP regardless of the parent tag's quantity.
- **Custom tags**: Same as materials — use the parent tag's quantity as the multiplier.

---

## Example

A user photographs litter on the ground, tags it, and picks it up:

```
Photo: picked up = true (remaining = false)

Tag 1: Cigarette Butt (qty 5)
  → Object:  5 × 1 = 5 XP

Tag 2: Plastic Bottle (qty 2), materials: [plastic], brands: [Coca-Cola qty 1]
  → Object:   2 × 1 = 2 XP
  → Material:  2 × 2 = 4 XP  (parent qty × material XP)
  → Brand:     1 × 3 = 3 XP  (brand's own qty × brand XP)

Tag 3: Large item (qty 1)
  → Object:  1 × 50 = 50 XP  (special override)

Calculation:
  Upload:      5
  Objects:     5 + 2 + 50 = 57
  Materials:   4
  Brands:      3
  Custom Tags: 0
  Picked Up:   5
  ─────────────
  Total:       74 XP
```

---

## Levels

XP accumulates into levels. Thresholds are flat (not exponential).

**Titles and thresholds are defined on the backend** (`GET /api/levels`, returned as
an object keyed by XP: `{ "0": { title }, "100": { title }, … }`). The mobile app
parses that shape in `screens/profile/helpers/xpLevels.js` (`normalizeLevels`),
caches it for 7 days (`xp_levels_cache_v3`, cleared on logout), and only falls back
to a hardcoded ladder when the API is unreachable. **This table is illustrative and
may lag the live backend.**

| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Noob |
| 2 | 100 | Litter Picker |
| 3 | 1,000 | Litter Wizard |
| 4 | 5,000 | Trash Warrior |
| 5 | 10,000 | Early Guardian |
| 6 | 15,000 | Trashmonster |
| 7 | 50,000 | Force of Nature |
| 8 | 100,000 | Planet Protector |
| 9 | 200,000 | Galactic Garbagething |
| 10 | 500,000 | Interplanetary |
| 11 | 1,000,000 | SuperIntelligent LitterMaster |

`LevelService::getUserLevel($xp)` returns: `level`, `title`, `xp_into_level`, `xp_for_next`, `xp_remaining`, `progress_percent`.

Frontend reads `user.next_level.title` and `user.next_level.progress_percent` for the XP bar.

---

## Backend internals (reference only)

XP is computed **on tag submission**, not on upload: `GeneratePhotoSummaryService` builds the photo summary + XP, then `ProcessPhotoMetrics` adds it to leaderboards/metrics (school students wait for teacher approval). Admins earn 1 XP per verification action. The authoritative source lives in the backend repo (`XpScore` enum, `XpCalculator`, `LevelService`, `config/levels.php`).

---

## Mobile App — XP Preview

### Current Implementation

`AddTagScreen.js` shows a `+{xpEstimate} XP` badge (top-right of the image viewer) that pulses when XP changes. The value is computed in `useTagDraft.js` — see the formula below.

### Data Available at Tagging Time

Each tag in `tags` has `{ cloId, typeId, quantity, materials, brands, customTags }`. The `objectKey` is available via `entriesByCloId[cloId].objectKey` from `tags_reducer.js`.

| Data | Available | Source |
|------|-----------|--------|
| Object key (e.g., `small`, `butts`) | Yes | `entriesByCloId[cloId].objectKey` |
| Object quantity | Yes | `tag.quantity` |
| Category key | Yes | `entriesByCloId[cloId].categoryKey` |
| Picked up flag | Yes | `image.picked_up` |
| Materials | Yes | `tag.materials` (array of material IDs) |
| Brands | Yes | `tag.brands` (array of `{ id, quantity }`) |
| Custom tags (per-tag) | Yes | `tag.customTags` (array of strings) |
| Custom tags (image-level) | Yes | `image.customTags` (array of strings) |

### Client-Side Formula

```javascript
// useTagDraft.js — xpEstimate (best-effort preview)
let xp = 5;                               // upload base
for (const tag of currentTags) {
    xp += tag.quantity || 1;              // flat 1 per object (see gaps below)
    if (tag.picked_up === true) xp += 5;  // +5 per picked-up tag
    xp += (tag.materials?.length || 0) * 2;
    xp += (tag.brands?.length || 0) * 3;
    xp += tag.customTags?.length || 0;
}
xp += currentCustomTags.length;           // image-level custom tags
```

**Known gaps vs the backend** (why the badge is only an estimate):
- Flat **1 XP per object** — ignores the special-object overrides above (would need an `objectKey → XP` map).
- Picked-up is added **+5 per picked-up tag** here, but the backend awards **+5 once per photo** — so a multi-tag picked-up photo over-estimates.

### Key Files (Mobile)

| File | Purpose |
|------|---------|
| `screens/addTag/AddTagScreen.js` | XP badge display + pulse animation |
| `screens/addTag/components/TagDetailSheet.js` | XP hints per section (+2, +3, +1) |
| `reducers/tags_reducer.js` | `entriesByCloId` lookup, `materialsById`, `brandsById` |
| `reducers/photos_reducer.js` | `tags` with `{ cloId, quantity, materials, brands, customTags }` |
| `screens/profile/components/LevelHero.js` | Level progress bar on Profile screen |
| `screens/profile/helpers/xpLevels.js` | Fetches + caches level thresholds from API |
