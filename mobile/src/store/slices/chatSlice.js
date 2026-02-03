/**
 * Chat Slice - AI Conversation State Management
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  conversations: [],
  currentConversation: null,
  messages: [],
  suggestions: [],
  isLoading: false,
  isSending: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/ai/conversations', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversations'
      );
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'chat/fetchConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/ai/conversations/${conversationId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch conversation'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ message, conversationId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/chat', { message, conversationId });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to send message'
      );
    }
  }
);

export const fetchSuggestions = createAsyncThunk(
  'chat/fetchSuggestions',
  async (type, { rejectWithValue }) => {
    try {
      const response = await api.post('/ai/suggest', { type });
      return response.data.data.suggestions;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch suggestions'
      );
    }
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId, { rejectWithValue }) => {
    try {
      await api.delete(`/ai/conversations/${conversationId}`);
      return conversationId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete conversation'
      );
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    addOptimisticMessage: (state, action) => {
      state.messages.push({
        id: `temp-${Date.now()}`,
        role: 'USER',
        content: action.payload,
        createdAt: new Date().toISOString(),
        isOptimistic: true,
      });
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch single conversation
      .addCase(fetchConversation.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentConversation = action.payload;
        state.messages = action.payload.messages;
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        // Remove optimistic message
        state.messages = state.messages.filter(m => !m.isOptimistic);
        // Add real messages
        if (!state.currentConversation) {
          state.currentConversation = { id: action.payload.conversationId };
        }
        state.messages.push(action.payload.message);
        state.suggestions = action.payload.suggestions || [];
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload;
        // Remove failed optimistic message
        state.messages = state.messages.filter(m => !m.isOptimistic);
      })
      // Fetch suggestions
      .addCase(fetchSuggestions.fulfilled, (state, action) => {
        state.suggestions = action.payload;
      })
      // Delete conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(
          c => c.id !== action.payload
        );
        if (state.currentConversation?.id === action.payload) {
          state.currentConversation = null;
          state.messages = [];
        }
      });
  },
});

export const {
  setCurrentConversation,
  addOptimisticMessage,
  clearMessages,
  clearError,
} = chatSlice.actions;

export default chatSlice.reducer;
