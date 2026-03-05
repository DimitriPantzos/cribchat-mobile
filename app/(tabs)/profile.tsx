import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { colors, spacing, radius, typography } from '../../lib/theme';
import { getAgeFromBirthdate, getAgeDisplay } from '../../lib/scheduleUtils';

export default function Profile() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const convexUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : 'skip');
  const children = useQuery(api.children.getByUser, convexUser?._id ? { userId: convexUser._id } : 'skip');

  const handleSignOut = () => { Alert.alert('Sign Out', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign Out', style: 'destructive', onPress: () => { signOut(); router.replace('/(auth)/sign-in'); } }]); };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    header: { padding: spacing.md },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: theme.textPrimary },
    content: { padding: spacing.md, paddingBottom: 100 },
    profileCard: { backgroundColor: theme.bgCard, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.accentPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    avatarText: { color: 'white', fontSize: 32, fontWeight: typography.weights.bold },
    profileName: { fontSize: typography.sizes.xl, fontWeight: typography.weights.semibold, color: theme.textPrimary, marginBottom: 4 },
    profileEmail: { fontSize: typography.sizes.sm, color: theme.textMuted },
    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: theme.textMuted, marginBottom: spacing.sm, paddingLeft: spacing.xs },
    card: { backgroundColor: theme.bgCard, borderRadius: radius.lg, borderWidth: 1, borderColor: theme.border, overflow: 'hidden' },
    cardItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: 1, borderBottomColor: theme.border },
    cardItemLast: { borderBottomWidth: 0 },
    cardItemIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    cardItemEmoji: { fontSize: 18 },
    cardItemContent: { flex: 1 },
    cardItemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: theme.textPrimary },
    cardItemSubtitle: { fontSize: typography.sizes.xs, color: theme.textMuted, marginTop: 2 },
    cardItemArrow: { fontSize: typography.sizes.md, color: theme.textMuted },
    signOutButton: { backgroundColor: theme.errorBg, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', marginTop: spacing.lg },
    signOutText: { color: theme.error, fontWeight: typography.weights.semibold },
    versionText: { textAlign: 'center', color: theme.textMuted, fontSize: typography.sizes.xs, marginTop: spacing.xl },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}><View style={styles.header}><Text style={styles.title}>👶 Profile</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}><View style={styles.avatar}><Text style={styles.avatarText}>{user?.firstName?.[0] || '?'}</Text></View><Text style={styles.profileName}>{user?.fullName || 'Parent'}</Text><Text style={styles.profileEmail}>{user?.emailAddresses[0]?.emailAddress}</Text></View>
        <View style={styles.section}><Text style={styles.sectionTitle}>CHILDREN</Text><View style={styles.card}>
          {children?.map((c, i) => <TouchableOpacity key={c._id} style={[styles.cardItem, i === (children?.length || 0) - 1 && styles.cardItemLast]}><View style={[styles.cardItemIcon, { backgroundColor: theme.accentLight }]}><Text style={styles.cardItemEmoji}>👶</Text></View><View style={styles.cardItemContent}><Text style={styles.cardItemTitle}>{c.name}</Text><Text style={styles.cardItemSubtitle}>{getAgeDisplay(getAgeFromBirthdate(c.birthDate))}</Text></View><Text style={styles.cardItemArrow}>›</Text></TouchableOpacity>)}
          <TouchableOpacity style={[styles.cardItem, styles.cardItemLast]} onPress={() => router.push('/onboarding')}><View style={[styles.cardItemIcon, { backgroundColor: theme.successBg }]}><Text style={styles.cardItemEmoji}>➕</Text></View><View style={styles.cardItemContent}><Text style={[styles.cardItemTitle, { color: theme.success }]}>Add Child</Text></View></TouchableOpacity>
        </View></View>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}><Text style={styles.signOutText}>Sign Out</Text></TouchableOpacity>
        <Text style={styles.versionText}>CribChat v1.0.0{'\n'}Made with 💜 for sleepy parents</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
