# Mobile Navigation
> OpenLitterMap React Native v7.0

## Overview
The app uses React Navigation v6 with a combination of stack navigators and material top tabs.

## Files
- `routes/MainRoutes.js` — Root stack navigator with auth gating
- `routes/AuthStack.js` — Welcome → Auth screen stack
- `routes/TabRoutes.tsx` — Bottom tab navigator (@react-navigation/bottom-tabs)
- `routes/TeamStack.tsx` — Team screens stack navigator
- `routes/PermissionStack.tsx` — Camera/Gallery permission screens
## Structure
```
NavigationContainer
└── MainRoutes (Stack)
    ├── [No token] AUTH_HOME → AuthStack
    │   ├── WELCOME → WelcomeScreen
    │   └── AUTH → AuthScreen (with tabs: Signin, Signup, ForgotPassword)
    │
    └── [Has token]
        ├── APP → TabRoutes (Bottom Tabs)
        │   ├── HOME → HomeScreen
        │   ├── TEAM → TeamStack
        │   └── USER_STATS → ProfileScreen
        ├── PERMISSION → PermissionStack
        ├── ADD_TAGS → AddTagScreen
        ├── ALBUM → GalleryScreen
        ├── SETTING → SettingsScreen
        ├── UPDATE → NewUpdateScreen
        └── MY_UPLOADS → MyUploads
```

## Auth Gating
`MainRoutes` checks `state.auth.token`:
- `null` → Shows AuthStack
- Not null → Shows main app screens

On boot, the stored JWT is validated via `checkValidToken` before rendering.

## Modal Screens
All screens above `APP` in the stack use `presentation: "modal"` for slide-up transitions.
