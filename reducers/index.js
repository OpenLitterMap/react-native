import auth from './auth_reducer'
import photos from './photos_reducer'
import camera from './camera_reducer'
import gallery from './gallery_reducer'
import litter from './litter_reducer'
import shared from './shared_reducer'
import settings from './settings_reducer'
import web from './web_reducer'

// Reducer cannot return undefined
export default {
  // auth: () => { return {} }
  auth, photos, camera, gallery, litter, shared, settings, web
}
