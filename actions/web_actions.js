import { ADD_IMAGES, DELETE_IMAGE, LOAD_MORE_WEB_IMAGES, URL } from './types';
import axios from 'axios';

/**
 * FIXME: Currently this fn is not used  -- need to be added
 *
 * Backend sends first 100 images on /api/v2/photos/web/index
 * need to change it to first 10 and introduce loadMore fn.
 * and executed when the user swipes to their last image on swiper
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
