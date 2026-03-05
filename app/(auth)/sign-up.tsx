import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, useColorScheme, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../lib/theme';

export default function SignUp() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const onSignUp = useCallback(async () => {
    if (!isLoaded) return;
    setError(''); setIsLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
    } catch (err: any) { setError(err.errors?.[0]?.message || 'Unable to create account'); }
    finally { setIsLoading(false); }
  }, [isLoaded, email, password, signUp]);

  const onVerify = useCallback(async () => {
    if (!isLoaded) return;
    setError(''); setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === 'complete') { await setActive({ session: result.createdSessionId }); router.replace('/'); }
      else setError('Verification failed. Please try again.');
    } catch (err: any) { setError(err.errors?.[0]?.message || 'Invalid verification code'); }
    finally { setIsLoading(false); }
  }, [isLoaded, code, signUp, setActive, router]);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    header: { alignItems: 'center', marginBottom: spacing.xxl },
    emoji: { fontSize: 64, marginBottom: spacing.md },
    title: { fontSize: typography.sizes.xxxl, fontWeight: typography.weights.bold, color: theme.textPrimary, marginBottom: spacing.xs },
    subtitle: { fontSize: typography.sizes.md, color: theme.textMuted, textAlign: 'center' },
    form: { gap: spacing.md },
    input: { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, borderRadius: radius.lg, padding: spacing.md, fontSize: typography.sizes.md, color: theme.textPrimary },
    codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: typography.sizes.xxl },
    button: { backgroundColor: theme.accentPrimary, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.sm },
    buttonDisabled: { opacity: 0.6 },
    buttonText: { color: theme.textInverse, fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
    error: { backgroundColor: theme.errorBg, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
    errorText: { color: theme.error, textAlign: 'center', fontSize: typography.sizes.sm },
    footer: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl, gap: spacing.xs },
    footerText: { color: theme.textMuted, fontSize: typography.sizes.sm },
    link: { color: theme.accentPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
    verificationText: { color: theme.textSecondary, fontSize: typography.sizes.sm, textAlign: 'center', marginBottom: spacing.lg },
  });

  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.container}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><Text style={styles.emoji}>📬</Text><Text style={styles.title}>Verify Email</Text><Text style={styles.subtitle}>We sent a code to {email}</Text></View>
        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
        <Text style={styles.verificationText}>Enter the 6-digit code from your email</Text>
        <View style={styles.form}>
          <TextInput style={[styles.input, styles.codeInput]} placeholder="000000" placeholderTextColor={theme.textMuted} value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={onVerify} disabled={isLoading}>{isLoading ? <ActivityIndicator color={theme.textInverse} /> : <Text style={styles.buttonText}>Verify</Text>}</TouchableOpacity>
        </View>
        <View style={styles.footer}><TouchableOpacity onPress={() => setPendingVerification(false)}><Text style={styles.link}>← Back to Sign Up</Text></TouchableOpacity></View>
      </ScrollView></KeyboardAvoidingView></SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}><ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><Text style={styles.emoji}>🍼</Text><Text style={styles.title}>Join CribChat</Text><Text style={styles.subtitle}>Your personal sleep companion</Text></View>
      {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text></View> : null}
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.textMuted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={theme.textMuted} value={password} onChangeText={setPassword} secureTextEntry autoComplete="password-new" />
        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={onSignUp} disabled={isLoading}>{isLoading ? <ActivityIndicator color={theme.textInverse} /> : <Text style={styles.buttonText}>Create Account</Text>}</TouchableOpacity>
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>Already have an account?</Text><Link href="/(auth)/sign-in" asChild><TouchableOpacity><Text style={styles.link}>Sign In</Text></TouchableOpacity></Link></View>
    </ScrollView></KeyboardAvoidingView></SafeAreaView>
  );
}
