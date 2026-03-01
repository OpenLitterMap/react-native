# Mobile My Uploads
> OpenLitterMap React Native v7.0

## Overview
Shows the user's upload history with pagination, filtering, swipe actions (copy link, open on map, delete), and upload statistics. No image thumbnails are shown to avoid excessive S3 requests — cards display tags, date, and location only.

## Files
- `screens/userStats/userComponents/MyUploads.js` — Upload history list with filters, stats header, swipe actions
- `screens/userStats/userComponents/myUploadsComponents/UploadCard.js` — Individual upload card (tags, date, status)
- `screens/userStats/userComponents/myUploadsComponents/TagChips.js` — Tag chips display for upload cards
- `screens/userStats/userComponents/myUploadsComponents/UploadStatsHeader.js` — Stats summary (total photos, tags, XP, left to tag)
- `screens/userStats/userComponents/myUploadsComponents/ActiveFilters.js` — Active filter chips with remove/clear
- `screens/userStats/userComponents/myUploadsComponents/EmptyUploads.js` — Empty state when no uploads match
- `screens/userStats/userComponents/myUploadsComponents/FilterSheet.js` — Bottom sheet with filter inputs (tag, custom tag, date range)
- `reducers/my_uploads_reducer.js` — Upload history fetching, pagination, stats, and delete

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `fetchUploads` | GET | `/api/v3/user/photos` | params: page, tag, custom_tag, date_from, date_to | Auth required. 8 per page. |
| `fetchUploadStats` | GET | `/api/v3/user/photos/stats` | — | Auth required. Returns total photos, tags, left to tag. |
| `deleteUploadPhoto` | POST | `/api/profile/photos/delete` | `{ "photoid": <id> }` | Auth required. Soft-deletes, reverses metrics. |

## Upload Card
Each card shows:
- **Status dot**: green (tagged) or amber (untagged)
- **Status text**: "Tagged" or "Untagged"
- **Time**: relative time via dayjs (`fromNow()`)
- **Tag chips**: from `item.new_tags` array
- **Stats row**: total tags count, XP earned, team name (if any)

No image thumbnail is rendered to avoid S3 bandwidth.

## Filters
- **Tag** (text input) — Filter by litter object key
- **Custom tag** (text input) — Filter by custom tag key
- **Date range** (from/to) — Date picker with ISO format

Filters are shown as removable chips via `ActiveFilters` component. Clear all button resets to defaults.

## Swipe Actions
Each upload item supports right-swipe to reveal:
- **Copy Link** — Copies a deep link to the photo on openlittermap.com
- **Show on Map** — Opens the link in the device browser
- **Delete** — Confirmation dialog, then calls `deleteUploadPhoto` API. Removes from list on success.

## Tag Display
The UI renders `new_tags` directly via `TagChips` component (v5 format with nested category/object).

## Pagination
Uses `onEndReached` with 50% threshold to load next page via `loadData`. Deduplicates by item ID when appending. `onEndReached` delegates to the same `loadData` callback (wrapped in `useCallback`) to avoid code duplication.

## Performance
- `loadData`, `applyFilters`, `removeFilter`, `clearAllFilters` are all wrapped in `useCallback`
- `listHeader`, `listEmpty`, `listFooter` are `useMemo` elements (not inline component functions) to prevent FlatList header/footer remounting on every render
- `onRefresh` depends on `loadData` via `useCallback` to avoid stale closures

## Redux State (`state.my_uploads_reducer`)
```
{
    uploads: { data: array, total, current_page, last_page, next_page_url, ... },
    uploadStats: { totalPhotos, totalTags, totalXp, leftToTag } | null,
    loading: boolean,
    error: string | null
}
```
