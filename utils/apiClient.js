import axios from 'axios';
import {URL} from './config';

/**
 * Authenticated API request helper.
 * Eliminates duplicated Bearer token / header setup across all reducers.
 *
 * Usage:
 *   const response = await api.get('/api/user/profile/index', { token });
 *   const response = await api.post('/api/v3/tags', { token, data: payload });
 *   const response = await api.put('/api/v3/tags', { token, data: payload });
 *   const response = await api.patch('/api/settings', { token, data: payload });
 *
 * For unauthenticated requests (no token):
 *   const response = await api.get('/api/global/stats-data');
 *
 * For FormData uploads:
 *   const response = await api.post('/api/v3/upload', {
 *       token,
 *       data: formData,
 *       headers: { 'Content-Type': 'multipart/form-data' },
 *       signal
 *   });
 */
/**
 * Per-endpoint timeout configuration.
 * Uploads need longer (large multipart on 3G).
 * Auth/profile should be fast.
 * Default covers general fetches.
 */
const TIMEOUT_MS = {
    upload: 120000,   // 2 min — large multipart on slow networks
    auth: 15000,      // 15s — login/register/validate should be fast
    default: 30000    // 30s — general API calls
};

const getTimeout = (path, options) => {
    // Caller can override with explicit timeout
    if (options.timeout) return options.timeout;
    // Upload endpoints
    if (path.includes('/upload')) return TIMEOUT_MS.upload;
    // Auth endpoints
    if (path.includes('/auth/') || path.includes('/validate-token') || path.includes('/password/')) return TIMEOUT_MS.auth;
    return TIMEOUT_MS.default;
};

const makeRequest = (method) => async (path, options = {}) => {
    const {token, data, params, signal, headers: extraHeaders} = options;

    const headers = {
        Accept: 'application/json',
        ...extraHeaders
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Default to JSON content type for POST/PUT/PATCH (unless overridden)
    if (data && !headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
    }

    return axios({
        url: `${URL}${path}`,
        method,
        headers,
        data,
        params,
        signal,
        timeout: getTimeout(path, options)
    });
};

const api = {
    get: makeRequest('GET'),
    post: makeRequest('POST'),
    put: makeRequest('PUT'),
    patch: makeRequest('PATCH'),
    delete: makeRequest('DELETE')
};

export default api;
