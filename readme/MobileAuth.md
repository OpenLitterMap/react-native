# Mobile Auth & Onboarding
> OpenLitterMap React Native v7.1.2

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
- `screens/components/textInput/CustomTextInput.tsx` — Shared text input with `variant` prop (`light`/`dark`)
- `screens/permission/GalleryPermissionScreen.js` — Gallery access permission with gradient background
- `screens/permission/CameraPermissionScreen.js` — Camera + location permission with permission cards
- `utils/config.js` — Exports `URL` (API base URL), `WEB_URL`, and `IS_PRODUCTION`

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
- Checks: length >= 3, length >= 6, has uppercase or digit, length >= 10
- Labels: Short → OK → Good → Strong
- Colors: orange (`#ff8800`) → amber (`#ffbb00`) → green (accent) → green (accent)
- Appears only when the password field has content

## Language Flags (LanguageFlags)

Redesigned with:
- Animated dropdown panel with `LayoutAnimation` transitions
- White card background with shadow when expanded
- Active language highlighted with green tint
- Dynamic positioning via absolute `top: -12, right: (SCREEN_WIDTH * 0.35) / 2 - 24`

## Permission Screens

Both permission screens share a consistent layout:
- Gradient background matching WelcomeScreen
- Illustration in a subtle circular container (`rgba(39,174,96,0.08)`)
- CameraPermissionScreen: Permission items shown in rounded cards with icon circles
- Pill button with icon + text, accent shadow
- "Not now" skip link below


## API Endpoints
| Thunk | Method | Endpoint | Payload | Notes |
|-------|--------|----------|---------|-------|
| `userLogin` | POST | `/api/auth/token` | `{identifier, password}` | Enriched response: `{token, user, stats, level, rank, team}`. Single request — no separate fetchUser needed. 429 handled with user-friendly message. |
| `createAccount` | POST | `/api/auth/register` | `{email, password}` | Same enriched response as login. Backend auto-generates username. |
| `fetchUser` | GET | `/api/user/profile/index` | — | Used on app resume (via checkValidToken) and profile refresh. Not called after fresh login. |
| `checkValidToken` | POST | `/api/validate-token` | — | Token in header. Returns `{message: "valid"}`. Only called on app resume, never after fresh login. |
| `sendResetPasswordRequest` | POST | `/api/password/email` | `{email}` | |

## Login Flow
1. User enters email or username in the login field
2. `userLogin` thunk sends `{identifier, password}` — emails are lowercased, usernames are case-preserved
3. Backend resolves `identifier` to the matching user
4. On success: enriched response returns token + full profile in one request
5. `buildUserFromProfile` flattens the response into the Redux user object
6. No separate `fetchUser` or `checkValidToken` call needed

Legacy fallback: if the backend returns the old `{token, user}` shape (no `stats` key), the thunk falls back to calling `fetchUser` separately.

### Error Handling
- **429 (rate limit)**: Shows "Too many login attempts. Please wait a minute and try again." (backend throttle: 10/min)
- **Credential errors**: Matched via regex (`/credential|incorrect|invalid|unauthorized/i`) to show translated message
- **Network/server errors**: Show raw message or "Network error, please try again"

## Token Flow
1. Login/register returns token + full profile in one enriched response
2. Token stored in Redux `state.auth.token`, persisted by redux-persist
3. On app boot, `MainRoutes.js` reads the persisted token and calls `checkValidToken` once
4. `checkValidToken` only runs on app resume — NOT after fresh login (useEffect has no `token` dependency)
5. If valid, `fetchUser` is dispatched to refresh the user profile
6. If invalid, `logout()` resets auth state (redux-persist clears the persisted token)

**Logout cache cleanup:** Redux slices reset on `logout`, but some caches live outside
Redux in standalone AsyncStorage keys. A `createListenerMiddleware` listener in
`store/index.js` clears these on every logout (button, 401 auto-logout, account switch)
so a new account can't inherit the previous user's data: `profile_stats_cache`
(user-specific xp/position/totalImages) and `xp_levels_cache_v3` (so level titles
refresh). Keep `CLEAR_ON_LOGOUT` in sync with the `CACHE_KEY` values in
`ProfileScreen.js` and `xpLevels.js`.

## Form Components
All auth forms use Formik + Yup validation and the shared `CustomTextInput` component. Text normalization (trim, lowercase) happens at submit time, not per-keystroke, so users see exactly what they type.

- **SigninForm**: `login` field (email or username) + password. Validation requires both fields non-empty.
- **SignupForm**: `email` + `password`. Email validated as email format, password requires uppercase + digit + 6+ chars. Includes password strength indicator.
- **ForgotPasswordForm**: `email` only. Sends reset link. Button labeled "Send Reset Link" (was confusingly labeled "Forgot password?").

## Redux State (`state.auth`)
```
{
    submitStatus: 'idle' | 'loading',
    token: string | null,
    user: object | null,        // flattened by buildUserFromProfile
    serverStatusText: string
}
```

## Navigation
- `token === null` → `AuthStack` (Welcome → Auth screens)
- `token !== null` → `TabRoutes` (main app)
- AuthStack: `WELCOME` → `AUTH` (with back button to return to Welcome)
