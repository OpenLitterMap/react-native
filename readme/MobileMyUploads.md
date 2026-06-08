# Mobile My Uploads
> The user's upload history — paginated list, filters, and swipe actions (no thumbnails).

## Overview
Shows the user's upload history with pagination, filtering, and swipe actions (edit tags, toggle visibility, copy link, open on map, delete). No image thumbnails are shown to avoid excessive S3 requests — cards display tags, date, and location only. Dashboard-level stats (untagged count etc.) come from `server_photos_reducer`, not this screen.

## Files
- `screens/userStats/userComponents/MyUploads.js` — Upload history list with filters and swipe actions
- `screens/userStats/userComponents/myUploadsComponents/UploadCard.js` — Individual upload card (tags, date, status)
- `screens/userStats/userComponents/myUploadsComponents/TagChips.js` — Tag chips display for upload cards
- `screens/userStats/userComponents/myUploadsComponents/ActiveFilters.js` — Active filter chips with remove/clear
- `screens/userStats/userComponents/myUploadsComponents/EmptyUploads.js` — Empty state when no uploads match
- `screens/userStats/userComponents/myUploadsComponents/FilterSheet.js` — Bottom sheet with the full filter set
- `reducers/uploads_reducer.js` — Upload history fetching, pagination, locations, and delete

## API Endpoints
| Thunk / call | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `fetchUploads` | GET | `/api/v3/user/photos` | params: page + active filters | Auth required. ~8 per page (server-paginated). |
| `fetchUserLocations` | GET | `/api/v3/user/photos/locations` | — | Hierarchical country/state/city tree for the filter sheet. |
| `deleteUploadPhoto` | POST | `/api/profile/photos/delete` | `{ "photoid": <id> }` | Auth required. Soft-deletes, reverses metrics. |
| Toggle visibility | PATCH | `/api/v3/photos/{id}/visibility` | `{ is_public }` | Called inline from the card swipe action (not a thunk). |

## Upload Card
Each card shows:
- **Status dot**: green (tagged) or amber (untagged)
- **Status text**: "Tagged" or "Untagged"
- **Time**: relative time via dayjs (`fromNow()`)
- **Tag chips**: from `item.new_tags` array
- **Stats row**: total tags count, XP earned, team name (if any)

No image thumbnail is rendered to avoid S3 bandwidth.

## Filters
The filter sheet supports the full param set sent by `fetchUploads` (see `reducers/uploads_reducer.js`):
- **tag** / **custom_tag** — by litter object key / custom tag text
- **date** (from/to) — date range, sent as ISO `date_from` / `date_to`
- **country** / **state** / **city** — location hierarchy (from `fetchUserLocations`)
- **verified** — verification status
- **picked_up** — picked-up flag

Active filters are shown as removable chips via `ActiveFilters`. Clear all resets to defaults.

## Swipe Actions
Each upload card supports swipe to reveal:
- **Edit Tags** — `loadPhotoForEditing` then navigates to `ADD_TAGS` to re-tag the photo.
- **Toggle Visibility** — flips `is_public` via `PATCH /api/v3/photos/{id}/visibility` (no-op for school-team photos).
- **Copy Link** — copies a deep link to the photo on openlittermap.com.
- **Show on Map** — opens that link in the device browser.
- **Delete** — confirmation dialog, then `deleteUploadPhoto`; removed from the list on success.

## Tag Display
The UI renders `new_tags` directly via `TagChips` component (v5 format with nested category/object).

## Pagination
Uses `onEndReached` (50% threshold) to load the next page via `loadData`, deduplicating by item ID when appending.

## Redux State (`state.uploads`)
See `reducers/uploads_reducer.js`.
```
{
    uploads: { data: [] },   // runtime data object also carries total/per_page/current_page/last_page/next_page_url
    userLocations,           // cached location tree for the filter sheet (null = unfetched)
    locationsError,          // error from the last fetchUserLocations attempt
    fetchStatus,             // 'idle' | 'loading' | 'succeeded' | 'failed'  (status enum, not a loading boolean)
    error
}
```
