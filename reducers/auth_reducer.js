import * as Sentry from '@sentry/react-native';
import {createAsyncThunk, createSlice} from '@reduxjs/toolkit';
import api from '../utils/apiClient';

const initialState = {
    submitStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    token: null,
    user: null,
    serverStatusText: ''
};

/**
 * Build flattened user object from profile response data.
 * Shared by fetchUser.fulfilled, userLogin.fulfilled, and createAccount.fulfilled.
 *
 * Input shape (enriched login/register response):
 *   { user, stats: { uploads, tags, xp, littercoin },
 *     level: { level, title, xp, xp_into_level, xp_for_next, xp_remaining, progress_percent },
 *     rank: { global_position, global_total, percentile },
 *     team: { id, name } | null }
 *
 * Fields intentionally excluded from enriched response (not needed by mobile UI):
 *   achievements, locations, global_stats, stats.streak
 */
const buildUserFromProfile = (data) => {
    const profile = data.user || {};
    const stats = data.stats || {};
    const levelData = data.level || {};
    const rankData = data.rank || {};

    return {
        ...profile,

        // Stats
        totalImages: stats.uploads || 0,
        totalTags: stats.tags ?? stats.litter ?? 0,
        totalLittercoin: stats.littercoin || 0,
        xp: stats.xp || 0,

        // Level
        level: levelData.level || 0,
        levelTitle: levelData.title || '',
        levelProgress: levelData.progress_percent || 0,
        xpToNextLevel: levelData.xp_remaining || 0,

        // Rank (null = not ranked)
        position: rankData.global_position ?? null,
        percentile: rankData.percentile ?? null,

        // Team
        active_team: data.team?.id || null,
        team: data.team || null
    };
};

/**
 * API List
 *
 * 1. checkValidToken
 * 2. createUser
 * 3. fetchUser
 * 4. sendResetPasswordRequest
 * 4. userLogin
 */

/**
 * Check if the token is valid
 *
 * The response will return "valid" if the user is logged in
 * Or  "Unauthenticated." if they are logged out / not valid
 */
export const checkValidToken = createAsyncThunk(
    'auth/checkValidToken',
    async (jwt, {rejectWithValue, dispatch}) => {
        try {
            const response = await api.post('/api/validate-token', {token: jwt});

            if (
                response.data.hasOwnProperty('message') &&
                response.data.message === 'valid'
            ) {
                const userResult = await dispatch(fetchUser(jwt));
                if (userResult.meta?.requestStatus === 'rejected') {
                    dispatch(logout());
                    return rejectWithValue('Session expired');
                }
                return jwt;
            } else {
                dispatch(logout());
                return rejectWithValue('Token invalid');
            }
        } catch (error) {
            dispatch(logout());
            return rejectWithValue('Please login again.');
        }
    }
);

export const createAccount = createAsyncThunk(
    'auth/createAccount',
    async ({email, password}, {rejectWithValue, dispatch}) => {
        try {
            const response = await api.post('/api/auth/register', {
                data: {email, password}
            });

            if (response.data?.token) {
                const {token, ...profileData} = response.data;

                if (profileData.user) {
                    if (__DEV__) {
                        console.log(
                            '[Auth] Registered with auto-generated username:',
                            profileData.user.username
                        );
                    }
                }

                // Enriched response — no second request needed
                if (profileData.stats) {
                    Sentry.setUser({
                        id: profileData.user?.id,
                        email: profileData.user?.email
                    });

                    return {token, profile: profileData};
                }

                // Legacy response — fetch profile separately
                const userResult = await dispatch(fetchUser(token));
                if (userResult.meta?.requestStatus === 'rejected') {
                    dispatch(logout());
                    return rejectWithValue('Account created but session failed. Please log in.');
                }

                return {token, profile: null};
            }

            return rejectWithValue('Registration failed — no token received');
        } catch (error) {
            if (error.response) {
                if (error.response.status === 429) {
                    return rejectWithValue(
                        'Too many attempts. Please wait a minute and try again.'
                    );
                }

                const errorData = error.response.data.errors;

                if (errorData) {
                    if (errorData.email) {
                        return rejectWithValue(errorData.email[0]);
                    }
                    if (errorData.password) {
                        return rejectWithValue(errorData.password[0]);
                    }
                }

                return rejectWithValue(
                    error.response.data?.message ||
                        'Something went wrong, please try again'
                );
            } else {
                return rejectWithValue(
                    'Network error, please check your internet connection.'
                );
            }
        }
    }
);

