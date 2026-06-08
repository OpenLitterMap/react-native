# Mobile Auth
> Sanctum token login/registration, the boot & token flow, and the auth/welcome screens.

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
- `screens/permission/GalleryPermissionScreen.js` — Gallery access permission with gradient background (the only screen left in `screens/permission/`)
- `utils/config.js` — Exports `URL` (API base URL), `WEB_URL`, and `IS_PRODUCTION`

Camera (and the rest of permission priming) now lives in the onboarding flow — see `screens/onboarding/OnboardingPermissionScreen.js` and `OnboardingCameraScreen.js`, covered in `Onboarding.md`.

## Visual Design

The auth and welcome screens share a nature-inspired green-gradient design system (`react-native-linear-gradient`): a light gradient on WelcomeScreen, a richer diagonal gradient on AuthScreen, consistent pill-shaped buttons, and a glassmorphic form card floating over the gradient. `CustomTextInput` has `variant="light"` (default, light backgrounds) and `variant="dark"` (translucent, for use over the gradient). Exact colours/dimensions live in the component styles.

The WelcomeScreen carousel (`Slides.js`) is scroll-driven: parallax images, fading title/description, and an expanding active dot, all tied to scroll position. On AuthScreen the logo animates out when the keyboard opens.

## Password Strength Indicator (SignupForm)

A 4-segment bar that appears once the password field has content. Strength is scored on four checks (length ≥ 3, ≥ 6, has uppercase or digit, length ≥ 10) and labelled Short → OK → Good → Strong, with the bar colour shifting warm-to-green as strength rises.

## Language Flags (LanguageFlags)

An animated dropdown panel (`LayoutAnimation`) that expands into a white card, highlights the active language with a green tint, and lets the user switch UI language.

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
