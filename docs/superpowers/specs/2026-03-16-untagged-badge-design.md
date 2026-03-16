# Untagged Count Badge — Design Spec

## Problem

HomeScreen calls `getUntaggedImages` on mount, which fetches up to 100 untagged photos from the server and adds them all to `imagesArray`. For power users with tens of thousands of uploads, this downloads many images unnecessarily, wasting bandwidth and cluttering the HomeScreen grid.

## Solution

Replace bulk fetch with a lightweight count + fetch-one-at-a-time pattern.

### Behavior

1. **On HomeScreen mount** (when `enable_admin_tagging` is false and token exists): call `GET /api/v3/user/photos/stats` to get `leftToTag` count. Store in `images.untaggedCount`.

2. **Floating badge**: A circular notification-style badge in the bottom-right of the image grid area. Shows the `untaggedCount` number in white text on an accent-colored circle. Only rendered when `untaggedCount > 0`. Positioned absolute, bottom-right, above the existing ActionButton area.

3. **On badge tap**:
   - Fetch one untagged photo: `GET /api/v3/user/photos?tagged=false&per_page=1`
   - Convert the API photo to `editingPhoto` format using `loadPhotoForEditing` (same as MyUploads edit flow)
   - Navigate to AddTagScreen (which already handles `editingPhoto`)

4. **After tagging** (editTagsOnPhoto succeeds):
   - `clearEditingPhoto()` fires, user returns to HomeScreen
   - Decrement `untaggedCount` by 1 (optimistic)
   - User taps badge again for the next photo

5. **Badge hidden** when `untaggedCount === 0` or `untaggedCount === null` (loading/error).

### API Endpoints (existing, no backend changes)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/v3/user/photos/stats` | Returns `{ totalPhotos, totalTags, leftToTag, taggedPercentage }` |
| `GET /api/v3/user/photos?tagged=false&per_page=1` | Returns one untagged photo with full metadata |

### State Changes

**images_reducer.js:**
- Remove: `getUntaggedImages` thunk and its fulfilled handler (lines 72-97, 694-720)
- Add to initialState: `untaggedCount: null` (null = not yet fetched, 0 = none)
- Add thunk: `fetchUntaggedCount` — calls stats endpoint, returns `leftToTag`
- Add thunk: `fetchNextUntaggedPhoto` — calls photos endpoint with `tagged=false&per_page=1`, dispatches `loadPhotoForEditing`, returns photo
- Add reducer case: `fetchUntaggedCount.fulfilled` — sets `state.untaggedCount = action.payload`
- Add reducer case: `editTagsOnPhoto.fulfilled` — also decrements `state.untaggedCount` if > 0 (optimistic update for badge)
- Add reducer: `decrementUntaggedCount` action (for manual adjustment if needed)

**HomeScreen.js:**
- Replace `dispatch(getUntaggedImages())` with `dispatch(fetchUntaggedCount())`
- Add badge tap handler: `handleTagNextUntagged` — dispatches `fetchNextUntaggedPhoto`, then navigates to AddTagScreen
- Render `UntaggedBadge` component

### New Component

**`screens/home/homeComponents/UntaggedBadge.js`**

Props: `count` (number), `onPress` (function), `loading` (boolean)

Renders:
- `Pressable` with absolute positioning (bottom: 90, right: 20 — above ActionButton)
- Circular background (accent color, ~48px diameter)
- Cloud icon (Ionicons `cloud-outline`, white, 20px)
- Count text (white, bold, 14px) below or beside the icon
- Opacity feedback on press
- `ActivityIndicator` replaces content when `loading=true`
- Hidden when `count <= 0`

### Edge Cases

- **Stats fetch fails**: `untaggedCount` stays null, badge hidden. No error shown (non-critical feature).
- **Photo fetch fails on tap**: Show Alert with error message. Badge stays visible for retry.
- **Count reaches 0 after tagging**: Badge disappears. No special message.
- **User has `enable_admin_tagging` enabled**: Stats fetch is skipped entirely (line 141 check stays). Badge never shown.
- **No token**: Stats fetch not called (existing guard). Badge hidden.

### Files Changed

| File | Change |
|------|--------|
| `reducers/images_reducer.js` | Remove `getUntaggedImages`, add `fetchUntaggedCount` + `fetchNextUntaggedPhoto` thunks, add `untaggedCount` state |
| `screens/home/HomeScreen.js` | Replace bulk fetch call, add badge tap handler, render UntaggedBadge |
| `screens/home/homeComponents/UntaggedBadge.js` | **New file** — floating circle badge component |
| `screens/home/homeComponents/index.js` | Export UntaggedBadge |
