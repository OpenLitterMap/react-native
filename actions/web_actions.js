import {
    ADD_IMAGE,
    ADD_TAGS_TO_WEB_IMAGE,
    LOAD_MORE_WEB_IMAGES,
    INCREMENT_WEB_IMAGES_UPLOADED,
    REMOVE_TAG_FROM_WEB_IMAGE,
    REMOVE_WEB_IMAGE,
    WEB_IMAGES,
    URL
} from './types';
import axios from 'axios';

/**
 * Apply these tags to one of the web images
 */
export const addTagsToWebImage = data => {
    return {
        type: ADD_TAGS_TO_WEB_IMAGE,
        payload: data
    };
};

export const removeTagFromWebImage = data => {
    return {
        type: REMOVE_TAG_FROM_WEB_IMAGE,
        payload: data
    };
};
/**
 * When LeftPage didMount, check web for any images
 *
 * if photo_id exists
 *   Load the next 10 images from the photo_id
 * else
 *   Load the first 10 images
 *
 * @return [id, filename]
 */
export const checkForImagesOnWeb = token => {
    return dispatch => {
        return axios({
            url: URL + '/api/v2/photos/web/index',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
            .then(resp => {
                console.log('RESPONSE: checkForImagesOnWeb', resp.data.photos);

                if (resp.data.photos) {
                    let photos = [];
                    photos = resp.data.photos ? resp.data.photos : null;

                    dispatch({
                        type: ADD_IMAGE,
                        payload: {
                            images: photos,
                            type: 'WEB'
                        }
                    });
                }
            })
            .catch(err => {
                console.log('checkForImagesOnWeb', err.response.data);
            });
    };
};

/**
 * Load the next 10 images on the web
 *
 * Executed when the user swipes to their last image on web_photos
 */
export const loadMoreWebImages = (token, photo_id) => {
    return dispatch => {
        return axios({
            url: URL + '/api/v2/photos/web/load-more',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            },
            params: { photo_id }
        })
            .then(resp => {
                console.log('load_more_web_images', resp.data);

                if (resp.data) {
                    let photos = resp.data;

                    photos = photos.map(photo => {
                        photo.tags = null;
                        return photo;
                    });

                    dispatch({
                        type: LOAD_MORE_WEB_IMAGES,
                        payload: {
                            photos
                        }
                    });
                }
            })
            .catch(err => {
                console.log('load_more_web_images', err.response.data);
            });
    };
};

/**
 * When the tags for a web image have been uploaded
 *
 * We increment this to update the counter that shows when uploading images
 *
 * @returns {{payload, type: string}}
 */
export const incrementWebImagesUploaded = () => {
    return {
        type: INCREMENT_WEB_IMAGES_UPLOADED
    };
};

export const removeWebImage = id => {
    return {
        type: REMOVE_WEB_IMAGE,
        payload: id
    };
};

/**
 * Delete selected web image
 * web image - image that are uploaded from web but not tagged
 */
export const deleteSelectedWebImages = (token, photoId) => {
    return dispatch => {
        return axios({
            url: URL + '/api/photos/delete',
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            params: { photoId }
        })
            .then(resp => {
                dispatch({
                    type: REMOVE_WEB_IMAGE,
                    payload: photoId
                });
            })
            .catch(err => {
                console.log('delete web image', err);
            });
    };
};
