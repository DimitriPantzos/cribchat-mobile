import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../convex/_generated/api';
import { colors, spacing, radius, typography } from '../lib/theme';

export default function Onboarding() {
  const router = useRouter();
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const convexUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : 'skip');
  const addChild = useMutation(api.children.add);

  const [childName, setChildName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!childName.trim()) { setError("Please enter your child's name"); return; }
    if (!birthMonth || !birthYear) { setError("Please enter birth month and year"); return; }
    if (!convexUser?._id) { setError('Please wait for your account to load'); return; }

    const month = parseInt(birthMonth); const year = parseInt(birthYear);
    if (month < 1 || month > 12) { setError('Month must be 1-12'); return; }
    if (year < 2020 || year > new Date().getFullYear()) { setError('Invalid year'); return; }

    setError(''); setIsLoading(true);
    try {
      await addChild({ userId: convexUser._id, name: childName.trim(), birthDate: `${year}-${String(month).padStart(2, '0')}-15` });
      router.replace('/(tabs)/home');
    } catch (err: any) { setError('Failed to add child. Please try again.'); }
    finally { setIsLoading(false); }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    emoji: { fontSize: 64, marginBottom: spacing.md },
    title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: theme.textPrimary, marginBottom: spacing.xs, textAlign: 'center' },
    subtitle: { fontSize: typography.sizes.md, color: theme.textMuted, textAlign: 'center' },
    form: { gap: spacing.lg },
    inputGroup: { gap: spacing.sm },
    label: { fontSize: typography.sizes.sm, fontWeight: typography.weights.medium, color: theme.textSecondary },
    input: { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: radius.lg, padding: spacing.md, fontSize: typography.sizes.lg, color: theme.textPrimary },
    row: { flexDirection: 'row', gap: spacing.md },
    halfInput: { flex: 1 },
    button: { backgroundColor: theme.accentPrimary, padding: spacing.lg, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.md },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.textInverse, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
    error: { backgroundColor: theme.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
    errorText: { color: theme.error, textAlign: 'center', fontSize: typography.sizes.sm },
    tip: { backgroundColor: theme.accentLight, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.xl },
    tipText: { color: theme.accentPrimary, fontSize: typography.sizes.sm, textAlign: 'center' },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}><Text style={styles.emoji}>👶</Text><Text style={styles.title}>Add Your Child</Text><Text style={styles.subtitle}>Let's get to know your little one</Text></View>
          {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
          <View style={styles.form}>
            <View style={styles.inputGroup}><Text style={styles.label}>Child's Name</Text><TextInput style={styles.input} placeholder="e.g., Emma" placeholderTextColor={theme.textMuted} value={childName} onChangeText={setChildName} autoCapitalize="words" /></View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Birth Date</Text>
              <View style={styles.row}>
                <TextInput style={[styles.input, styles.halfInput]} placeholder="Month (1-12)" placeholderTextColor={theme.textMuted} value={birthMonth} onChangeText={setBirthMonth} keyboardType="number-pad" maxLength={2} />
                <TextInput style={[styles.input, styles.halfInput]} placeholder="Year (e.g., 2024)" placeholderTextColor={theme.textMuted} value={birthYear} onChangeText={setBirthYear} keyboardType="number-pad" maxLength={4} />
              </View>
            </View>
            <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSubmit} disabled={isLoading}>{isLoading ? <ActivityIndicator color={theme.textInverse} /> : <Text style={styles.buttonText}>Get Started</Text>}</TouchableOpacity>
          </View>
          <View style={styles.tip}><Text style={styles.tipText}>💡 We'll use this to calculate age-appropriate wake windows and sleep recommendations</Text></View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
