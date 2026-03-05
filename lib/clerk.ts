import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      const item = await SecureStore.getItemAsync(key);
      if (item) {
        console.log(`[TokenCache] Retrieved token for key: ${key.substring(0, 20)}...`);
      }
      return item;
    } catch (error) {
      console.error('[TokenCache] getToken error:', error);
      // On iOS, SecureStore can fail if keychain is locked - return null gracefully
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
      console.log(`[TokenCache] Saved token for key: ${key.substring(0, 20)}...`);
    } catch (error) {
      console.error('[TokenCache] saveToken error:', error);
      // Silently fail - Clerk will retry
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
      console.log(`[TokenCache] Cleared token for key: ${key.substring(0, 20)}...`);
    } catch (error) {
      console.error('[TokenCache] clearToken error:', error);
    }
  },
};

export const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) { throw new Error('Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY'); }
