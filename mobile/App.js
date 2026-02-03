/**
 * Mpikarakara - Main App Entry
 * Intelligent Life Management Assistant
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { store } from './src/store';
import { theme } from './src/utils/theme';
import Navigation from './src/navigation';
import { initializeNotifications } from './src/services/notifications';
import { loadAuthFromStorage } from './src/store/slices/authSlice';

export default function App() {
  useEffect(() => {
    // Initialize app
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Load auth state from storage
    await store.dispatch(loadAuthFromStorage());

    // Initialize push notifications
    await initializeNotifications();
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ReduxProvider store={store}>
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar style="auto" />
            <Navigation />
          </SafeAreaProvider>
        </PaperProvider>
      </ReduxProvider>
    </GestureHandlerRootView>
  );
}
