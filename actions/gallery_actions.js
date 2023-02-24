import React from 'react';
import CameraRoll from '@react-native-community/cameraroll';

import { ADD_GEOTAGGED_IMAGES, TOGGLE_IMAGES_LOADING } from './types';
import { isGeotagged } from '../utils/isGeotagged';

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
 * @param {string} - fetchType --> "INITIAL" | "TIME" | "LOAD"
 * "INITIAL" -> first load
 * "TIME" -> images added to cameraroll/phone gallery after initial load
 * "LOAD" -> loads more images on scroll after initial load
 */

export const getPhotosFromCameraroll = (fetchType = 'INITIAL') => async (
    dispatch,
    getState
) => {
    const {
        geotaggedImages,
        camerarollImageFetched,
        lastFetchTime,
        imagesLoading,
        isNextPageAvailable,
        lastImageCursor
    } = getState().gallery;
    const { user } = getState().auth;

    let id = geotaggedImages.length;

    let camerarollData;

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

        fromTime: lastFetchTime,
        assetType: 'Photos',
        include: ['location', 'filename', 'fileSize', 'imageSize']
    };
    const initialParams = {
        // initially get first 40 images
        first: 40,
        assetType: 'Photos',
        include: ['location', 'filename', 'fileSize', 'imageSize']
    };

    const loadParams = {
        first: 20,
        after: lastImageCursor,
        assetType: 'Photos',
        include: ['location', 'filename', 'fileSize', 'imageSize']
    };

    if (
        fetchType === 'LOAD' &&
        isNextPageAvailable &&
        lastImageCursor !== null
    ) {
        camerarollData = await CameraRoll.getPhotos(loadParams);
    } else {
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
    }

    if (camerarollData) {
        const imagesArray = camerarollData.edges;
        const {
            has_next_page: hasNextPage,
            end_cursor: endCursor
        } = camerarollData.page_info;
        let geotagged = [];
        imagesArray.map(item => {
            id++;

            let coordinates = {};
            if (
                item.node?.location !== undefined &&
                item.node?.location !== null &&
                item.node?.location?.longitude !== undefined &&
                item.node?.location?.longitude !== null &&
                item.node?.location?.latitude !== undefined &&
                item.node?.location?.latitude !== null
            ) {
                coordinates = {
                    lat: item.node.location?.latitude,
                    lon: item.node.location?.longitude
                };
            }
            geotagged.push({
                id,
                filename: item.node.image.filename, // this will get hashed on the backend
                uri: item.node.image.uri,
                size: item.node.image.fileSize,
                height: item.node.image.height,
                width: item.node.image.width,
                date: item.node.timestamp, // date -> unix/epoch timestamp
                selected: false,
                // lat: item.node.location?.latitude,
                // lon: item.node.location?.longitude,
                tags: {},
                type: 'gallery',
                ...coordinates,
                uploaded: false
            });
        });

        dispatch({
            type: ADD_GEOTAGGED_IMAGES,
            payload: { geotagged, fetchType, hasNextPage, endCursor }
        });
    }
};
