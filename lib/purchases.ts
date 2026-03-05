// Stub implementation for iOS build
// TODO: Add proper StoreKit integration after initial app approval

export const PRODUCT_IDS = {
  monthly: 'cribchat_premium_monthly',
  yearly: 'cribchat_premium_yearly',
};

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
}

let isInitialized = false;

export async function initIAP(): Promise<boolean> {
  // StoreKit will be initialized when we add the native module
  isInitialized = true;
  return true;
}

export async function endIAP(): Promise<void> {
  isInitialized = false;
}

export async function getProducts(): Promise<Product[]> {
  // Return placeholder products for now
  // Real products will come from StoreKit after native integration
  return [
    {
      productId: PRODUCT_IDS.monthly,
      title: 'CribChat Premium Monthly',
      description: 'Full access to all features',
      price: '9.99',
      localizedPrice: '$9.99',
      currency: 'USD',
    },
    {
      productId: PRODUCT_IDS.yearly,
      title: 'CribChat Premium Yearly',
      description: 'Full access to all features - Save 25%',
      price: '89.99',
      localizedPrice: '$89.99',
      currency: 'USD',
    },
  ];
}

export async function purchaseSubscription(
  productId: string,
  onSuccess: (purchase: any) => void,
  onError: (error: any) => void
): Promise<void> {
  // Placeholder - will trigger native StoreKit
  onError({ message: 'In-App Purchases will be available after App Store approval' });
}

export async function restorePurchases(): Promise<any[]> {
  return [];
}

export function formatPrice(product: Product): string {
  return product.localizedPrice;
}

export function getSubscriptionPeriod(productId: string): string {
  if (productId.includes('yearly') || productId.includes('annual')) {
    return 'year';
  }
  return 'month';
}

export function isYearlyProduct(productId: string): boolean {
  return productId.includes('yearly') || productId.includes('annual');
}
