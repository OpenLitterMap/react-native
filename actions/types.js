// Import keys to authenticate with your Laravel backend
// See https://laravel.com/docs/8.x/passport#the-passportclient-command
import { SECRET_CLIENT } from '@env';
import { ID_CLIENT } from '@env';
import { OLM_ENDPOINT } from '@env';

export const IS_PRODUCTION = false; // change this when working locally to disable Sentry

export const CLIENT_ID = ID_CLIENT;
export const CLIENT_SECRET = SECRET_CLIENT;
export const URL = OLM_ENDPOINT;

export const TOGGLE_ACTIVITY_INDICATOR = 'TOGGLE_ACTIVITY_INDICATOR';

// Auth
export const ACCOUNT_CREATED = 'ACCOUNT_CREATED';
export const BAD_PASSWORD = 'BAD_PASSWORD';
export const CHANGE_LANG = 'CHANGE_LANG';
export const CHANGE_SERVER_STATUS_TEXT = 'CHANGE_SERVER_STATUS_TEXT;';
export const SUBMIT_START = 'SUBMIT_START';
export const SERVER_STATUS = 'SERVER_STATUS';
export const LOGIN_OR_SIGNUP_RESET = 'LOGIN_OR_SIGNUP_RESET';
export const EMAIL_CHANGED = 'EMAIL_CHANGED';
export const EMAIL_INCORRECT = 'EMAIL_INCORRECT';
export const EMAIL_VALID = 'EMAIL_VALID';
export const PASSWORD_INCORRECT = 'PASSWORD_INCORRECT';
export const PASSWORD_VALID = 'PASSWORD_VALID';
export const EMAIL_ERROR = 'EMAIL_ERROR';
export const PASSWORD_ERROR = 'PASSWORD_ERROR';
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS';
export const LOGIN_FAIL = 'LOGIN_FAIL';
export const SIGNUP_SUCCESS = 'SIGNUP_SUCCESS';
export const SIGNUP_FAIL = 'SIGNUP_FAIL';
export const TOGGLE_USERNAME_MODAL = 'TOGGLE_USERNAME_MODAL';
export const TOKEN_IS_VALID = 'TOKEN_IS_VALID';
export const USERNAME_CHANGED = 'USERNAME_CHANGED';
export const USERNAME_ERROR = 'USERNAME_ERROR';

// Photos - Taken from OLM Camera
export const ADD_PHOTO = 'ADD_PHOTO';
export const ADD_TAGS_TO_CAMERA_PHOTO = 'ADD_TAGS_TO_CAMERA_PHOTO';
export const CLOSE_LITTER_MODAL = 'CLOSE_LITTER_MODAL';
export const CONFIRM_SESSION_TAGS = 'CONFIRM_SESSION_TAGS';
export const DELETE_SELECTED_PHOTO = 'DELETE_SELECTED_PHOTO'; // from current session
export const DELETE_SELECTED_GALLERY = 'DELETE_SELECTED_GALLERY'; // from camera roll
export const DESELECT_ALL_CAMERA_PHOTOS = 'DESELECT_ALL_CAMERA_PHOTOS';
export const LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE =
    'LOAD_CAMERA_PHOTOS_FROM_ASYNC_STORAGE';
export const PHOTOS_FROM_GALLERY = 'PHOTOS_FROM_GALLERY';
export const REMOVE_TAG_FROM_CAMERA_PHOTO = 'REMOVE_TAG_FROM_CAMERA_PHOTO';
export const TOGGLE_SELECTED_PHOTO = 'TOGGLE_SELECTED_PHOTO';

export const DECREMENT_SELECTED = 'DECREMENT_SELECTED';
export const TOGGLE_IMAGES_LOADING = 'TOGGLE_IMAGES_LOADING';
export const INCREMENT_SELECTED = 'INCREMENT_SELECTED';

export const LOGOUT = 'LOGOUT';
export const USER_FOUND = 'USER_FOUND';
export const UPLOAD_PHOTOS = 'UPLOAD_PHOTOS';
export const UPDATE_PERCENT = 'UPDATE_PERCENT';
export const UPDATE_COUNT_REMAINING = 'UPDATE_COUNT_REMAINING';
export const UPDATE_COUNT_TOTAL = 'UPDATE_COUNT_TOTAL';
export const UPLOAD_COMPLETE_SUCCESS = 'UPLOAD_COMPLETE_SUCCESS';

export const TOGGLE_MODAL = 'TOGGLE_MODAL';
export const TOGGLE_LITTER = 'TOGGLE_LITTER';
export const TOGGLE_THANK_YOU = 'TOGGLE_THANK_YOU';
export const TOGGLE_UPLOAD = 'TOGGLE_UPLOAD';
export const TOGGLE_SELECTING = 'TOGGLE_SELECTING';

export const INCREMENT = 'INCREMENT';
export const ITEM_SELECTED = 'ITEM_SELECTED';

// CAMERA / PHOTOS (camera_photos)
export const CAMERA_PHOTO_UPLOADED_SUCCESSFULLY =
    'CAMERA_PHOTO_UPLOADED_SUCCESSFULLY';
export const SET_GPS_COORDINATES = 'SET_GPS_COORDINATES';

