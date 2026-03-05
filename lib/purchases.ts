import { Platform } from 'react-native';
import * as RNIap from 'react-native-iap';

// Product IDs - must match App Store Connect
export const PRODUCT_IDS = {
  monthly: 'cribchat_premium_monthly',
  yearly: 'cribchat_premium_yearly',
};

const productIds = Platform.select({
  ios: [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly],
  android: [PRODUCT_IDS.monthly, PRODUCT_IDS.yearly],
  default: [],
});

let isInitialized = false;
let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;

/**
 * Initialize IAP connection
 */
export async function initIAP(): Promise<boolean> {
  if (isInitialized) return true;
  
  try {
    const result = await RNIap.initConnection();
    console.log('IAP connection initialized:', result);
    isInitialized = true;
    
    // Clear any pending transactions (iOS)
    if (Platform.OS === 'ios') {
      await RNIap.clearTransactionIOS();
    }
    
    return true;
  } catch (error) {
    console.error('Failed to init IAP:', error);
    return false;
  }
}

/**
 * End IAP connection (call on app close)
 */
export async function endIAP(): Promise<void> {
  if (purchaseUpdateSubscription) {
    purchaseUpdateSubscription.remove();
    purchaseUpdateSubscription = null;
  }
  if (purchaseErrorSubscription) {
    purchaseErrorSubscription.remove();
    purchaseErrorSubscription = null;
  }
  
  try {
    await RNIap.endConnection();
    isInitialized = false;
  } catch (error) {
    console.error('Failed to end IAP:', error);
  }
}

/**
 * Get available products from App Store
 */
export async function getProducts(): Promise<RNIap.Product[]> {
  try {
    await initIAP();
    const products = await RNIap.getSubscriptions({ skus: productIds! });
    console.log('Products loaded:', products.length);
    return products;
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}

/**
 * Purchase a subscription
 */
export async function purchaseSubscription(
  productId: string,
  onSuccess: (purchase: RNIap.SubscriptionPurchase) => void,
  onError: (error: any) => void
): Promise<void> {
  try {
    await initIAP();
    
    // Set up purchase listeners
    purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
      console.log('Purchase updated:', purchase);
      
      const receipt = purchase.transactionReceipt;
      if (receipt) {
        // Finish the transaction
        try {
          await RNIap.finishTransaction({ purchase, isConsumable: false });
          onSuccess(purchase as RNIap.SubscriptionPurchase);
        } catch (finishError) {
          console.error('Failed to finish transaction:', finishError);
        }
      }
    });
    
    purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.error('Purchase error:', error);
      if (error.code !== 'E_USER_CANCELLED') {
        onError(error);
      }
    });
    
    // Request the subscription
    await RNIap.requestSubscription({
      sku: productId,
      andDangerouslyFinishTransactionAutomaticallyIOS: false,
    });
    
  } catch (error: any) {
    if (error.code === 'E_USER_CANCELLED') {
      console.log('User cancelled purchase');
    } else {
      console.error('Purchase failed:', error);
      onError(error);
    }
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<RNIap.Purchase[]> {
  try {
    await initIAP();
    const purchases = await RNIap.getAvailablePurchases();
    console.log('Restored purchases:', purchases.length);
    return purchases;
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return [];
  }
}

/**
 * Validate receipt with Apple (server-side)
 * Returns parsed receipt data if valid
 */
export async function validateReceipt(
  receipt: string,
  convexUrl: string
): Promise<{
  isValid: boolean;
  expiresAt?: number;
  productId?: string;
  isTrialPeriod?: boolean;
}> {
  try {
    const response = await fetch(`${convexUrl}/validateReceipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receipt }),
    });
    
    if (!response.ok) {
      throw new Error('Receipt validation failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Receipt validation error:', error);
    return { isValid: false };
  }
}

/**
 * Format price for display
 */
export function formatPrice(product: RNIap.Product): string {
  return product.localizedPrice || `$${product.price}`;
}

/**
 * Get subscription period
 */
export function getSubscriptionPeriod(productId: string): string {
  if (productId.includes('yearly') || productId.includes('annual')) {
    return 'year';
  }
  return 'month';
}

/**
 * Check if product is yearly
 */
export function isYearlyProduct(productId: string): boolean {
  return productId.includes('yearly') || productId.includes('annual');
}
