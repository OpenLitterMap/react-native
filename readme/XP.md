# OpenLitterMap — XP System

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

Some objects award more than the default 1 XP per item:

| Object Key | XP per item |
|------------|-------------|
| `small` | 10 |
| `medium` | 25 |
| `large` | 50 |
| `bagsLitter` | 10 |

These are litter size categories — tagging a large item rewards more because it takes more effort to document and pick up.

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

| Level | XP Required | Title |
|-------|-------------|-------|
| 1 | 0 | Complete Noob |
| 2 | 100 | Less of a Noob |
| 3 | 500 | Post-Noob |
| 4 | 1,000 | Litter Wizard |
| 5 | 5,000 | Trash Warrior |
| 6 | 10,000 | Early Guardian |
| 7 | 15,000 | Trashmonster |
| 8 | 50,000 | Force of Nature |
| 9 | 100,000 | Planet Protector |
| 10 | 200,000 | Galactic Garbagething |
| 11 | 500,000 | Interplanetary |
| 12 | 1,000,000 | SuperIntelligent LitterMaster |

`LevelService::getUserLevel($xp)` returns: `level`, `title`, `xp_into_level`, `xp_for_next`, `xp_remaining`, `progress_percent`.

Frontend reads `user.next_level.title` and `user.next_level.progress_percent` for the XP bar.

---

## Admin XP

Admins earn **1 XP** per verification action (approve, delete, re-tag, reset). Awarded via `rewardXpToAdmin()` which increments the user's DB `xp` column and updates their Redis leaderboard score.

---

## When XP Is Processed

1. User uploads a photo → no XP yet
2. User adds tags → `GeneratePhotoSummaryService` calculates XP, stores in `photo.xp`
3. `TagsVerifiedByAdmin` event fires (immediate for all non-school users)
4. `ProcessPhotoMetrics` listener → `MetricsService::processPhoto()` adds XP to leaderboards and metrics

School students: XP is calculated at tag time but metrics processing waits for teacher approval.

---

## Key Files (Backend)

| File | Purpose |
|------|---------|
| `app/Enums/XpScore.php` | XP multiplier values |
| `app/Services/Tags/XpCalculator.php` | XP calculation from tags or summary |
| `app/Services/Tags/GeneratePhotoSummaryService.php` | Builds summary + calculates XP + applies picked-up bonus |
| `config/levels.php` | Level thresholds |
| `app/Services/LevelService.php` | Maps XP to level info |
| `app/Helpers/helpers.php` | `rewardXpToAdmin()` |
| `tests/Feature/Tags/v2/CalculatePhotoXpTest.php` | XP calculation tests |

---

## Mobile App — XP Preview

### Current Implementation

`AddTagScreen.js` shows a `+{xpEstimate} XP` badge in the top-right corner of the image viewer. The badge pulses (scale animation) when XP changes.

**Current formula (incomplete):**
```
xpEstimate = 5 + sum(tag.quantity) + (pickedUp ? 5 : 0)
```
This treats every object as 1 XP — it ignores the special overrides for `small`, `medium`, `large`, and `bagsLitter`.

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

### Current Client-Side Formula

```javascript
// AddTagScreen.js xpEstimate
let xp = 5; // upload base
for (const tag of currentTags) {
    xp += tag.quantity;
    xp += (tag.materials?.length || 0) * 2;
    xp += (tag.brands?.length || 0) * 3;
    xp += tag.customTags?.length || 0;
}
xp += currentCustomTags.length; // image-level custom tags
if (pickedUp) xp += 5;
```

Note: This uses a flat 1 XP per object regardless of key. The special overrides for `small`, `medium`, `large`, `bagsLitter` are not yet applied client-side (requires mapping `objectKey` to `SPECIAL_XP`).

### Key Files (Mobile)

| File | Purpose |
|------|---------|
| `screens/addTag/AddTagScreen.js` | XP badge display + pulse animation |
| `screens/addTag/components/TagDetailSheet.js` | XP hints per section (+2, +3, +1) |
| `reducers/tags_reducer.js` | `entriesByCloId` lookup, `materialsById`, `brandsById` |
| `reducers/images_reducer.js` | `tags` with `{ cloId, quantity, materials, brands, customTags }` |
| `screens/profile/components/LevelHero.js` | Level progress bar on Profile screen |
| `screens/profile/helpers/xpLevels.js` | Fetches + caches level thresholds from API |
