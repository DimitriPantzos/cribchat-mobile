import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSignIn } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../lib/theme';

export default function SignIn() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setError(''); setIsLoading(true);
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === 'complete') { await setActive({ session: result.createdSessionId }); router.replace('/'); }
      else setError('Unable to sign in. Please try again.');
    } catch (err: any) { setError(err.errors?.[0]?.message || 'Invalid email or password'); }
    finally { setIsLoading(false); }
  }, [isLoaded, email, password, signIn, setActive, router]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    emoji: { fontSize: 64, marginBottom: spacing.md },
    title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: theme.textPrimary, marginBottom: spacing.xs },
    subtitle: { fontSize: typography.sizes.md, color: theme.textMuted },
    form: { gap: spacing.md },
    input: { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: radius.lg, padding: spacing.md, fontSize: typography.sizes.md, color: theme.textPrimary },
    button: { backgroundColor: theme.accentPrimary, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.sm },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.textInverse, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
    error: { backgroundColor: theme.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
    errorText: { color: theme.error, textAlign: 'center', fontSize: typography.sizes.sm },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, gap: spacing.xs },
    footerText: { color: theme.textMuted, fontSize: typography.sizes.sm },
    link: { color: theme.accentPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
  });

  return (
    <SafeAreaView style={styles.container}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={styles.emoji}>🍼</Text><Text style={styles.title}>CribChat</Text><Text style={styles.subtitle}>Welcome back, sleepy parent!</Text></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" />
        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={onSignIn} disabled={isLoading}>{isLoading ? <ActivityIndicator color={theme.textInverse} /> : <Text style={styles.buttonText}>Sign In</Text>}</TouchableOpacity>
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>Don't have an account?</Text><Link href="/(auth)/sign-up" asChild><TouchableOpacity><Text style={styles.link}>Sign Up</Text></TouchableOpacity></Link></View>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>
  );
}
