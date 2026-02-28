# Mobile Global Stats
> OpenLitterMap React Native v7.0

## Overview
Displays global platform statistics with animated counters: total litter tagged, total photos, total users, and total littercoin.

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
    "total_litter": number,
    "total_photos": number,
    "total_users": number,
    "littercoin": string,
    "previousXp": number,
    "nextXp": number
}
```

## Redux State (`state.stats`)
```
{
    totalLitter: number,
    totalPhotos: number,
    totalUsers: number,
    totalLittercoin: number,
    targetPercentage: number,
    litterTarget: { previousTarget, nextTarget },
    statsErrorMessage: string | null
}
```

Stats are also cached in AsyncStorage under the `"globalStats"` key.
