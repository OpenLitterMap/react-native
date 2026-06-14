# Mobile Teams
> Team create/join/leave, active team, members, and the teams leaderboard.

## Overview
Users can create, join, and leave teams. Teams have leaderboards and member lists. One team can be set as the user's "active team" which receives credit for their uploads.

## Files
- `screens/team/TeamScreen.js` — Team management (create/join forms, user's teams list)
- `screens/team/TeamDetailsScreen.js` — Team detail view with member list
- `screens/team/TopTeamsScreen.js` — Global top teams leaderboard
- `screens/team/TeamLeaderboardScreen.js` — Team-specific leaderboard
- `reducers/team_reducer.js` — Team state and 8 async thunks
- `routes/TeamStack.tsx` — Team navigation stack

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `createTeam` | POST | `/api/teams/create` | `{name, identifier, teamType: 1}` | Hidden when `remaining_teams` is 0 |
| `joinTeam` | POST | `/api/teams/join` | `{identifier}` | |
| `leaveTeam` | POST | `/api/teams/leave` | `{team_id}` | Updates active team + removes from userTeams |
| `changeActiveTeam` | POST | `/api/teams/active` | `{team_id}` | |
| `inactivateTeam` | POST | `/api/teams/inactivate` | — | Sets active team to null |
| `getUserTeams` | GET | `/api/teams/list` | — | |
| `getTopTeams` | GET | `/api/teams/leaderboard` | — | |
| `getTeamMembers` | GET | `/api/teams/members` | `params: {team_id, page}` | Paginated |

## Redux State (`state.teams`)
```
{
    topTeams: array,
    topTeamsStatus: 'idle' | 'loading' | 'succeeded' | 'failed',
    userTeams: array,
    userTeamsStatus: 'idle' | 'loading' | 'succeeded' | 'failed',
    teamMembers: array,
    selectedTeam: object,
    teamsFormError: string,
    teamFormStatus: 'SUCCESS' | 'ERROR' | null,
    successMessage: string,
    memberNextPage: number | null
}
```

## Navigation
TabRoutes → TEAM tab → TeamStack:
- `TEAM_HOME` → TeamScreen
- `TOP_TEAMS` → TopTeamsScreen
- `TEAM_DETAILS` → TeamDetailsScreen
- `TEAM_LEADERBOARD` → TeamLeaderboardScreen
