/**
 * Analytics Slice - Analytics State Management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  summary: null,
  dailyData: null,
  weeklyData: null,
  monthlyData: null,
  isLoading: false,
  error: null,
};

export const fetchSummary = createAsyncThunk(
  'analytics/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/analytics/summary');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch summary'
      );
    }
  }
);

export const fetchDailyAnalytics = createAsyncThunk(
  'analytics/fetchDaily',
  async (date, { rejectWithValue }) => {
    try {
      const response = await api.get(`/analytics/daily/${date}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch daily analytics'
      );
    }
  }
);

export const fetchWeeklyAnalytics = createAsyncThunk(
  'analytics/fetchWeekly',
  async (startDate, { rejectWithValue }) => {
    try {
      const params = startDate ? { startDate } : {};
      const response = await api.get('/analytics/weekly', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch weekly analytics'
      );
    }
  }
);

export const fetchMonthlyAnalytics = createAsyncThunk(
  'analytics/fetchMonthly',
  async ({ month, year } = {}, { rejectWithValue }) => {
    try {
      const params = {};
      if (month) params.month = month;
      if (year) params.year = year;
      const response = await api.get('/analytics/monthly', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch monthly analytics'
      );
    }
  }
);

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Summary
      .addCase(fetchSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.summary = action.payload;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Daily
      .addCase(fetchDailyAnalytics.fulfilled, (state, action) => {
        state.dailyData = action.payload;
      })
      // Weekly
      .addCase(fetchWeeklyAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchWeeklyAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.weeklyData = action.payload;
      })
      .addCase(fetchWeeklyAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Monthly
      .addCase(fetchMonthlyAnalytics.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMonthlyAnalytics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.monthlyData = action.payload;
      })
      .addCase(fetchMonthlyAnalytics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = analyticsSlice.actions;
export default analyticsSlice.reducer;
