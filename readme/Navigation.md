# Navigation Guide

> OpenLitterMap React Native — React Navigation **v7**

## Navigator Architecture

All navigators use `@react-navigation/native-stack`; the in-app tab bar uses
`@react-navigation/bottom-tabs`. `MainRoutes` (`routes/MainRoutes.js`) does
**three-way routing** based on auth + onboarding state.

```
MainRoutes (NativeStack)
├── [token === null]                 AUTH_HOME → AuthStack (NativeStack)
│   ├── WELCOME → WelcomeScreen
│   └── AUTH → AuthScreen
├── [token + onboarding incomplete]  ONBOARDING → OnboardingStack (NativeStack)
└── [token + onboarding complete]
    ├── APP → TabRoutes (Bottom Tabs)
    │   ├── HOME → HomeScreen
    │   ├── TEAM → TeamStack (NativeStack: TEAM_HOME, TEAM_DETAILS, TOP_TEAMS, TEAM_LEADERBOARD)
    │   └── USER_STATS → ProfileScreen
    ├── ADD_TAGS → AddTagScreen                       (stack push)
    ├── SETTING → SettingScreen                       (stack push)
    ├── QUICK_TAGS_SETTINGS → QuickTagsSettingsScreen (stack push)
    ├── MY_UPLOADS → MyUploads                        (stack push)
    └── UPDATE → NewUpdateScreen                      (fullScreenModal, gestures off)
```

Onboarding state is per-user (`utils/onboarding.js`); camera priming lives
in `OnboardingStack`, not a standalone permission screen (see `Onboarding.md`).
The gallery path needs no permission (system photo picker), so there is no
gallery-permission screen or `PERMISSION` route any more (removed in the
v7.10.0 picker migration).

## Presentation

Only **`UPDATE`** uses `presentation: 'fullScreenModal'` (with
`gestureEnabled: false`). `ADD_TAGS`, `SETTING`, `QUICK_TAGS_SETTINGS` and
`MY_UPLOADS` are **plain stack pushes** (changed from fullScreenModal in v7.3.x — see
`Architecture.md`). All app screens set `headerShown: false`.

## Navigation Patterns

native-stack does not auto-resolve nested screen names — name the parent navigator:

```js
// Tab screen from a pushed/modal screen
navigation.navigate('APP', { screen: 'HOME' });   // not navigate('HOME')

// Pushed screens are direct children of MainRoutes
navigation.navigate('ADD_TAGS');
navigation.navigate('SETTING');

// Within a nested stack (e.g. TeamStack) — just navigate / goBack
navigation.navigate('TEAM_DETAILS');
navigation.goBack();

// A specific screen inside a nested stack — name the parent navigator:
navigation.navigate('TEAM', { screen: 'TEAM_LEADERBOARD' });
```

## Conventions

- **SafeAreaView** — always import from `react-native-safe-area-context` (supports the
  `edges` prop); never from `react-native`. `SafeAreaProvider` wraps the app in
  `App.tsx`. Most screens use `edges={['top','left','right']}`; the bottom inset is
  handled by the tab bar.
- **StatusBar** — each screen sets its own style; the shared `Header` uses
  `light-content` on dark headers, light-background screens use `dark-content`.
