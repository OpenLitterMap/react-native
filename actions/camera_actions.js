import React from 'react'
import {
    CAMERA_GRANTED_PERMISSION,
    CAMERA_NOT_GRANTED_PERMISSION,
    SET_GPS_COORDINATES,
    ZOOM_OUT,
    ZOOM_IN
} from './types'

export const grantCameraPermission = (status) => {
    if (status === "granted")
    {
        return {
            type: CAMERA_GRANTED_PERMISSION
        };
    }

    else
    {
        return {
            type: CAMERA_NOT_GRANTED_PERMISSION
        };
    }
}

export const setLocation = (lat, lon) => {
    return {
        type: SET_GPS_COORDINATES,
        payload: {lat, lon}
    };
}

export const zoomOut = () => {
    return {
        type: ZOOM_OUT
    };
}

export const zoomIn = () => {
    return {
        type: ZOOM_IN
    }
}
