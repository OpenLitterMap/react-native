# Mobile Auth & Onboarding
> OpenLitterMap React Native v7.0

## Overview
Authentication is handled via Laravel Sanctum token-based auth. The user logs in with email or username + password, receives a Bearer token, and that token is stored in AsyncStorage and attached to all subsequent API requests.

The onboarding flow uses a nature-inspired gradient design system with smooth animations throughout.

## Files
- `reducers/auth_reducer.js` — Auth slice with 5 async thunks
- `screens/auth/WelcomeScreen.tsx` — Onboarding slides with gradient background and animated dots
- `screens/auth/AuthScreen.tsx` — Auth container with green gradient, animated logo, glassmorphic form card
- `screens/auth/authComponents/Slides.js` — Animated carousel with parallax image transitions and scroll-driven dot indicators
- `screens/auth/authComponents/SigninForm.js` — Login form (email or username, Formik + Yup)
- `screens/auth/authComponents/SignupForm.js` — Registration form with password strength indicator
- `screens/auth/authComponents/ForgotPasswordForm.js` — Password reset form
- `screens/auth/authComponents/LanguageFlags.js` — Language picker with animated dropdown panel
- `screens/auth/authComponents/StatusMessage.js` — Server status message display
- `screens/components/textInput/CustomTextInput.tsx` — Shared text input with `variant` prop (`light`/`dark`)
- `screens/permission/GalleryPermissionScreen.js` — Gallery access permission with gradient background
- `screens/permission/CameraPermissionScreen.js` — Camera + location permission with permission cards
- `actions/types.js` — Exports `URL` (API base URL) and `IS_PRODUCTION`

## Visual Design

### Gradient System
All onboarding screens use `react-native-linear-gradient` for depth and warmth:

- **WelcomeScreen**: Soft green gradient (`#f0faf4` → `#e8f5ec` → `#dcffeb` → `#d4f7e2`) — nature-inspired, light
- **AuthScreen**: Rich green gradient (`#1a6b3c` → `#1b8a4a` → `#27ae60` → `#2ecc71`) — diagonal, immersive
- **Permission screens**: Matching soft green gradient from WelcomeScreen for continuity

### Button Styles
Consistent pill-shaped buttons (`borderRadius: 100`, `height: 52`) across all screens:
- **Primary (Welcome)**: Green fill with accent shadow, white text
- **Primary (Auth forms)**: White fill, green text — inverted for contrast on dark gradient
- **Skip/Secondary**: Text-only, muted color

### Form Card
Auth forms are wrapped in a glassmorphic card (`rgba(255,255,255,0.12)` background, subtle border) that floats over the gradient. A small uppercase label identifies the current form mode.

### CustomTextInput Variants
The `variant` prop controls visual style:
- `variant="light"` (default): White background, gray border — for use on light backgrounds
- `variant="dark"`: Semi-transparent background (`rgba(255,255,255,0.12)`), light border — for use on dark/gradient backgrounds. Error colors use `#ff8a80` (soft red) instead of the standard error red.

## Animated Slides (WelcomeScreen)

The Slides component uses `Animated.event` to drive scroll-linked animations:

- **Parallax images**: Images shift horizontally with a subtle offset as you swipe
- **Content fade**: Title and description fade in/out with a vertical translation
- **Dot indicators**: Active dot expands from 8px to 24px width with opacity transition, all driven by scroll position (no discrete state updates)

Slide data uses `titleText` (plain string like "Easy", "Fun", "Open") instead of the old `"It's EASY!"` format.

## Auth Logo Animation

When the keyboard opens, the logo smoothly animates to `height: 0` and `opacity: 0` instead of abruptly disappearing. Uses `Animated.timing` tied to keyboard show/hide events with platform-appropriate durations (250ms iOS, 150ms Android).

## Password Strength Indicator (SignupForm)

Visual 4-segment bar showing password strength:
- Checks: length >= 6, has uppercase, has digit, length >= 10
- Colors: red (Weak) → orange (Fair) → yellow (Good) → green (Strong)
- Appears only when the password field has content

## Language Flags (LanguageFlags)

Redesigned with:
- Animated dropdown panel with `LayoutAnimation` transitions
- White card background with shadow when expanded
- Active language highlighted with green tint
- Consistent positioning via absolute `top: 8, right: 16`

## Permission Screens

Both permission screens share a consistent layout:
- Gradient background matching WelcomeScreen
- Illustration in a subtle circular container (`rgba(39,174,96,0.08)`)
- CameraPermissionScreen: Permission items shown in rounded cards with icon circles
- Pill button with icon + text, accent shadow
- "Not now" skip link below

### Bug Fixes
- **GalleryPermissionScreen**: Fixed duplicate `AppState.addEventListener` calls (two separate useEffects both adding listeners)
- **CameraPermissionScreen**: Fixed stale closure in `AppState` listener (was capturing `appState` from render, now uses `AppState.currentState`)

## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `userLogin` | POST | `/api/auth/token` | `{identifier, password}` | `identifier` is email or username. Emails lowercased, usernames case-preserved. Returns `{token, user}` |
| `createAccount` | POST | `/api/register` | `{email, password}` | Backend auto-generates username. Returns `{token, user}` |
| `fetchUser` | GET | `/api/user` | — | Returns full user profile |
| `checkValidToken` | POST | `/api/validate-token` | — | Token in header. Returns `{message: "valid"}` |
| `sendResetPasswordRequest` | POST | `/api/password/email` | `{email}` | |

## Login Flow
1. User enters email or username in the login field
2. `userLogin` thunk sends `{identifier, password}` — emails are lowercased, usernames are case-preserved
3. Backend resolves `identifier` to the matching user
4. On success: token saved to AsyncStorage + Redux, `fetchUser` dispatched

### Error Handling
Server error messages are matched against a regex pattern (`/credential|incorrect|invalid|unauthorized/i`) to show the translated `auth.invalid-credentials` message. Other errors (network, server) show the raw message. This replaces the old hardcoded English string comparison.

## Token Flow
1. Login/register returns a token
2. Token saved to `AsyncStorage` key `"jwt"` and to Redux `state.auth.token`
3. `redux-persist` persists the auth slice automatically
4. On app boot, `MainRoutes.js` reads the stored JWT and calls `checkValidToken`
5. If valid, `fetchUser` is dispatched to load the user profile
6. If invalid, `logout()` removes `jwt` and `user` from AsyncStorage and resets state

## Form Components
All auth forms use Formik + Yup validation and the shared `CustomTextInput` component. Text normalization (trim, lowercase) happens at submit time, not per-keystroke, so users see exactly what they type.

- **SigninForm**: `login` field (email or username) + password. Validation requires both fields non-empty.
- **SignupForm**: `email` + `password`. Email validated as email format, password requires uppercase + digit + 6+ chars. Includes password strength indicator.
- **ForgotPasswordForm**: `email` only. Sends reset link. Button labeled "Send Reset Link" (was confusingly labeled "Forgot password?").

## Redux State (`state.auth`)
```
{
    appVersion: string,
    isSubmitting: boolean,
    token: string | null,
    user: object | null,
    serverStatusText: string,
    errors: object
}
```

## Navigation
- `token === null` → `AuthStack` (Welcome → Auth screens)
- `token !== null` → `TabRoutes` (main app)
- AuthStack: `WELCOME` → `AUTH` (with back button to return to Welcome)
