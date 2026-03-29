import Config from 'react-native-config';

export const IS_PRODUCTION = Config.IS_PRODUCTION === 'true';

export const URL = IS_PRODUCTION
    ? Config.PRODUCTION_API_URL
    : Config.LOCAL_API_URL;

export const WEB_URL = IS_PRODUCTION
    ? Config.PRODUCTION_WEB_URL
    : Config.LOCAL_WEB_URL;
