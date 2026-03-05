import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { initIAP, restorePurchases } from '../lib/purchases';

export function usePurchases() {
  const { user, isLoaded } = useUser();
  const [loading, setLoading] = useState(true);

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : 'skip'
  );

  // Get subscription status from Convex
  const subscription = useQuery(
    api.subscriptions.getByUserId,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );

  // Check if premium is active
  const isPremium = subscription?.status === 'active' || subscription?.status === 'trialing';
  
  // Check if subscription is expired
  const isExpired = subscription?.currentPeriodEnd 
    ? subscription.currentPeriodEnd < Date.now() 
    : false;

  // Initialize IAP on mount
  useEffect(() => {
    async function init() {
      if (!isLoaded) return;
      
      try {
        await initIAP();
      } catch (error) {
        console.error('Failed to initialize IAP:', error);
      }
      
      setLoading(false);
    }
    
    init();
  }, [isLoaded]);

  // Refresh by restoring purchases and re-validating
  const refreshStatus = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const purchases = await restorePurchases();
      
      if (purchases.length > 0) {
        const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') || '';
        
        await fetch(`${convexUrl}/validateReceipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receipt: purchases[0].transactionReceipt,
            userId: user.id,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to refresh status:', error);
    }
  }, [user?.id]);

  return {
    subscription,
    isPremium: isPremium && !isExpired,
    isExpired,
    loading,
    refreshStatus,
  };
}
