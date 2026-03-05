import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Animated } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { colors, spacing, radius, typography } from '../lib/theme';

interface BreastFeedTimerProps { childId: string; userId: string; childName?: string; onClose: () => void; }

type Side = 'left' | 'right';

export default function BreastFeedTimer({ childId, userId, childName, onClose }: BreastFeedTimerProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [selectedSide, setSelectedSide] = useState<Side>('left');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeSession = useQuery(api.breastfeedTimer.getActive, { childId: childId as Id<'children'> });
  const startSession = useMutation(api.breastfeedTimer.start);
  const stopSession = useMutation(api.breastfeedTimer.stop);
  const cancelSession = useMutation(api.breastfeedTimer.cancel);
  const isActive = !!activeSession;

  useEffect(() => { if (isActive) { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.03, duration: 1500, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true })])).start(); } }, [isActive]);
  useEffect(() => { if (activeSession?.startTime) { const update = () => setElapsedSeconds(Math.floor((Date.now() - activeSession.startTime) / 1000)); update(); const i = setInterval(update, 1000); return () => clearInterval(i); } else { setElapsedSeconds(0); } }, [activeSession?.startTime]);
  useEffect(() => { if (activeSession?.side) setSelectedSide(activeSession.side); }, [activeSession?.side]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const handleStart = async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await startSession({ userId: userId as Id<'users'>, childId: childId as Id<'children'>, side: selectedSide }); };
  const handleStop = async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await stopSession({ childId: childId as Id<'children'>, timezoneOffset: new Date().getTimezoneOffset() }); onClose(); };
  const handleCancel = async () => { await cancelSession({ childId: childId as Id<'children'> }); onClose(); };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
    card: { backgroundColor: theme.bgCard, borderRadius: radius.xl, padding: spacing.lg, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: theme.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: theme.textPrimary },
    closeButton: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: theme.bgSecondary },
    timerContainer: { alignItems: 'center', marginBottom: spacing.lg },
    timerCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 6, borderColor: '#ec4899', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(236, 72, 153, 0.1)' },
    timerText: { fontSize: 44, fontWeight: typography.weights.bold, color: theme.textPrimary },
    timerSubtext: { fontSize: typography.sizes.sm, color: theme.textMuted, marginTop: spacing.xs },
    sideLabel: { fontSize: typography.sizes.sm, color: theme.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
    sideRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.lg },
    sideButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.xl, alignItems: 'center' },
    sideEmoji: { fontSize: 36, marginBottom: spacing.xs },
    sideText: { fontWeight: typography.weights.semibold },
    button: { paddingVertical: spacing.lg, borderRadius: radius.xl, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
    secondaryButton: { paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
    secondaryButtonText: { color: theme.textMuted, fontSize: typography.sizes.sm },
    startContainer: { alignItems: 'center', paddingVertical: spacing.lg },
    startEmoji: { fontSize: 64, marginBottom: spacing.md },
    startTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.medium, color: theme.textPrimary, marginBottom: spacing.sm },
    startSubtitle: { fontSize: typography.sizes.sm, color: theme.textMuted, marginBottom: spacing.lg },
    footer: { borderTopWidth: 1, borderTopColor: theme.border, paddingTop: spacing.md, marginTop: spacing.md },
    footerText: { fontSize: typography.sizes.xs, color: theme.textMuted, textAlign: 'center' },
  });

  return (
    <View style={styles.overlay}><View style={styles.card}>
      <View style={styles.header}><View style={{ width: 40 }} /><Text style={styles.title}>🤱 Nursing Timer</Text><TouchableOpacity style={styles.closeButton} onPress={isActive ? handleCancel : onClose}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity></View>
      {isActive ? (
        <>
          <View style={styles.timerContainer}><Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}><Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text><Text style={styles.timerSubtext}>{selectedSide === 'left' ? '← Left side' : 'Right side →'}</Text></Animated.View></View>
          <Text style={styles.sideLabel}>Switch sides?</Text>
          <View style={styles.sideRow}>
            <TouchableOpacity style={[styles.sideButton, { backgroundColor: selectedSide === 'left' ? '#ec4899' : theme.bgSecondary }]} onPress={() => setSelectedSide('left')}><Text style={styles.sideEmoji}>←</Text><Text style={[styles.sideText, { color: selectedSide === 'left' ? 'white' : theme.textPrimary }]}>Left</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.sideButton, { backgroundColor: selectedSide === 'right' ? '#ec4899' : theme.bgSecondary }]} onPress={() => setSelectedSide('right')}><Text style={styles.sideEmoji}>→</Text><Text style={[styles.sideText, { color: selectedSide === 'right' ? 'white' : theme.textPrimary }]}>Right</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#10b981' }]} onPress={handleStop}><Text style={styles.buttonText}>✓ Done Feeding</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}><Text style={styles.secondaryButtonText}>Cancel (don't log)</Text></TouchableOpacity>
        </>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.startEmoji}>🤱</Text><Text style={styles.startTitle}>Start Nursing</Text><Text style={styles.startSubtitle}>Track feeding time for {childName || 'baby'}</Text>
          <Text style={styles.sideLabel}>Which side first?</Text>
          <View style={styles.sideRow}>
            <TouchableOpacity style={[styles.sideButton, { backgroundColor: selectedSide === 'left' ? '#ec4899' : theme.bgSecondary }]} onPress={() => setSelectedSide('left')}><Text style={styles.sideEmoji}>←</Text><Text style={[styles.sideText, { color: selectedSide === 'left' ? 'white' : theme.textPrimary }]}>Left</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.sideButton, { backgroundColor: selectedSide === 'right' ? '#ec4899' : theme.bgSecondary }]} onPress={() => setSelectedSide('right')}><Text style={styles.sideEmoji}>→</Text><Text style={[styles.sideText, { color: selectedSide === 'right' ? 'white' : theme.textPrimary }]}>Right</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#ec4899', width: '100%' }]} onPress={handleStart}><Text style={styles.buttonText}>🤱 Start Nursing</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.footer}><Text style={styles.footerText}>💡 Timer persists even if you leave the app</Text></View>
    </View></View>
  );
}
