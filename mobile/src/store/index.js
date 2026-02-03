/**
 * Redux Store Configuration
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import tasksReducer from './slices/tasksSlice';
import scheduleReducer from './slices/scheduleSlice';
import profileReducer from './slices/profileSlice';
import chatReducer from './slices/chatSlice';
import analyticsReducer from './slices/analyticsSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    schedule: scheduleReducer,
    profile: profileReducer,
    chat: chatReducer,
    analytics: analyticsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/loadAuthFromStorage/fulfilled'],
      },
    }),
});

export default store;
