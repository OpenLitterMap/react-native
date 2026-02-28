# Mobile My Uploads
> OpenLitterMap React Native v7.0

## Overview
Shows the user's upload history with pagination, filtering, and swipe actions (copy link, open on map).

## Files
- `screens/userStats/userComponents/MyUploads.js` — Upload history list with filters
- `reducers/my_uploads_reducer.js` — Upload history fetching and pagination

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `fetchUploads` | GET | `/history/paginated` | params: loadPage, paginationAmount, filterCountry, filterTag, filterCustomTag, filterDateFrom, filterDateTo | No `/api/` prefix. Auth required. |

## Filters
- Tag (text input)
- Custom tag (text input)
- Date range (from/to date pickers)
- Country (currently commented out)

## Swipe Actions
Each upload item supports right-swipe to reveal:
- **Copy Link** — Copies a deep link to the photo on openlittermap.com
- **Show on Map** — Opens the link in the device browser

## Tag Display
The component reads `item.result_string` or `item.summary` (whichever exists) to display tags. If neither field is present, a diagnostic log is emitted.

## Pagination
Uses `onEndReached` with 50% threshold to load next page. Deduplicates by item ID when appending.

## Redux State (`state.my_uploads_reducer`)
```
{
    uploads: { data: array, total, current_page, next_page_url, ... },
    loading: boolean,
    error: string | null
}
```
