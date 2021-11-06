import React from 'react';
import CameraRoll from '@react-native-community/cameraroll';

import { ADD_GEOTAGGED_IMAGES, TOGGLE_IMAGES_LOADING } from './types';

/**
 * get photos from camera roll
 */

/**
 * initial load -- Home Page -- fetch 1000
 *      sets state -- array of geotaggged
 *                 -- camerarollImageFetched - true
 *                 -- lastFetchTime
 *
 * next fetch - Album screen or Home screen
 * if lastFetch !== null fetch images between lastFetch and Date.now()
 *
 */

export const getPhotosFromCameraroll = () => async (dispatch, getState) => {
    const {
        geotaggedImages,
        camerarollImageFetched,
        lastFetchTime,
        imagesLoading
    } = getState().gallery;
    let id = geotaggedImages.length;

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
        camerarollData = await CameraRoll.getPhotos(initialParams);
        fetchType = 'INITIAL';
    }
    if (lastFetchTime !== null) {
        camerarollData = await CameraRoll.getPhotos(timeParams);
        fetchType = 'TIME';
    }

    if (camerarollData) {
        const imagesArray = camerarollData.edges;
        let geotagged = [];

        imagesArray.map(item => {
            id++;

            if (
                item.node?.location !== undefined &&
                item.node?.location !== null &&
                item.node?.location?.longitude !== undefined &&
                item.node?.location?.longitude !== null &&
                item.node?.location?.latitude !== undefined &&
                item.node?.location?.latitude !== null
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
                    date: item.node.timestamp,
                    selected: false,
                    picked_up: false,
                    tags: {},
                    type: 'gallery'
                });
            }
        });

        dispatch({
            type: ADD_GEOTAGGED_IMAGES,
            payload: { geotagged, fetchType }
        });
    }
};
