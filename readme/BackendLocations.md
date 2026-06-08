# Backend Locations — Mobile Contract

The mobile app uses location data only to render the **location hierarchy filter
in My Uploads** (drill down World → Country → State → City). It calls just two
endpoints. This is a mobile-developer summary, not the backend source of truth.

> Backend location-resolution design (DB schema, Redis key patterns, geocoding,
> migrations) lives in the backend repo.
> Mobile usage: `reducers/locations_reducer.js`; UI in **MobileMyUploads.md**.

---

## Endpoints

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/api/locations/country` | Top-level list of countries |
| `GET` | `/api/locations/{type}/{id}` | Children of a location (drill down) |

`{type}` is `country` or `state`; `{id}` is that location's id. Fetching a
country's children returns its states; fetching a state's children returns its
cities.

Confirmed in `reducers/locations_reducer.js`:
- `fetchCountries` → `/api/locations/country` (line 18)
- `fetchLocationChildren` → `/api/locations/${type}/${id}` (line 33)

---

## Response shape (what the app reads)

Both endpoints return a `locations` array. The reducer reads
`response.data.locations` (falling back to `response.data` for countries):

```json
{
    "locations": [
        { "id": 12, "name": "Ireland", ... },
        { "id": 33, "name": "France",  ... }
    ]
}
```

The app only needs each entry's `id` and display `name` to build the breadcrumb
stack and the next drill-down request. Aggregate stats returned alongside (litter
totals, contributor counts, etc.) are not consumed by the mobile filter.

---

## Related Docs

- **MobileMyUploads.md** — the My Uploads screen and its location filter
