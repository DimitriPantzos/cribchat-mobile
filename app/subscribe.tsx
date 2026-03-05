import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Product } from 'react-native-iap';
import { useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { colors, spacing, radius, typography } from '../lib/theme';
import { 
  getProducts, 
  purchaseSubscription, 
  restorePurchases,
  formatPrice,
  isYearlyProduct,
  PRODUCT_IDS,
} from '../lib/purchases';

export default function Subscribe() {
  const router = useRouter();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const prods = await getProducts();
    setProducts(prods);
    
    // Auto-select yearly if available
    const yearly = prods.find(p => isYearlyProduct(p.productId));
    const monthly = prods.find(p => p.productId === PRODUCT_IDS.monthly);
    setSelectedProduct(yearly || monthly || prods[0] || null);
    
    setLoading(false);
  }

  async function handlePurchase() {
    if (!selectedProduct || !user?.id) return;
    
    setPurchasing(true);
    
    purchaseSubscription(
      selectedProduct.productId,
      async (purchase) => {
        // Purchase successful - receipt validation happens server-side
        // The validateReceipt endpoint updates the subscription in Convex
        const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') || '';
        
        try {
          const response = await fetch(`${convexUrl}/validateReceipt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              receipt: purchase.transactionReceipt,
              userId: user.id,
            }),
          });
          
          const result = await response.json();
          
          if (result.isValid) {
            Alert.alert(
              'Welcome to CribChat Premium! 🎉',
              'You now have access to all premium features.',
              [{ text: 'Continue', onPress: () => router.back() }]
            );
          } else {
            Alert.alert('Error', 'Could not validate purchase. Please contact support.');
          }
        } catch (error) {
          console.error('Validation error:', error);
          Alert.alert('Error', 'Could not validate purchase. Please try restoring purchases.');
        }
        
        setPurchasing(false);
      },
      (error) => {
        setPurchasing(false);
        Alert.alert('Purchase Failed', error.message || 'Something went wrong');
      }
    );
  }

  async function handleRestore() {
    if (!user?.id) return;
    
    setRestoring(true);
    const purchases = await restorePurchases();
    
    if (purchases.length > 0) {
      // Validate the most recent purchase
      const latestPurchase = purchases[0];
      const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL?.replace('.cloud', '.site') || '';
      
      try {
        const response = await fetch(`${convexUrl}/validateReceipt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            receipt: latestPurchase.transactionReceipt,
            userId: user.id,
          }),
        });
        
        const result = await response.json();
        
        if (result.isValid) {
          Alert.alert(
            'Purchases Restored',
            'Your premium subscription has been restored.',
            [{ text: 'Continue', onPress: () => router.back() }]
          );
        } else {
          Alert.alert('Subscription Expired', 'Your previous subscription has expired.');
        }
      } catch (error) {
        Alert.alert('Error', 'Could not restore purchases. Please try again.');
      }
    } else {
      Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
    }
    
    setRestoring(false);
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    header: { padding: spacing.lg, alignItems: 'center' },
    closeButton: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.sm },
    closeText: { fontSize: 24, color: theme.textPrimary },
    emoji: { fontSize: 64, marginBottom: spacing.md },
    title: { fontSize: typography.sizes['2xl'], fontWeight: typography.weights.bold, color: theme.textPrimary, textAlign: 'center' },
    subtitle: { fontSize: typography.sizes.md, color: theme.textSecondary, textAlign: 'center', marginTop: spacing.sm },
    
    features: { padding: spacing.lg },
    featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
    featureEmoji: { fontSize: 24, marginRight: spacing.md },
    featureText: { flex: 1, fontSize: typography.sizes.md, color: theme.textPrimary },
    
    packages: { padding: spacing.lg },
    packageCard: { 
      padding: spacing.lg, 
      borderRadius: radius.xl, 
      borderWidth: 2,
      marginBottom: spacing.md,
    },
    packageCardSelected: { borderColor: theme.accentPrimary, backgroundColor: theme.accentLight },
    packageCardUnselected: { borderColor: theme.bgCard, backgroundColor: theme.bgCard },
    packageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    packageName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: theme.textPrimary },
    packagePrice: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: theme.accentPrimary },
    packagePeriod: { fontSize: typography.sizes.sm, color: theme.textSecondary },
    savingsBadge: { 
      backgroundColor: '#10b981', 
      paddingHorizontal: spacing.sm, 
      paddingVertical: 2, 
      borderRadius: radius.sm,
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
    },
    savingsText: { color: 'white', fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
    
    footer: { padding: spacing.lg, paddingBottom: spacing.xl },
    purchaseButton: { 
      backgroundColor: theme.accentPrimary, 
      padding: spacing.lg, 
      borderRadius: radius.xl, 
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    purchaseButtonDisabled: { opacity: 0.5 },
    purchaseButtonText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
    restoreButton: { alignItems: 'center', padding: spacing.md },
    restoreText: { color: theme.textSecondary, fontSize: typography.sizes.sm },
    
    trial: { textAlign: 'center', color: theme.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.sm },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.accentPrimary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.emoji}>👶✨</Text>
          <Text style={styles.title}>Unlock CribChat Premium</Text>
          <Text style={styles.subtitle}>AI-powered sleep coaching for your baby</Text>
        </View>

        <View style={styles.features}>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>🤖</Text>
            <Text style={styles.featureText}>Unlimited AI chat with sleep expert</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>📊</Text>
            <Text style={styles.featureText}>Personalized sleep predictions</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>📈</Text>
            <Text style={styles.featureText}>Sleep trends & insights</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>👨‍👩‍👧</Text>
            <Text style={styles.featureText}>Unlimited caregiver invites</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>📱</Text>
            <Text style={styles.featureText}>Sync across all devices</Text>
          </View>
        </View>

        <View style={styles.packages}>
          {products.map((product) => {
            const isSelected = selectedProduct?.productId === product.productId;
            const isYearly = isYearlyProduct(product.productId);
            
            return (
              <TouchableOpacity
                key={product.productId}
                style={[
                  styles.packageCard,
                  isSelected ? styles.packageCardSelected : styles.packageCardUnselected,
                ]}
                onPress={() => setSelectedProduct(product)}
              >
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageName}>
                      {isYearly ? 'Yearly' : 'Monthly'}
                    </Text>
                    <Text style={styles.packagePeriod}>
                      {isYearly ? 'per year' : 'per month'}
                    </Text>
                  </View>
                  <Text style={styles.packagePrice}>{formatPrice(product)}</Text>
                </View>
                {isYearly && (
                  <View style={styles.savingsBadge}>
                    <Text style={styles.savingsText}>SAVE 25%</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.purchaseButton, (purchasing || !selectedProduct) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={purchasing || !selectedProduct}
        >
          {purchasing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.purchaseButtonText}>
              Start Free Trial
            </Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
          <Text style={styles.restoreText}>
            {restoring ? 'Restoring...' : 'Restore Purchases'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.trial}>
          2-day free trial, then {selectedProduct ? formatPrice(selectedProduct) : ''} {selectedProduct && isYearlyProduct(selectedProduct.productId) ? '/year' : '/month'}. Cancel anytime.
        </Text>
      </View>
    </SafeAreaView>
  );
}