// gallery
export const ADD_GEOTAGGED_IMAGES = 'ADD_GEOTAGGED_IMAGES';
export const ADD_TAGS_TO_GALLERY_IMAGE = 'ADD_TAGS_TO_GALLERY_IMAGE';
export const CHANGE_UPLOAD_PROGRESS = 'CHANGE_UPLOAD_PROGRESS';
export const DELETE_GALLERY_UPLOAD_SUCCESS = 'DELETE_GALLERY_UPLOAD_SUCCESS';
export const DESELECT_ALL_GALLERY_PHOTOS = 'DESELECT_ALL_GALLERY_PHOTOS';
export const REMOVE_ALL_SELECTED_GALLERY = 'REMOVE_ALL_SELECTED_GALLERY';
export const REMOVE_TAG_FROM_GALLERY_PHOTO = 'REMOVE_TAG_FROM_GALLERY_PHOTO';
export const TOGGLE_IMAGE_BROWSER = 'TOGGLE_IMAGE_BROWSER';
export const TOGGLE_SELECTED_GALLERY = 'TOGGLE_SELECTED_GALLERY';
export const GALLERY_UPLOADED_SUCCESSFULLY = 'GALLERY_UPLOADED_SUCCESSFULLY';

// Litter, Tags
export const ADD_PREVIOUS_TAG = 'ADD_PREVIOUS_TAG';
export const CHANGE_CATEGORY = 'CHANGE_CATEGORY';
export const CHANGE_PHOTO_TYPE = 'CHANGE_PHOTO_TYPE;';
export const CHANGE_ITEM = 'CHANGE_ITEM';
export const CHANGE_Q = 'CHANGE_Q';
export const CONFIRM_FOR_UPLOAD = 'CONFIRM_FOR_UPLOAD';
export const CHANGE_SWIPER_INDEX = 'CHANGE_SWIPER_INDEX';
export const REMOVE_PREVIOUS_TAG = 'REMOVE_PREVIOUS_TAG';
export const REMOVE_TAG = 'REMOVE_TAG';
export const RESET_LITTER_STATE = 'RESET_LITTER_STATE';
export const RESET_TAGS = 'RESET_TAGS';
export const SAVE_PREVIOUS_TAGS = 'SAVE_PREVIOUS_TAGS';
export const SHOW_ALL_TAGS = 'SHOW_ALL_TAGS';
export const SHOW_INNER_MODAL = 'SHOW_INNER_MODAL';
export const SUGGEST_TAGS = 'SUGGEST_TAGS';
export const TOGGLE_SWITCH = 'TOGGLE_SWITCH';
export const UPDATE_PREVIOUS_TAGS = 'UPDATE_PREVIOUS_TAGS';
export const UPDATE_TAGS = 'UPDATE_TAGS';
export const UPDATE_TAGS_X_POS = 'UPDATE_TAGS_X_POS';
export const UPDATE_QUANTITY = 'UPDATE_QUANTITY';

// Settings
export const CLOSE_ALL_SETTINGS_MODALS = 'CLOSE_ALL_SETTINGS_MODALS';
export const CLOSE_SECOND_SETTING_MODAL = 'CLOSE_SECOND_SETTING_MODAL';
export const SAVE_SETTING = 'SAVE_SETTING';
export const SET_MODEL = 'SET_MODEL';
export const SETTINGS_INIT = 'SETTINGS_INIT';
// export const SETTINGS_UPDATE_SUCCESS = 'SETTINGS_UPDATE_SUCCESS'; // not used
// export const SETTINGS_UPDATE_ERROR = 'SETTINGS_UPDATE_ERROR'; // not used
export const SETTINGS_UPDATE_STATUS_MESSAGE = 'SETTINGS_UPDATE_STATUS_MESSAGE';
export const START_UPDATING_SETTINGS = 'START_UPDATING_SETTINGS';
export const TOGGLE_SETTINGS_MODAL = 'TOGGLE_SETTINGS_MODAL';
export const TOGGLE_SETTINGS_SWITCH = 'TOGGLE_SETTINGS_SWITCH';
export const TOGGLE_SETTINGS_WAIT = 'TOGGLE_SETTINGS_WAIT';
export const TOGGLE_SECOND_SETINGS_MODAL = 'TOGGLE_SECOND_SETINGS_MODAL';
export const UPDATE_SETTINGS_PROP = 'UPDATE_SETTINGS_PROP';
export const UPDATE_USER_OBJECT = 'UPDATE_USER_OBJECT';
export const STORE_CURRENT_APP_VERSION = 'STORE_CURRENT_APP_VERSION';
export const ON_SEEN_FEATURE_TOUR = 'ON_SEEN_FEATURE_TOUR';

// Shared

// Web data
export const ADD_TAGS_TO_WEB_IMAGE = 'ADD_TAGS_TO_WEB_IMAGE';
export const DELETE_SELECTED_WEB_IMAGES = 'DELETE_SELECTED_WEB_IMAGES';
export const LOAD_MORE_WEB_IMAGES = 'LOAD_MORE_WEB_IMAGES';
export const INCREMENT_WEB_IMAGES_UPLOADED = 'INCREMENT_WEB_IMAGES_UPLOADED';
export const REMOVE_WEB_IMAGE = 'REMOVE_WEB_IMAGE';
export const WEB_IMAGES = 'WEB_IMAGES';

// Stats

export const STATS_REQUEST_SUCCESS = 'STATS_REQUEST_SUCCESS';
export const STATS_REQUEST_ERROR = 'STATS_REQUEST_ERROR';
