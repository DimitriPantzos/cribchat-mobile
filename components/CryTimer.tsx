import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Animated } from 'react-native';
import { useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { colors, spacing, radius, typography } from '../lib/theme';

interface CryTimerProps { onClose: () => void; childName?: string; childId?: string; userId?: string; }

const DEFAULT_INTERVALS = [5, 10, 15, 15];
const ENCOURAGEMENTS = ["You're doing great! 💪", "Stay strong! 🌟", "Deep breaths! 🌙", "Every minute counts! 💫", "You're teaching healthy sleep! 🎯", "This gets easier! 🤗", "You're a great parent! 💜"];
const FINAL_ENCOURAGEMENTS = ["Time to comfort! Quick check 🤗", "Interval done! Brief comfort, restart if needed 💜", "You made it! Quick check-in time ⭐"];

export default function CryTimer({ onClose, childName, childId, userId }: CryTimerProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [intervals] = useState(DEFAULT_INTERVALS);
  const [currentIntervalIndex, setCurrentIntervalIndex] = useState(0);
  const [intervalStartTime, setIntervalStartTime] = useState<number | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const saveCrySession = useMutation(api.crySessions.save);

  useEffect(() => { if (isRunning && !isPaused && !isComplete) { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.05, duration: 1000, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })])).start(); } else { pulseAnim.setValue(1); } }, [isRunning, isPaused, isComplete]);

  useEffect(() => {
    if (isRunning && intervalStartTime && !isPaused) {
      const update = () => { const elapsed = Math.floor((Date.now() - intervalStartTime) / 1000); const remaining = Math.max(0, totalSeconds - elapsed); setSecondsLeft(remaining); if (remaining <= 0 && !isComplete) { setIsComplete(true); setIsRunning(false); triggerAlert(); } };
      update(); const i = setInterval(update, 1000); return () => clearInterval(i);
    }
  }, [isRunning, isPaused, intervalStartTime, totalSeconds, isComplete]);

  useEffect(() => {
    if (isRunning && !isComplete && !isPaused) {
      const getEnc = () => secondsLeft <= 60 ? FINAL_ENCOURAGEMENTS[0] : ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      setEncouragement(getEnc()); const i = setInterval(() => setEncouragement(getEnc()), 15000); return () => clearInterval(i);
    }
  }, [isRunning, isComplete, isPaused, secondsLeft]);

  const triggerAlert = useCallback(() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setEncouragement(FINAL_ENCOURAGEMENTS[Math.floor(Math.random() * FINAL_ENCOURAGEMENTS.length)]); }, []);
  const startTimer = () => { const minutes = intervals[currentIntervalIndex]; const totalSecs = minutes * 60; const now = Date.now(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setIntervalStartTime(now); setTotalSeconds(totalSecs); setSecondsLeft(totalSecs); setIsRunning(true); setIsPaused(false); setPausedAt(null); setIsComplete(false); if (!hasStartedSession) { setHasStartedSession(true); setSessionStartTime(now); } };
  const pauseTimer = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsPaused(true); setPausedAt(secondsLeft); };
  const resumeTimer = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); if (pausedAt !== null) setIntervalStartTime(Date.now() - (totalSeconds - pausedAt) * 1000); setIsPaused(false); setPausedAt(null); };
  const nextInterval = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); const nextIdx = Math.min(currentIntervalIndex + 1, intervals.length - 1); setCurrentIntervalIndex(nextIdx); setIsComplete(false); const minutes = intervals[nextIdx]; const totalSecs = minutes * 60; const now = Date.now(); setIntervalStartTime(now); setTotalSeconds(totalSecs); setSecondsLeft(totalSecs); setIsRunning(true); setIsPaused(false); setPausedAt(null); };
  const handleEndSession = async (outcome: 'asleep' | 'comforted' | 'stopped') => { if (childId && userId && sessionStartTime) { try { await saveCrySession({ userId: userId as Id<'users'>, childId: childId as Id<'children'>, startTime: sessionStartTime, endTime: Date.now(), intervalsCompleted: currentIntervalIndex + (isComplete ? 1 : 0), intervals, totalDurationMin: Math.round((Date.now() - sessionStartTime) / 60000), outcome }); } catch (e) { console.error(e); } } setShowOutcomeModal(false); onClose(); };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
    card: { backgroundColor: theme.bgCard, borderRadius: radius.xl, padding: spacing.lg, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: theme.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    headerButton: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: theme.bgSecondary },
    title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: theme.textPrimary },
    intervalsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    intervalCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    intervalText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
    intervalLabel: { fontSize: typography.sizes.xs, color: theme.textMuted, marginTop: 2 },
    timerContainer: { alignItems: 'center', marginBottom: spacing.lg },
    timerCircle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
    timerText: { fontSize: 48, fontWeight: typography.weights.bold },
    timerSubtext: { fontSize: typography.sizes.sm, marginTop: spacing.xs },
    encouragementBox: { padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.lg, alignItems: 'center' },
    encouragementText: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, textAlign: 'center' },
    startContainer: { alignItems: 'center', paddingVertical: spacing.xl },
    startEmoji: { fontSize: 64, marginBottom: spacing.md },
    startTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.medium, color: theme.textPrimary, marginBottom: spacing.xs },
    startSubtitle: { fontSize: typography.sizes.sm, color: theme.textMuted, textAlign: 'center', marginBottom: spacing.lg },
    button: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl, borderRadius: radius.xl, alignItems: 'center', width: '100%' },
    buttonText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
    secondaryButton: { paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    secondaryButtonText: { color: theme.textMuted, fontSize: typography.sizes.sm },
    footer: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: spacing.md, marginTop: spacing.md },
    footerText: { fontSize: typography.sizes.xs, color: theme.textMuted, textAlign: 'center' },
    outcomeButton: { paddingVertical: spacing.lg, borderRadius: radius.xl, alignItems: 'center', marginBottom: spacing.sm },
    outcomeButtonText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold },
  });

  if (showOutcomeModal) return (
    <View style={styles.overlay}><View style={styles.card}>
      <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.md }}>🌙</Text>
      <Text style={[styles.title, { textAlign: 'center', marginBottom: spacing.xs }]}>How did it go?</Text>
      <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>{currentIntervalIndex + (isComplete ? 1 : 0)} intervals completed</Text>
      <TouchableOpacity style={[styles.outcomeButton, { backgroundColor: '#10b981' }]} onPress={() => handleEndSession('asleep')}><Text style={styles.outcomeButtonText}>😴 {childName || 'Baby'} fell asleep!</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.outcomeButton, { backgroundColor: theme.accentPrimary }]} onPress={() => handleEndSession('comforted')}><Text style={styles.outcomeButtonText}>🤗 Comforted & done for now</Text></TouchableOpacity>
      <TouchableOpacity style={[styles.outcomeButton, { backgroundColor: theme.bgSecondary }]} onPress={() => handleEndSession('stopped')}><Text style={[styles.outcomeButtonText, { color: theme.textSecondary }]}>Just stopped the timer</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowOutcomeModal(false)}><Text style={styles.secondaryButtonText}>← Go back</Text></TouchableOpacity>
    </View></View>
  );

  return (
    <View style={styles.overlay}><View style={styles.card}>
      <View style={styles.header}><TouchableOpacity style={styles.headerButton}><Text style={{ color: theme.textMuted }}>⚙️</Text></TouchableOpacity><Text style={styles.title}>🍼 Cry Timer</Text><TouchableOpacity style={styles.headerButton} onPress={() => hasStartedSession ? setShowOutcomeModal(true) : onClose()}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity></View>
      <View style={styles.intervalsRow}>{intervals.map((interval, idx) => <View key={idx} style={{ alignItems: 'center' }}><View style={[styles.intervalCircle, { backgroundColor: idx < currentIntervalIndex ? theme.successBg : idx === currentIntervalIndex ? theme.accentPrimary : theme.bgSecondary, borderColor: idx === currentIntervalIndex ? theme.accentPrimary : theme.border, transform: [{ scale: idx === currentIntervalIndex ? 1.1 : 1 }] }]}><Text style={[styles.intervalText, { color: idx === currentIntervalIndex ? theme.textInverse : idx < currentIntervalIndex ? theme.success : theme.textMuted }]}>{idx < currentIntervalIndex ? '✓' : `${interval}m`}</Text></View><Text style={styles.intervalLabel}>#{idx + 1}</Text></View>)}</View>
      {hasStartedSession ? (<>
        <View style={styles.timerContainer}><Animated.View style={[styles.timerCircle, { borderColor: isComplete ? theme.success : isPaused ? theme.textMuted : theme.accentPrimary, transform: [{ scale: pulseAnim }] }]}><Text style={[styles.timerText, { color: isComplete ? theme.success : isPaused ? theme.textMuted : theme.textPrimary }]}>{formatTime(secondsLeft)}</Text><Text style={[styles.timerSubtext, { color: isComplete ? theme.success : theme.textMuted }]}>{isComplete ? '✓ Time to comfort!' : isPaused ? 'PAUSED' : `Interval ${currentIntervalIndex + 1} of ${intervals.length}`}</Text></Animated.View></View>
        {encouragement && <View style={[styles.encouragementBox, { backgroundColor: isComplete ? theme.successBg : theme.accentLight }]}><Text style={[styles.encouragementText, { color: isComplete ? theme.success : theme.accentPrimary }]}>{encouragement}</Text></View>}
        {isComplete ? (<><TouchableOpacity style={[styles.button, { backgroundColor: theme.accentPrimary }]} onPress={nextInterval}><Text style={styles.buttonText}>▶ Start Next ({intervals[Math.min(currentIntervalIndex + 1, intervals.length - 1)]}m)</Text></TouchableOpacity><TouchableOpacity style={[styles.button, { backgroundColor: '#10b981', marginTop: spacing.sm }]} onPress={() => setShowOutcomeModal(true)}><Text style={styles.buttonText}>😴 {childName || 'Baby'} fell asleep!</Text></TouchableOpacity></>) : isPaused ? (<><TouchableOpacity style={[styles.button, { backgroundColor: theme.accentPrimary }]} onPress={resumeTimer}><Text style={styles.buttonText}>▶ Resume</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setShowOutcomeModal(true)}><Text style={styles.secondaryButtonText}>Stop Session</Text></TouchableOpacity></>) : (<><TouchableOpacity style={[styles.button, { backgroundColor: theme.bgSecondary, borderWidth: 2, borderColor: theme.border }]} onPress={pauseTimer}><Text style={[styles.buttonText, { color: theme.textPrimary }]}>⏸ Pause</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => setShowOutcomeModal(true)}><Text style={styles.secondaryButtonText}>Stop Session</Text></TouchableOpacity></>)}
      </>) : (
        <View style={styles.startContainer}><Text style={styles.startEmoji}>⏱️</Text><Text style={styles.startTitle}>Ferber Sleep Training</Text><Text style={styles.startSubtitle}>Graduated waiting: {intervals.join(' → ')} min</Text><TouchableOpacity style={[styles.button, { backgroundColor: '#f59e0b' }]} onPress={startTimer}><Text style={styles.buttonText}>🍼 Start Timer</Text></TouchableOpacity><Text style={{ color: theme.textMuted, fontSize: typography.sizes.sm, textAlign: 'center', marginTop: spacing.md }}>Press when {childName || 'baby'} starts crying.{'\n'}You'll be alerted when it's time to comfort.</Text></View>
      )}
      <View style={styles.footer}><Text style={styles.footerText}>💡 Brief comfort (1-2 min), then restart if still crying</Text></View>
    </View></View>
  );
}
