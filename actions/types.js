import Config from 'react-native-config';

const OLM_ENDPOINT = Config.OLM_ENDPOINT;
const LOCAL_OLM_ENDPOINT = Config.LOCAL_OLM_ENDPOINT;

const CURRENT_ENVIRONMENT = Config.CURRENT_ENVIRONMENT;

// change this when working locally to disable sentry
export const IS_PRODUCTION = CURRENT_ENVIRONMENT === 'production';

let ENDPOINT = '';

if (CURRENT_ENVIRONMENT === 'production') {
    ENDPOINT = OLM_ENDPOINT;
}
else if (CURRENT_ENVIRONMENT === 'local') {
    ENDPOINT = 'http://localhost:8000';
}

export const URL = ENDPOINT;
