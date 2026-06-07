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
- **Tapping one inbox photo loads the entire fetched set into the tagger**, not the
  6 shown. `handleTapInboxPhoto` adds *all* loaded photos (`selectInboxPhotos`), so
  after a few "Load more" taps (50/page) one tap can drop 100–250 photos into the
  swipe queue — **including the greyed non-geotagged ones**, which are tappable and
  taggable but can't upload. (The in-code comment still says "geotagged" — stale.)
- **The tagging swiper scales fine** — `ImageViewer` is windowed (mounts ~5 images
  around the current index), so a huge queue is not a rendering problem.
- **Upload is strictly sequential** — one request at a time, with a progress modal
  and cancel (AbortController). Many tagged photos = a long but bounded, cancelable
  upload. Non-geotagged tagged photos are silently filtered out at upload with an
  "X skipped — no GPS" alert (so any tagging effort on them is wasted).
- **`imagesArray` is persisted** (redux-persist → AsyncStorage). A queue of hundreds
  is a large blob written on every change and re-read on launch — slower persistence
  / rehydrate and more memory the bigger it gets.

### Small numbers / edge cases

- **Select More with 0 geotagged picks** → "None of the selected photos have location
  data." (nothing imported).
- **A photo needs ≥1 tag to upload** (`isTagged`); untagged photos are skipped.
- **Per-tag quantity caps** (not photo caps): new users max 10 per tag, trusted users
  max 100; custom tags 3–100 chars.

### The recurring gotcha (any scale)

- **Non-geotagged photos.** They display (greyed) and are tappable/taggable, but only
  geotagged photos ever upload. The grey-out signals it, but nothing prevents tagging
  one — so effort can be wasted.

### Worth fixing

1. **Select More on large selections** — batch the EXIF reads (like the gallery does)
   and show a "Reading photos…" indicator, instead of a silent sequential wait.
2. **Tap-to-tag loads everything (incl. non-geotagged)** — cap the queue to a sensible
   window, or filter the added set to geotagged-only so the swiper doesn't include
   un-mappable photos.
