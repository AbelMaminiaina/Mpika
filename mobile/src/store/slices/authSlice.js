/**
 * Auth Slice - Authentication State Management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import storage from '../../services/storage';
import api from '../../services/api';

const initialState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user, tokens } = response.data.data;

      // Store tokens securely
      await storage.setItem('accessToken', tokens.accessToken);
      await storage.setItem('refreshToken', tokens.refreshToken);

      return { user, tokens };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed'
      );
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { user, tokens } = response.data.data;

      // Store tokens securely
      await storage.setItem('accessToken', tokens.accessToken);
      await storage.setItem('refreshToken', tokens.refreshToken);

      return { user, tokens };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Login failed'
      );
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    }

    // Clear stored tokens
    await storage.removeItem('accessToken');
    await storage.removeItem('refreshToken');

    return null;
  }
);

export const loadAuthFromStorage = createAsyncThunk(
  'auth/loadAuthFromStorage',
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = await storage.getItem('accessToken');

      if (!accessToken) {
        return null;
      }

      // Verify token by fetching current user
      const response = await api.get('/auth/me');
      const user = response.data.data;

      return { user, accessToken };
    } catch (error) {
      // Clear invalid tokens
      await storage.removeItem('accessToken');
      await storage.removeItem('refreshToken');
      return null;
    }
  }
);

export const refreshAccessToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = await storage.getItem('refreshToken');

      if (!refreshToken) {
        return rejectWithValue('No refresh token');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      const { tokens } = response.data.data;

      await storage.setItem('accessToken', tokens.accessToken);
      await storage.setItem('refreshToken', tokens.refreshToken);

      return tokens;
    } catch (error) {
      return rejectWithValue('Token refresh failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      // Load from storage
      .addCase(loadAuthFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadAuthFromStorage.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadAuthFromStorage.rejected, (state) => {
        state.isLoading = false;
      })
      // Refresh token
      .addCase(refreshAccessToken.fulfilled, (state, action) => {
        state.tokens = action.payload;
      })
      .addCase(refreshAccessToken.rejected, (state) => {
        state.user = null;
        state.tokens = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
