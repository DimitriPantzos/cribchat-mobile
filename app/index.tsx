import { useEffect } from 'react';
import { View, Text, ActivityIndicator, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { colors } from '../lib/theme';

export default function Index() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  // Get or create user in Convex
  const getOrCreateUser = useMutation(api.users.getOrCreate);
  
  // Get convex user to check if they have children
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );
  
  // Get children for the user
  const children = useQuery(
    api.children.getByUser,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  useEffect(() => {
    async function initAndRoute() {
      if (!isLoaded) return;
      
      if (!isSignedIn) {
        router.replace('/(auth)/sign-in');
        return;
      }

      // Create/get user in Convex
      if (user) {
        try {
          await getOrCreateUser({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress || '',
            name: user.fullName || undefined,
          });
        } catch (error) {
          console.error('Error creating user:', error);
        }
      }
    }

    initAndRoute();
  }, [isLoaded, isSignedIn, user]);

  // Wait for user and children data
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (convexUser === undefined || children === undefined) return;
    
    // Route based on whether user has children
    if (children.length === 0) {
      router.replace('/onboarding');
    } else {
      router.replace('/(tabs)/home');
    }
  }, [isLoaded, isSignedIn, convexUser, children]);

  return (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: theme.bgPrimary 
    }}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🍼</Text>
      <Text style={{ 
        fontSize: 24, 
        fontWeight: '600',
        color: theme.textPrimary,
        marginBottom: 24 
      }}>
        CribChat
      </Text>
      <ActivityIndicator size="large" color={theme.accentPrimary} />
    </View>
  );
}
