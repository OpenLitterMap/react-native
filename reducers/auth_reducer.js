import axios from "axios";
import * as Sentry from "@sentry/react-native";
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { URL } from  '../actions/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
    appVersion: '',
    isSubmitting: false,
    token: null,
    user: null,
    serverStatusText: '',
    errors: {}
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
    async (jwt, { rejectWithValue, dispatch }) => {
        try {
            const response = await axios({
                url: `${URL}/api/validate-token`,
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${jwt}`,
                    Accept: 'application/json'
                }
            });

            if (response.data.hasOwnProperty('message') && response.data.message === 'valid') {
                dispatch(fetchUser(jwt));
                return jwt;
            } else {
                dispatch(logout());
                return rejectWithValue('Token invalid');
            }
        }
        catch (error) {
            return rejectWithValue('Please login again.');
        }
    }
);


export const createAccount = createAsyncThunk(
    'auth/createAccount',
    async ({ email, password }, { rejectWithValue, dispatch }) => {
        try
        {
            const response = await axios.post(`${URL}/api/register`, {
                email,
                password
            }, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.token) {
                const token = response.data.token;

                await AsyncStorage.setItem('jwt', token);

                if (response.data?.user) {
                    if (__DEV__) {
                        console.log('[Auth] Registered with auto-generated username:', response.data.user.username);
                    }
                }

                dispatch(fetchUser(token));

                return token;
            }

            return rejectWithValue('Registration failed — no token received');
        }
        catch (error)
        {
            if (error.response)
            {
                const errorData = error.response.data.errors;

                if (errorData) {
                    if (errorData.email) return rejectWithValue(errorData.email[0]);
                    if (errorData.password) return rejectWithValue(errorData.password[0]);
                }

                return rejectWithValue(error.response.data?.message || 'Something went wrong, please try again');
            }
            else {
                return rejectWithValue('Network error, please check your internet connection.');
            }
        }
    }
);


export const fetchUser = createAsyncThunk(
    'auth/fetchUser',
    async (token, { rejectWithValue }) => {
        try
        {
            const response = await axios({
                url: `${URL}/api/user/profile/index`,
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.status === 200 && response.data) {
                Sentry.setUser({
                    id: response.data.id,
                    email: response.data?.email,
                });

                return response.data;
            } else {
                return rejectWithValue('User fetch failed');
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Network error, please try again');
        }
    }
);


export const sendResetPasswordRequest = createAsyncThunk(
    'user/sendResetPasswordRequest',
    async (email, { rejectWithValue }) => {
        try
        {
            const response = await axios.post(`${URL}/api/password/email`, {
                email
            }, {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            return response.data;
        }
        catch (error)
        {
            if (error.response) {
                // Log the error and return a rejected value with an error message
                // console.log('sendResetPasswordRequest', error.response.data);
                return rejectWithValue('Error, please try again');
            } else {
                // console.log('sendResetPasswordRequest', error);
                return rejectWithValue('Network error, please try again');
            }
        }
    }
);


export const userLogin = createAsyncThunk(
    'auth/userLogin',
    async ({ login, password }, { rejectWithValue, dispatch }) => {
        try
        {
            const identifier = login.trim().includes('@')
                ? login.trim().toLowerCase()
                : login.trim();

            const data = { identifier, password };

            const response = await axios({
                url: `${URL}/api/auth/token`,
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                data
            });

            if (response.status === 200)
            {
                const token = response.data.token;

                try
                {
                    await AsyncStorage.setItem('jwt', token);
                }
                catch (error)
                {
                    return rejectWithValue('Unable to save token to asyncstore');
                }

                dispatch(fetchUser(token));

                return token;
            } else {
                return rejectWithValue('Login failed');
            }
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || error.message || 'Network error, please try again');
        }
    }
);

const authSlice = createSlice({

    name: 'auth',

    initialState,

    reducers: {

        changeUsersActiveTeam (state, action) {
            state.user.active_team = action.payload;
        },

        clearStatusText (state) {
            state.serverStatusText = '';
        },

        /**
         * Logout user
         * reset state to initial
         */
        logout () {
            AsyncStorage.removeItem('jwt');
            AsyncStorage.removeItem('user');

            return initialState;
        },

        /**
         * Resets the auth form and display messages
         */
        loginOrSignupReset (state) {
            state.isSubmitting = false;
            state.serverStatusText = '';
        },

        /**
         * Update user object after userdata changed from settings
         */
        updateUserObject (state, action) {
            state.user = action.payload;
        }
    },

    extraReducers: (builder) => {

        builder

            // Check Valid Token
            .addCase(checkValidToken.fulfilled, (state, action) => {
                if (action.payload) {
                    state.token = action.payload;
                }
            })
            .addCase(checkValidToken.rejected, (state) => {
                state.token = null;
            })

            // Create Account
            .addCase(createAccount.pending, (state) => {
                state.serverStatusText = "";
                state.isSubmitting = true;
            })
            .addCase(createAccount.fulfilled, (state, action) => {
                if (action.payload) {
                    state.token = action.payload;
                }
                state.isSubmitting = false;
            })
            .addCase(createAccount.rejected, (state, action) => {
                state.isSubmitting = false;
                state.serverStatusText = action.payload;
            })


            // Fetch User Profile
            .addCase(fetchUser.fulfilled, (state, action) => {

                const data = action.payload;
                const levelData = data.level || {};

                const user = {
                    ...data,
                    level: levelData.level || 0,
                    levelTitle: levelData.title || '',
                    xp_redis: levelData.xp || data.stats?.xp || 0,
                    xpRequired: levelData.xp_remaining || 0,
                    targetPercentage: levelData.progress_percent || 0,
                    totalTags: data.total_tags,
                    totalLittercoin: (data.littercoin_allowance || 0) + (data.littercoin_owed || 0)
                };

                AsyncStorage.setItem('user', JSON.stringify(user));

                state.user = user;
                state.isSubmitting = false;
            })
            .addCase(fetchUser.rejected, (state, action) => {
                state.serverStatusText = action.payload;
                state.isSubmitting = false;
            })

            // Send Reset Password Request
            .addCase(sendResetPasswordRequest.pending, (state) => {
                state.isSubmitting = true;
            })
            .addCase(sendResetPasswordRequest.fulfilled, (state) => {
                state.isSubmitting = false;
                state.serverStatusText = 'An email will be sent if the address exists.'
            })
            .addCase(sendResetPasswordRequest.rejected, (state) => {
                state.serverStatusText = 'An email will be sent if the address exists.'
                state.isSubmitting = false;
            })

            // User Login
            .addCase(userLogin.pending, (state) => {
                state.isSubmitting = true;
            })
            .addCase(userLogin.fulfilled, (state, action) => {
                state.token = action.payload;
                state.errors = {};
                state.isSubmitting = false;
            })
            .addCase(userLogin.rejected, (state, action) => {
                state.serverStatusText = action.payload || "Problem with login";
                state.isSubmitting = false;
            })
    }
});

export const {
    changeUsersActiveTeam,
    clearStatusText,
    logout,
    loginOrSignupReset,
    updateUserObject
} = authSlice.actions;

export default authSlice.reducer;
