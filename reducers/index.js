import { combineReducers } from '@reduxjs/toolkit';

import auth from './auth_reducer';
import gallery from './gallery_reducer';
import images from './images_reducer';
import my_uploads_reducer from "./my_uploads_reducer";
import leaderboard from './leaderboards_reducer';
import locations from './locations_reducer';
import shared from './shared_reducer';
import settings from './settings_reducer';
import stats from './stats_reducer';
import tags from './tags_reducer';
import teams from './team_reducer';

export const rootReducer = combineReducers({
    auth,
    gallery,
    images,
    my_uploads_reducer,
    leaderboard,
    locations,
    shared,
    settings,
    stats,
    tags,
    teams
});
