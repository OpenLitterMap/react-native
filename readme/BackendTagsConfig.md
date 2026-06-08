# Backend Tags Config — Mobile Summary

A mobile-developer summary of the tag taxonomy that `GET /api/tags/all` derives
from and that the mobile app caches. **This is not the source of truth** — the
canonical definition is `App\Tags\TagsConfig` in the backend repo.

> Mobile caching: AsyncStorage key `tags_cache_v7`, 7-day TTL
> (`reducers/tags_reducer.js`). See **MobileTagging.md** for how the cache is
> built into the search index.

---

## What the catalogue contains

`GET /api/tags/all` returns flat arrays the app indexes locally:

| Entity | Meaning |
|---|---|
| **categories** | Top-level groups: smoking, alcohol, food, personal_care, medical, industrial, vehicles, marine, electronics, pets + a soft-drinks group. ⚠️ The exact soft-drinks key (`beverages` vs `softdrinks`) and whether `unclassified` is a category are **unconfirmed** — see [BackendMobileApi.md → Open questions](BackendMobileApi.md#open-questions-pending-backend-confirmation). The client matches returned keys against `litter.json`. |
| **objects** | Litter objects (e.g. `butts`, `bottle`, `can`, `wrapper`). Each object key is `snake_case`. |
| **materials** | What an object is made of (e.g. `plastic`, `glass`, `aluminium`, `cardboard`) |
| **brands** | Brand list (e.g. `coca-cola`, `marlboro`), used as extra tags |
| **types** | Optional object refinement — "what was in the container" (e.g. `beer`, `water`, `juice`) |

Plus two pivot arrays that wire the above together:

- **category_objects** — the **(category, object)** pairs. Each pair has a
  `category_litter_object_id` (**cloId**), the ID the mobile app sends on every
  tag. This is why the same object (`bottle`) can belong to multiple categories
  (alcohol, softdrinks, food) without ambiguity.
- **category_object_types** — links a cloId to the `litter_object_type_id`
  values valid for it (e.g. an alcohol `bottle` allows `beer`, `wine`,
  `spirits`). This pivot carries only `category_litter_object_id` and
  `litter_object_type_id` (no own `id` column).

---

## Keys → display names

All catalogue entries use a `key` (snake_case slug); objects do **not** carry a
`display_name`. The app converts keys to display text at render time with
`utils/formatKey.js` (`snake_case` → `Title Case`). Localised litter names come
from `assets/langs/{lang}/litter.json`, not from the API.

---

## Default object/material associations

`TagsConfig` also defines, per category, the canonical objects and the materials
each object is typically made of (e.g. `butts` → `[plastic, paper]`; an alcohol
`bottle` → `[glass, plastic]` with types `[beer, wine, spirits, cider]`). The
mobile app uses these as suggested materials in the tag detail sheet. The exact,
authoritative associations live in `App\Tags\TagsConfig::get()` in the backend
repo — consult it there rather than duplicating the full table here.

---

## Related Docs

- **BackendTagging.md** — the tag API contract (POST/PUT `/api/v3/tags`)
- **MobileTagging.md** — search index, tag pills, detail sheet
