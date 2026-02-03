/**
 * Storage Service - Cross-platform storage abstraction
 * Uses SecureStore on mobile, localStorage on web
 */

import { Platform } from 'react-native';

let SecureStore = null;

// Only import SecureStore on native platforms
if (Platform.OS !== 'web') {
  SecureStore = require('expo-secure-store');
}

export const storage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

export default storage;
