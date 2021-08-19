import React from 'react';
import CameraRoll from '@react-native-community/cameraroll';

import {
    ADD_TAGS_TO_GALLERY_IMAGE,
    DELETE_SELECTED_GALLERY,
    DESELECT_ALL_GALLERY_PHOTOS,
    GALLERY_UPLOADED_SUCCESSFULLY,
    TOGGLE_IMAGES_LOADING,
    PHOTOS_FROM_GALLERY,
    REMOVE_TAG_FROM_GALLERY_PHOTO,
    TOGGLE_IMAGE_BROWSER,
    TOGGLE_SELECTED_GALLERY,
    ADD_GEOTAGGED_IMAGES
} from './types';

/**
 * Create or Update tags on a gallery image
 */
export const addTagsToGalleryImage = tags => {
    return {
        type: ADD_TAGS_TO_GALLERY_IMAGE,
        payload: tags
    };
};

/**
 * Delete selected gallery / camera roll photo
 */
export const deleteSelectedGallery = photo => {
    return {
        type: DELETE_SELECTED_GALLERY,
        payload: photo
    };
};

/**
 * Change selected => false on all gallery photos
 */
export const deselectAllGalleryPhotos = () => {
    return {
        type: DESELECT_ALL_GALLERY_PHOTOS
    };
};

/**
 * A Gallery Index has been uploaded successfully! - can be deleted.
 */
export const galleryPhotoUploadedSuccessfully = index => {
    return {
        type: GALLERY_UPLOADED_SUCCESSFULLY,
        payload: index
    };
};

/**
 * Toggle ActivityIndicator when Photo Albums are finished / loading
 */
export const setImagesLoading = bool => {
    return {
        type: TOGGLE_IMAGES_LOADING,
        payload: bool
    };
};

/**
 * get photos from camera roll
 */

/**
 * initial load -- Home Page -- fetch 1000
 *      sets state -- array of geotaggged
 *                 -- camerarollImageFetched - true
 *                 -- lastFetchTime
 *
 * Album page -- array of geotagged.length === 0 && camerarollImageFetched == false
 *          fetch first 1000
 * else
 *          dont fetch -- button for try again "refetch"
 *
 * gallery page - fetch between date.now and lastFetchTime
 * on scroll end fetch next 1000 and so on till next_page is false
 */

export const getPhotosFromCameraroll = () => async (dispatch, getState) => {
    const {
        gallery,
        geotaggedImages,
        camerarollImageFetched,
        lastFetchTime,
        imagesLoading
    } = getState().gallery;
    let id = gallery?.length === 0 ? 0 : gallery[gallery?.length - 1].id + 1;

    let camerarollData;
    let fetchType = 'INITIAL';

    if (imagesLoading) {
        return;
    }
    dispatch({
        type: TOGGLE_IMAGES_LOADING,
        payload: true
    });
    const timeParams = {
        first: 1000,
        toTime: Math.floor(new Date().getTime()),
        // toTime: 1627819113000,
        fromTime: lastFetchTime,
        // fromTime: 1626782313000
        include: ['location', 'filename', 'fileSize', 'imageSize']
    };
    const initialParams = {
        // initially get first 100 images
        first: 1000,
        // toTime: 1627819113000,
        // fromTime: 1626782313000
        // groupTypes: 'SavedPhotos',
        // assetType: 'Photos',
        include: ['location', 'filename', 'fileSize', 'imageSize']
    };
    if (
        geotaggedImages?.length === 0 &&
        camerarollImageFetched === false &&
        lastFetchTime === null
    ) {
        console.log('INITIAL');
        camerarollData = await CameraRoll.getPhotos(initialParams);
        fetchType = 'INITIAL';
        // console.log(camerarollData);
    }
    if (lastFetchTime !== null) {
        console.log('TIME');
        camerarollData = await CameraRoll.getPhotos(timeParams);
        fetchType = 'TIME';
    }

    // const camerarollData = await CameraRoll.getPhotos(params);

    if (camerarollData) {
        const imagesArray = camerarollData.edges;
        let geotagged = [];

        imagesArray.map(item => {
            id++;

            if (
                item.node?.location !== undefined &&
                item.node?.location?.longitude !== undefined &&
                item.node?.location?.latitude !== undefined
            ) {
                geotagged.push({
                    id,
                    filename: item.node.image.filename, // this will get hashed on the backend
                    uri: item.node.image.uri,
                    size: item.node.image.fileSize,
                    height: item.node.image.height,
                    width: item.node.image.width,
                    lat: item.node.location.latitude,
                    lon: item.node.location.longitude,
                    timestamp: item.node.timestamp,
                    selected: false,
                    picked_up: false,
                    tags: {},
                    type: 'gallery'
                });
            }
        });

        console.log(`geotagged length ${geotagged?.length}`);

        dispatch({
            type: 'ADD_GEOTAGGED_IMAGES',
            payload: { geotagged, fetchType }
        });
    }
};
/**
 * Add selected photos from gallery to redux
 */
export const photosFromGallery = photos => {
    return {
        type: PHOTOS_FROM_GALLERY,
        payload: photos
    };
};

/**
 * A tag has been selected from a gallery photo
 */
export const removeTagFromGalleryPhoto = data => {
    return {
        type: REMOVE_TAG_FROM_GALLERY_PHOTO,
        payload: data
    };
};

/**
 * Open or Close the Gallery Image Picker
 */
export const toggleImageBrowser = () => {
    return {
        type: TOGGLE_IMAGE_BROWSER
    };
};

/**
 * Toggle the value of a photo.selected
 */
export const toggleSelectedGallery = index => {
    return {
        type: TOGGLE_SELECTED_GALLERY,
        payload: index
    };
};

export const addGeotaggedImages = data => {
    return {
        type: ADD_GEOTAGGED_IMAGES,
        payload: data
    };
};