/**
 * Fetch user profile with retry for transient failures.
 * Retries up to 2 times with backoff for timeout/network/5xx errors.
 * 401 errors are NOT retried — they indicate an invalid session.
 */
export const fetchUser = createAsyncThunk(
    'auth/fetchUser',
    async (tokenOverride, {getState, rejectWithValue}) => {
        const token = tokenOverride || getState().auth.token;
        const MAX_RETRIES = 2;
        const BACKOFF_MS = [1000, 3000];

        const isTransient = error => {
            if (error.code === 'ECONNABORTED') {
                return true; // timeout
            }
            if (!error.response) {
                return true; // network error
            }
            return error.response.status >= 500; // server error
        };

        let lastError;
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                const response = await api.get('/api/user/profile/index', {token});

                if (response.status === 200 && response.data) {
                    Sentry.setUser({
                        id: response.data.user?.id,
                        email: response.data.user?.email
                    });

                    return response.data;
                } else {
                    return rejectWithValue({
                        message: 'User fetch failed',
                        isAuthError: false
                    });
                }
            } catch (error) {
                lastError = error;
                const status = error.response?.status;

                // 401 = invalid session, don't retry
                if (status === 401) {
                    return rejectWithValue({
                        message: 'Session expired',
                        isAuthError: true
                    });
                }

                // Transient error — retry with backoff
                if (isTransient(error) && attempt < MAX_RETRIES) {
                    await new Promise(r => setTimeout(r, BACKOFF_MS[attempt]));
                    continue;
                }

                // Non-transient or retries exhausted
                return rejectWithValue({
                    message:
                        error.response?.data?.message ||
                        error.message ||
                        'Network error, please try again',
                    isAuthError: false
                });
            }
        }

        return rejectWithValue({
            message: lastError?.message || 'Failed to load profile',
            isAuthError: false
        });
    }
);

export const sendResetPasswordRequest = createAsyncThunk(
    'user/sendResetPasswordRequest',
    async (email, {rejectWithValue}) => {
        try {
            const response = await api.post('/api/password/email', {
                data: {email}
            });

            return response.data;
        } catch (error) {
            if (error.response) {
                return rejectWithValue('Error, please try again');
            } else {
                return rejectWithValue('Network error, please try again');
            }
        }
    }
);

export const userLogin = createAsyncThunk(
    'auth/userLogin',
    async ({login, password}, {rejectWithValue, dispatch}) => {
        try {
            const identifier = login.trim().includes('@')
                ? login.trim().toLowerCase()
                : login.trim();

            const data = {identifier, password};

            const response = await api.post('/api/auth/token', {data});

            if (response.status === 200) {
                const {token, ...profileData} = response.data;

                // Enriched response includes full profile — no second request needed.
                // Fallback to fetchUser if backend hasn't been updated yet.
                if (profileData.stats) {
                    Sentry.setUser({
                        id: profileData.user?.id,
                        email: profileData.user?.email
                    });

                    return {token, profile: profileData};
                }

                // Legacy response: { token, user } — fetch profile separately
                const userResult = await dispatch(fetchUser(token));
                if (userResult.meta?.requestStatus === 'rejected') {
                    dispatch(logout());
                    return rejectWithValue('Login succeeded but session failed. Please try again.');
                }

                return {token, profile: null};
            } else {
                return rejectWithValue('Login failed');
            }
        } catch (error) {
            const status = error.response?.status;

            if (status === 429) {
                return rejectWithValue(
                    'Too many login attempts. Please wait a minute and try again.'
                );
            }

            return rejectWithValue(
                error.response?.data?.message ||
                    error.message ||
                    'Network error, please try again'
            );
        }
    }
);

