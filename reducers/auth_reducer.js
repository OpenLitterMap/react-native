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
                const token = response.data.token;

                if (response.data?.user) {
                    if (__DEV__) {
                        console.log(
                            '[Auth] Registered with auto-generated username:',
                            response.data.user.username
                        );
                    }
                }

                const userResult = await dispatch(fetchUser(token));
                if (userResult.meta?.requestStatus === 'rejected') {
                    dispatch(logout());
                    return rejectWithValue('Account created but session failed. Please log in.');
                }

                return token;
            }

            return rejectWithValue('Registration failed — no token received');
        } catch (error) {
            if (error.response) {
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
                const token = response.data.token;

                const userResult = await dispatch(fetchUser(token));
                if (userResult.meta?.requestStatus === 'rejected') {
                    dispatch(logout());
                    return rejectWithValue('Login succeeded but session failed. Please try again.');
                }

                return token;
            } else {
                return rejectWithValue('Login failed');
            }
        } catch (error) {
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
                if (action.payload) {
                    state.token = action.payload;
                }
                state.submitStatus = 'idle';
            })
            .addCase(createAccount.rejected, (state, action) => {
                state.submitStatus = 'idle';
                state.serverStatusText = action.payload;
            })

            // Fetch User Profile (GET /api/user/profile/index)
            // Response is nested: { user, stats, level, rank, global_stats, achievements, locations, team }
            // We flatten into a single state object that screens expect.
            .addCase(fetchUser.fulfilled, (state, action) => {
                const data = action.payload;

                const profile = data.user || {};
                const stats = data.stats || {};
                const levelData = data.level || {};
                const rankData = data.rank || {};

                const user = {
                    // Core user fields (includes settings like show_name, picked_up, etc.)
                    ...profile,

                    // Stats
                    totalImages: stats.uploads || 0,
                    totalTags: stats.tags ?? stats.litter ?? 0,
                    totalLittercoin: stats.littercoin || 0,
                    xp: stats.xp || 0,
                    streak: stats.streak || 0,

                    // Level
                    level: levelData.level || 0,
                    levelTitle: levelData.title || '',
                    levelProgress: levelData.progress_percent || 0,
                    xpToNextLevel: levelData.xp_remaining || 0,

                    // Rank → flat field names (null = not ranked)
                    position: rankData.global_position ?? null,
                    percentile: rankData.percentile ?? null,

                    // Team
                    active_team: data.team?.id || null,
                    team: data.team || null,

                    // New data from profile/index
                    achievements: data.achievements || null,
                    locations: data.locations || null
                };

                state.user = user;
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
                state.token = action.payload;
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
