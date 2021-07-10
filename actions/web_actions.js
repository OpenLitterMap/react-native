import React from 'react';
import {
    ADD_TAGS_TO_WEB_IMAGE,
    LOAD_MORE_WEB_IMAGES,
    REMOVE_WEB_IMAGE,
    WEB_CONFIRM,
    WEB_INDEX_CHANGED,
    WEB_IMAGES,
    URL
} from './types';
import axios from 'axios';

/**
 * Apply these tags to one of the web images
 */
export const addTagsToWebImage = (data) => {
    return {
        type: ADD_TAGS_TO_WEB_IMAGE,
        payload: data
    };
}

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
export const checkForImagesOnWeb = (token) => {

    return dispatch => {
        return axios({
            url: URL + '/api/v2/photos/web/index',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + token
            }
        })
        .then(resp => {
            // console.log('images_from_web', resp.data.photos);

            if (resp.data.photos)
            {
                // Todo - load Tags: {} with the data
                let photos = (resp.data.photos)
                    ? resp.data.photos
                    : null;

                photos = photos.map(photo => {
                    photo.tags = {};
                    return photo;
                });

                // if photos is null, pass empty array
                dispatch({ type: WEB_IMAGES, payload: {
                    count: resp.data.count,
                    photos
                }});
            }
        })
        .catch(err => {
            console.log('checkForImagesOnWeb', err.response.data);
        });
    }
}

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

            if (resp.data)
            {
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
    }
};

/**
 * User has clicked Confirm on LitterPicker
 * Post to server and return 200
 */
export const confirmWebPhoto = data => {
    return dispatch => {
        return axios({
            url: URL + '/api/photos/update',
            method: 'POST',
            headers: {
                Authorization: 'Bearer ' + data.token
            },
            data: {
                photo_id: data.id,
                litter: data.tags
            }
        })
        .then(response => {
            console.log('confirmWebPhoto', response.data);

            if (response.data.success)
            {

            }
        })
        .catch(err => {
            console.log({ err });
        });
    }
}

export const removeWebImage = id => {
    return {
        type: REMOVE_WEB_IMAGE,
        payload: id
    };
};

export const toggleWebImageSuccess = bool => {
    return {
        type: WEB_CONFIRM,
        payload: bool
    }
};

/**
 * The first web photo has been selected for tagging
 */
export const webIndexChanged = index => {
    return {
        type: WEB_INDEX_CHANGED,
        payload: index
    };
}
