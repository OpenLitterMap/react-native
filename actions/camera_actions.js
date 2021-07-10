import React from 'react';
import { SET_GPS_COORDINATES } from './types';

export const setLocation = (lat, lon) => {
  return {
    type: SET_GPS_COORDINATES,
    payload: { lat, lon }
  };
};