const authSlice = createSlice({
    name: 'auth',

    initialState,

    reducers: {
        changeUsersActiveTeam(state, action) {
            if (state.user) {
                state.user.active_team = action.payload;
            }
        },

        clearStatusText(state) {
            state.serverStatusText = '';
        },

        /**
         * Logout user — reset state to initial.
         * Pure reducer — no side effects. redux-persist handles storage cleanup
         * when auth slice rehydrates as initialState.
         */
        logout() {
            return initialState;
        },

        /**
         * Resets the auth form and display messages
         */
        loginOrSignupReset(state) {
            state.submitStatus = 'idle';
            state.serverStatusText = '';
        },

        /**
         * Update user object after userdata changed from settings
         */
        updateUserObject(state, action) {
            state.user = action.payload;
        }
    },

    extraReducers: builder => {
        builder

            // Check Valid Token
            .addCase(checkValidToken.fulfilled, (state, action) => {
                if (action.payload) {
                    state.token = action.payload;
                }
            })
            .addCase(checkValidToken.rejected, state => {
                state.token = null;
            })

            // Create Account
            .addCase(createAccount.pending, state => {
                state.serverStatusText = '';
                state.submitStatus = 'loading';
            })
            .addCase(createAccount.fulfilled, (state, action) => {
                const {token, profile} = action.payload;
                state.token = token;
                if (profile) {
                    state.user = buildUserFromProfile(profile);
                }
                state.submitStatus = 'idle';
            })
            .addCase(createAccount.rejected, (state, action) => {
                state.submitStatus = 'idle';
                state.serverStatusText = action.payload;
            })

            // Fetch User Profile (GET /api/user/profile/index)
            // Used on app resume (via checkValidToken) and profile refresh.
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = buildUserFromProfile(action.payload);
                state.submitStatus = 'idle';
            })
            .addCase(fetchUser.rejected, (state, action) => {
                const payload = action.payload || {};
                state.serverStatusText =
                    payload.message || 'Failed to load profile';
                state.submitStatus = 'idle';

                // Only clear session on auth errors (401).
                // Transient failures (timeout, network, 5xx) keep the token
                // so the user isn't force-logged-out by a network blip.
                if (payload.isAuthError) {
                    state.token = null;
                    state.user = null;
                }
            })

            // Send Reset Password Request
            .addCase(sendResetPasswordRequest.pending, state => {
                state.submitStatus = 'loading';
            })
            .addCase(sendResetPasswordRequest.fulfilled, state => {
                state.submitStatus = 'idle';
                state.serverStatusText =
                    'An email will be sent if the address exists';
            })
            .addCase(sendResetPasswordRequest.rejected, state => {
                state.serverStatusText =
                    'An email will be sent if the address exists';
                state.submitStatus = 'idle';
            })

            // User Login
            .addCase(userLogin.pending, state => {
                state.submitStatus = 'loading';
            })
            .addCase(userLogin.fulfilled, (state, action) => {
                const {token, profile} = action.payload;
                state.token = token;
                // Enriched response — build user inline (no fetchUser needed)
                if (profile) {
                    state.user = buildUserFromProfile(profile);
                }
                // Legacy response — user was set by fetchUser.fulfilled
                state.submitStatus = 'idle';
            })
            .addCase(userLogin.rejected, (state, action) => {
                state.serverStatusText = action.payload || 'Problem with login';
                state.submitStatus = 'idle';
            });
    }
});

export const {
    changeUsersActiveTeam,
    clearStatusText,
    logout,
    loginOrSignupReset,
    updateUserObject
} = authSlice.actions;

// Selectors
export const selectIsSubmitting = state => state.auth.submitStatus === 'loading';
export const selectUser = state => state.auth.user;
export const selectToken = state => state.auth.token;

export default authSlice.reducer;
