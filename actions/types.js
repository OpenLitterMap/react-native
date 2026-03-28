import Config from 'react-native-config';

const OLM_ENDPOINT = Config.OLM_ENDPOINT;
const LOCAL_OLM_ENDPOINT = Config.LOCAL_OLM_ENDPOINT;
export const IS_PRODUCTION = process.env.IS_PRODUCTION === 'true';

const ENDPOINT = IS_PRODUCTION ? OLM_ENDPOINT : LOCAL_OLM_ENDPOINT;

export const URL = ENDPOINT;
