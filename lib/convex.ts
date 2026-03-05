import { ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';

const convexUrl = Constants.expoConfig?.extra?.convexUrl || process.env.EXPO_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing EXPO_PUBLIC_CONVEX_URL environment variable');
}

export const convex = new ConvexReactClient(convexUrl);
