import Config from 'react-native-config';

const OLM_ENDPOINT = Config.OLM_ENDPOINT;
const CURRENT_ENVIRONMENT = Config.CURRENT_ENVIRONMENT;

// disable sentry locally
export const IS_PRODUCTION = CURRENT_ENVIRONMENT === 'production';

let ENDPOINT = '';

if (CURRENT_ENVIRONMENT === 'production') {
    ENDPOINT = OLM_ENDPOINT;
} else if (CURRENT_ENVIRONMENT === 'local') {
    ENDPOINT = 'http://192.168.1.28:8000';
}

export const URL = ENDPOINT;
