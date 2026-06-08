# Considerations

Known limitations / sharp edges to keep in mind. Not bugs that block shipping,
but behaviours worth designing around. Add to this as they come up.

## Photo selection → tagging → upload flow

How a user is affected when selecting/tagging **large** or **small** numbers of
photos. (Flows: `handleSelectMore` / `handleTapInboxPhoto` in `HomeScreen.js`,
`ImageViewer`, `useUploadPhotos`.)

### Large numbers

- **"Select More" has no count limit** (`selectionLimit: 0`) — a user can pick
  hundreds. GPS is read from EXIF **sequentially, one photo at a time**
  (`for … await readGpsFromExif`) with **no progress indicator**, so a big
  selection leaves the screen sitting on Home for several seconds before it jumps
  to tagging. (The gallery's own EXIF fallback batches in 10s; Select More does not.)
- **Tapping one inbox photo loads all currently-loaded geotagged photos into the
  tagger**, not just the 6 shown. After a few "Load more" taps (50/page) one tap can
  drop 100+ photos into the swipe queue. (Since v7.9.0 only geotagged photos are
  added — non-geotagged tiles are inert in tag mode — so the queue is never polluted
  with un-uploadable photos.)
- **The tagging swiper scales fine** — `ImageViewer` is windowed (mounts ~5 images
  around the current index), so a huge queue is not a rendering problem.
- **Upload is strictly sequential** — one request at a time, with a progress modal
  and cancel (AbortController). Many tagged photos = a long but bounded, cancelable
  upload. (A GPS guard still filters any non-geotagged photo at upload as defence,
  but since v7.9.0 the tagger only ever receives geotagged photos.)
- **`imagesArray` is persisted** (redux-persist → AsyncStorage). A queue of hundreds
  is a large blob written on every change and re-read on launch — slower persistence
  / rehydrate and more memory the bigger it gets.

### Small numbers / edge cases

- **Select More with 0 geotagged picks** → "None of the selected photos have location
  data." (nothing imported).
- **A photo needs ≥1 tag to upload** (`isTagged`); untagged photos are skipped.
- **Per-tag quantity caps** (not photo caps): new users max 10 per tag, trusted users
  max 100; custom tags 3–100 chars.

### Worth fixing

1. **Select More on large selections** — batch the EXIF reads (like the gallery does)
   and show a "Reading photos…" indicator, instead of a silent sequential wait.

_Resolved in v7.9.0: tap-to-tag now adds geotagged-only photos, and non-geotagged
tiles are inert in tag mode — so tagging effort can no longer be wasted on
un-uploadable photos._
