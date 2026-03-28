# Navigation Guide

## Navigator Architecture

All navigators use `@react-navigation/native-stack` (native iOS/Android navigation controllers). This was migrated from `@react-navigation/stack` (JS-based) as part of the RN 0.84 upgrade.

```
MainRoutes (NativeStack)
├── [No token] AUTH_HOME → AuthStack (NativeStack)
│   ├── WELCOME → WelcomeScreen
│   └── AUTH → AuthScreen
└── [Has token]
    ├── APP → TabRoutes (Bottom Tabs)
    │   ├── HOME → HomeScreen
    │   ├── TEAM → TeamStack (NativeStack)
    │   │   ├── TEAM_HOME → TeamScreen
    │   │   ├── TEAM_DETAILS → TeamDetailsScreen
    │   │   ├── TOP_TEAMS → TopTeamsScreen
    │   │   └── TEAM_LEADERBOARD → TeamLeaderboardScreen
    │   └── USER_STATS → ProfileScreen
    ├── PERMISSION → PermissionStack (NativeStack, fullScreenModal)
    │   ├── GALLERY_PERMISSION → GalleryPermissionScreen
    │   └── CAMERA_PERMISSION → CameraPermissionScreen
    ├── ADD_TAGS → AddTagScreen (fullScreenModal)
    ├── ALBUM → GalleryScreen (fullScreenModal)
    ├── SETTING → SettingsScreen (fullScreenModal)
    ├── UPDATE → NewUpdateScreen (fullScreenModal)
    └── MY_UPLOADS → MyUploads (fullScreenModal)
```

## native-stack vs stack — Key Differences

| Feature | `@react-navigation/stack` (old) | `@react-navigation/native-stack` (current) |
|---------|------|------|
| Rendering | JS-based, single React tree | Native view controllers per screen |
| Safe areas | Handled by app code | Handled natively; app SafeAreaView still works |
| Transitions | Customizable JS animations | Native platform animations |
| Gestures | JS PanResponder-based | Native swipe gestures |
| `presentation: 'modal'` | JS overlay | Native iOS sheet/modal presentation |
| Nested navigation | Auto-resolves screen names across navigators | Requires explicit parent: `navigate('APP', { screen: 'HOME' })` |

## Navigation Patterns

### Navigating to a tab screen from a modal
```js
// CORRECT — specify parent navigator screen + nested tab name
navigation.navigate('APP', { screen: 'HOME' });

// WRONG — native-stack can't resolve nested names automatically
navigation.navigate('HOME');
```

### Navigating to a modal screen
```js
// CORRECT — modal screens are direct children of MainRoutes
navigation.navigate('ADD_TAGS');
navigation.navigate('ALBUM');
navigation.navigate('SETTING');

// WRONG — ALBUM is a single screen, not a nested navigator
navigation.navigate('ALBUM', { screen: 'GALLERY' });
```

### Navigating within a nested stack (e.g. TeamStack)
```js
// From TeamScreen to TeamDetails — same navigator, just navigate
navigation.navigate('TEAM_DETAILS');

// Going back
navigation.goBack();
```

### Navigating to a nested stack screen from outside
```js
// Navigate to permission stack with specific screen
navigation.navigate('PERMISSION', { screen: 'GALLERY_PERMISSION' });
```

## Modal Screen Configuration

All modal screens use `fullScreenModal` presentation with gestures disabled (the app handles its own dismiss gestures):

```js
<Stack.Screen
    name="ADD_TAGS"
    component={AddTagScreen}
    options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
/>
```

## SafeAreaView Rules

**Always use `react-native-safe-area-context`, never `react-native`'s built-in SafeAreaView.**

```js
// CORRECT
import { SafeAreaView } from 'react-native-safe-area-context';
<SafeAreaView edges={['top', 'left', 'right']}>

// WRONG — doesn't support edges prop, may double-pad with native-stack
import { SafeAreaView } from 'react-native';
```

- `SafeAreaProvider` wraps the app in `App.tsx`
- Use `edges` prop to control which edges get safe area insets
- Bottom safe area is handled by the tab bar (TabRoutes) — most screens only need `['top', 'left', 'right']`
- Don't add manual `paddingTop: StatusBar.currentHeight` — native-stack handles this

## StatusBar

Each screen can set its own status bar style. The Header component sets `barStyle="light-content"` for dark-background headers. Screens with light backgrounds (Welcome, Permission) should set `barStyle="dark-content"`.

```js
<StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
```

## iOS Native Setup (AppDelegate)

`RCTAppDependencyProvider` must be set in `AppDelegate.mm` for third-party Fabric components (like `RNSScreen`) to register:

```objc
#import <ReactAppDependencyProvider/RCTAppDependencyProvider.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    self.moduleName = @"openlittermap";
    self.dependencyProvider = [RCTAppDependencyProvider new];
    self.initialProps = @{};
    return [super application:application didFinishLaunchingWithOptions:launchOptions];
}
```

Without this, native screen views fall back to `RCTView` and crash with "unrecognized selector" errors.
