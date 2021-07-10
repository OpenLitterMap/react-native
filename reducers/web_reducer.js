import {
  LOAD_MORE_WEB_IMAGES,
  REMOVE_WEB_IMAGE,
  WEB_CONFIRM,
  WEB_IMAGES
} from '../actions/types';

// state.auth.email
const INITIAL_STATE = {
  count: 0, // This is the count of all photos to tag
  photos: [] // We load 10 images at a time here
};

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    /**
     * At the end of swiping web.photos, load more images
     */
    case LOAD_MORE_WEB_IMAGES:
      let web_images = [...state.photos];

      action.payload.photos.forEach(photo => {
        web_images.push(photo);
      });

      return {
        ...state,
        photos: web_images
      };

    /**
     * After submitting an image + tags, we filter it from the photos array
     *
     * and decrement the count
     */
    case REMOVE_WEB_IMAGE:
      const filtered = state.photos.filter(
        photo => photo.id !== action.payload
      );

      const count = state.count - 1;

      return {
        ...state,
        photos: filtered,
        count
      };

    /**
     * Toggle webImageSuccess to show modal content on LitterPicker
     */
    case WEB_CONFIRM:
      const photos = (state.photos = [
        ...state.photos.slice(0, 0),
        ...state.photos.slice(1)
      ]);

      return {
        ...state,
        photos
      };

    /**
     * Images have been uploaded from the web
     */
    case WEB_IMAGES:
      return {
        ...state,
        count: action.payload.count,
        photos: action.payload.photos
      };

    default:
      return state;
  }
}
