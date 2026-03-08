# Mobile Global Stats
> OpenLitterMap React Native v7.0

## Overview
Displays global platform statistics with animated counters: total tags, total photos, total users, and new user growth.

## Files
- `screens/globalData/GlobalDataScreen.js` — Stats display with animated counters
- `reducers/stats_reducer.js` — Global stats fetching

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `getStats` | GET | `/api/global/stats-data` | — | No auth required |

## Response Shape
```json
{
    "total_tags": number,
    "total_images": number,
    "total_users": number,
    "new_users_today": number,
    "new_users_last_7_days": number,
    "new_users_last_30_days": number
}
```

## Redux State (`state.stats`)
```
{
    totalTags: number,
    totalImages: number,
    totalUsers: number,
    newUsersToday: number,
    newUsersLast7Days: number,
    newUsersLast30Days: number,
    statsErrorMessage: string | null
}
```
