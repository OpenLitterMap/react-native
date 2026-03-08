# Mobile Leaderboards
> OpenLitterMap React Native v7.0

## Overview
Displays a global leaderboard of users ranked by their contributions. Supports time-based filtering.

## Files
- `screens/leaderboards/LeaderboardsScreen.js` — Leaderboard display with time filter tabs
- `reducers/leaderboards_reducer.js` — Leaderboard data fetching

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `getLeaderboardData` | GET | `/api/leaderboard?timeFilter={value}` | — | No auth required. |

## Time Filters
The `timeFilter` param controls the leaderboard period (e.g., all-time, this month, this year).

## Redux State (`state.leaderboard`)
```
{
    paginated: {
        users: array
    }
}
```
