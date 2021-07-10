import { SET_GPS_COORDINATES } from '../actions/types';

const INITIAL_STATE = {
  lat: null,
  lon: null
};

export default function(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_GPS_COORDINATES:
      return {
        ...state,
        lat: action.payload.lat,
        lon: action.payload.lon
      };

    default:
      return state;
  }
}
