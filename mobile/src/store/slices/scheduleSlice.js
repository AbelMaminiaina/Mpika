/**
 * Schedule Slice - Schedule Management State
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import { format } from 'date-fns';

const initialState = {
  schedules: {}, // Keyed by date string
  currentDate: format(new Date(), 'yyyy-MM-dd'),
  mentalLoad: {
    score: 0,
    level: 'light',
    message: '',
  },
  weekMentalLoad: [],
  isLoading: false,
  isOptimizing: false,
  error: null,
};

// Async thunks
export const fetchSchedule = createAsyncThunk(
  'schedule/fetchSchedule',
  async (date, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.get(`/schedules/${dateStr}`);
      return { date: dateStr, schedule: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch schedule'
      );
    }
  }
);

export const optimizeSchedule = createAsyncThunk(
  'schedule/optimizeSchedule',
  async (date, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.post('/schedules/optimize', { date: dateStr });
      return {
        date: dateStr,
        schedule: response.data.data.schedule,
        mentalLoad: response.data.data.mentalLoad,
        overloadWarning: response.data.data.overloadWarning,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to optimize schedule'
      );
    }
  }
);

export const updateSchedule = createAsyncThunk(
  'schedule/updateSchedule',
  async ({ date, items }, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.put(`/schedules/${dateStr}`, { items });
      return { date: dateStr, schedule: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update schedule'
      );
    }
  }
);

export const fetchMentalLoad = createAsyncThunk(
  'schedule/fetchMentalLoad',
  async (date, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.get(`/schedules/${dateStr}/mental-load`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch mental load'
      );
    }
  }
);

export const fetchWeekMentalLoad = createAsyncThunk(
  'schedule/fetchWeekMentalLoad',
  async (startDate, { rejectWithValue }) => {
    try {
      const dateStr = typeof startDate === 'string' ? startDate : format(startDate, 'yyyy-MM-dd');
      const response = await api.get(`/schedules/week/${dateStr}/mental-load`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch week mental load'
      );
    }
  }
);

export const addScheduleItem = createAsyncThunk(
  'schedule/addScheduleItem',
  async ({ date, item }, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.post(`/schedules/${dateStr}/items`, item);
      return { date: dateStr, item: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add schedule item'
      );
    }
  }
);

export const updateScheduleItem = createAsyncThunk(
  'schedule/updateScheduleItem',
  async ({ date, itemId, updates }, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      const response = await api.put(`/schedules/${dateStr}/items/${itemId}`, updates);
      return { date: dateStr, item: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update schedule item'
      );
    }
  }
);

export const deleteScheduleItem = createAsyncThunk(
  'schedule/deleteScheduleItem',
  async ({ date, itemId }, { rejectWithValue }) => {
    try {
      const dateStr = typeof date === 'string' ? date : format(date, 'yyyy-MM-dd');
      await api.delete(`/schedules/${dateStr}/items/${itemId}`);
      return { date: dateStr, itemId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete schedule item'
      );
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    setCurrentDate: (state, action) => {
      state.currentDate = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    // Real-time updates
    scheduleUpdated: (state, action) => {
      const { date, schedule } = action.payload;
      state.schedules[date] = schedule;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch schedule
      .addCase(fetchSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.schedules[action.payload.date] = action.payload.schedule;
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Optimize schedule
      .addCase(optimizeSchedule.pending, (state) => {
        state.isOptimizing = true;
        state.error = null;
      })
      .addCase(optimizeSchedule.fulfilled, (state, action) => {
        state.isOptimizing = false;
        state.schedules[action.payload.date] = action.payload.schedule;
        state.mentalLoad = {
          score: action.payload.mentalLoad,
          level: getMentalLoadLevel(action.payload.mentalLoad),
          overloadWarning: action.payload.overloadWarning,
        };
      })
      .addCase(optimizeSchedule.rejected, (state, action) => {
        state.isOptimizing = false;
        state.error = action.payload;
      })
      // Update schedule
      .addCase(updateSchedule.fulfilled, (state, action) => {
        state.schedules[action.payload.date] = action.payload.schedule;
      })
      // Mental load
      .addCase(fetchMentalLoad.fulfilled, (state, action) => {
        state.mentalLoad = action.payload;
      })
      // Week mental load
      .addCase(fetchWeekMentalLoad.fulfilled, (state, action) => {
        state.weekMentalLoad = action.payload.days;
      })
      // Add item
      .addCase(addScheduleItem.fulfilled, (state, action) => {
        const schedule = state.schedules[action.payload.date];
        if (schedule) {
          schedule.items.push(action.payload.item);
          schedule.items.sort((a, b) =>
            new Date(a.startTime) - new Date(b.startTime)
          );
        }
      })
      // Update item
      .addCase(updateScheduleItem.fulfilled, (state, action) => {
        const schedule = state.schedules[action.payload.date];
        if (schedule) {
          const index = schedule.items.findIndex(i => i.id === action.payload.item.id);
          if (index !== -1) {
            schedule.items[index] = action.payload.item;
          }
        }
      })
      // Delete item
      .addCase(deleteScheduleItem.fulfilled, (state, action) => {
        const schedule = state.schedules[action.payload.date];
        if (schedule) {
          schedule.items = schedule.items.filter(i => i.id !== action.payload.itemId);
        }
      });
  },
});

// Helper function
function getMentalLoadLevel(score) {
  if (score <= 3) return 'light';
  if (score <= 5) return 'balanced';
  if (score <= 7) return 'busy';
  if (score <= 9) return 'overloaded';
  return 'critical';
}

export const { setCurrentDate, clearError, scheduleUpdated } = scheduleSlice.actions;
export default scheduleSlice.reducer;
