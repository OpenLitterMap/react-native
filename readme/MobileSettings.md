# Mobile Settings
> OpenLitterMap React Native v7.0

## Overview
The settings screen allows users to edit their profile (name, username, email), toggle privacy switches, manage social accounts, and delete their account.

## Files
- `screens/setting/SettingsScreen.js` — Main settings screen with sections
- `screens/setting/settingComponents/SettingsComponent.js` — Edit modal and form logic
- `reducers/settings_reducer.js` — Settings state and 4 async thunks

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `saveSettings` | POST | `/api/settings/update/` | `{key, value}` | Updates name, username, email, picked_up, global_flag, enable_admin_tagging |
| `saveSocialAccounts` | PATCH | `/api/settings` | `{...values}` | Social account links |
| `toggleSettingsSwitch` | POST | `/api/settings/privacy/{endpoint}` | — | Privacy toggles (maps name/username, leaderboard name/username, etc.) |
| `deleteAccount` | POST | `/api/settings/delete-account/` | `{password}` | Requires password confirmation |

## Privacy Toggle Endpoints
| ID | Endpoint |
|----|----------|
| 4 | `maps/name` |
| 5 | `maps/username` |
| 6 | `leaderboard/name` |
| 7 | `leaderboard/username` |
| 8 | `createdby/name` |
| 9 | `createdby/username` |
| 10 | `toggle-previous-tags` |

## Redux State (`state.settings`)
```
{
    model: string,
    settingsModalVisible: boolean,
    secondSettingsModalVisible: boolean,
    settingsEdit: boolean,
    settingsEditProp: string,
    wait: boolean,
    dataToEdit: any,
    deleteAccountError: string,
    updateSettingsStatusMessage: string,
    updatingSettings: boolean
}
```

## Sections
| Section | Items |
|---------|-------|
| My Account | Name, Username, Email, Social |
| Picked Up | Litter picked up (default for new images) |
| Tagging | Enable admin tagging, **Refresh Tags** |
| Privacy | Show name/username on maps, leaderboards, created-by |
| Delete Account | Delete with password confirmation |

### Refresh Tags
Dispatches `fetchAllTags({ token, forceRefresh: true })` from `tags_reducer.js` to bypass the 7-day AsyncStorage cache and re-fetch tag data from the API. Useful if new litter categories or objects are added on the backend.

## Flow
1. User taps a setting field → `toggleSettingsModal` opens modal with current value
2. User edits value → `saveSettings` dispatched
3. On success, user object updated in both Redux and AsyncStorage
4. Second modal shows success/error message
