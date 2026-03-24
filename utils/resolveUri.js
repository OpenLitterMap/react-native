import {URL, IS_PRODUCTION} from '../actions/types';

/**
 * Rewrite Minio 127.0.0.1 URLs to the LAN IP in dev builds.
 * In production, returns the URI unchanged.
 */
const resolveUri = uri => {
    if (!IS_PRODUCTION && uri?.includes('127.0.0.1')) {
        const match = URL.match(/:\/\/([^:/]+)/);
        if (match) {
            return uri.replace('127.0.0.1', match[1]);
        }
    }
    return uri;
};

export default resolveUri;
