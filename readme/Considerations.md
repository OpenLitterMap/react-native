# Considerations

Known limitations / sharp edges to keep in mind. Not bugs that block shipping,
but behaviours worth designing around. Add to this as they come up.

## Photo selection → tagging → upload flow

How a user is affected when selecting/tagging **large** or **small** numbers of
photos. (Flows: `handleSelectMore` / `handleTapInboxPhoto` in `HomeScreen.js`,
`ImageViewer`, `useUploadPhotos`.)

### Large numbers

- **"Add Photos" has no count limit** (`selectionLimit: 0`) — a user can pick
  hundreds. GPS is read from EXIF **sequentially, one photo at a time**
  (`for … await readGpsFromExif`) with **no progress indicator**, so a big
  selection leaves the screen sitting on Home for several seconds before the
  geotagged picks land in the queue.
- **Tapping one inbox photo loads the whole geotagged queue into the tagger**,
  not just the 6 shown. A large picker import can drop 100+ photos into the
  swipe queue in one tap. (The queue is geotagged-only — non-geotagged picks
  never enter `imagesArray` — so it is never polluted with un-uploadable photos.)
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

- **Add Photos with 0 geotagged picks** → nothing enters the queue; the picks
  surface in the dismissible "Couldn't add — no location data" card instead.
- **A photo needs ≥1 tag to upload** (`isTagged`); untagged photos are skipped.
- **Per-tag quantity caps** (not photo caps): new users max 10 per tag, trusted users
  max 100; custom tags 3–100 chars.

### Worth fixing

1. **Add Photos on large selections** — batch the per-pick EXIF reads
   (`readGpsFromExif`) and show a "Reading photos…" indicator, instead of a
   silent sequential wait.

_Resolved in v7.10.0: the inbox queue is geotagged-only — non-geotagged picks
never enter `imagesArray`, so tagging effort can no longer be wasted on
un-uploadable photos._
