/**
 * UI Slice - UI State Management
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  theme: 'light', // 'light', 'dark', 'system'
  isOnline: true,
  snackbar: {
    visible: false,
    message: '',
    type: 'info', // 'info', 'success', 'error', 'warning'
  },
  modals: {
    createTask: false,
    editTask: false,
    scheduleItem: false,
    profile: false,
  },
  selectedDate: new Date().toISOString().split('T')[0],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    showSnackbar: (state, action) => {
      state.snackbar = {
        visible: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
      };
    },
    hideSnackbar: (state) => {
      state.snackbar.visible = false;
    },
    openModal: (state, action) => {
      state.modals[action.payload] = true;
    },
    closeModal: (state, action) => {
      state.modals[action.payload] = false;
    },
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach(key => {
        state.modals[key] = false;
      });
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
  },
});

export const {
  setTheme,
  setOnlineStatus,
  showSnackbar,
  hideSnackbar,
  openModal,
  closeModal,
  closeAllModals,
  setSelectedDate,
} = uiSlice.actions;

export default uiSlice.reducer;
