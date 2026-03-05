import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Animated } from 'react-native';
import { useQuery, useMutation } from 'convex/react';
import * as Haptics from 'expo-haptics';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';
import { colors, spacing, radius, typography } from '../lib/theme';

interface NapTimerProps { childId: string; userId: string; childName?: string; onClose: () => void; }

type NapLocation = 'crib' | 'stroller' | 'car' | 'carrier' | 'contact' | 'other';
type NapQuality = 'great' | 'okay' | 'rough';

const LOCATION_OPTIONS: { value: NapLocation; emoji: string; label: string }[] = [
  { value: 'crib', emoji: '🛏️', label: 'Crib' }, { value: 'stroller', emoji: '🚼', label: 'Stroller' },
  { value: 'car', emoji: '🚗', label: 'Car' }, { value: 'carrier', emoji: '🦺', label: 'Carrier' },
  { value: 'contact', emoji: '🤱', label: 'Contact' }, { value: 'other', emoji: '📍', label: 'Other' },
];

const QUALITY_OPTIONS: { value: NapQuality; emoji: string; label: string }[] = [
  { value: 'great', emoji: '😴', label: 'Great' }, { value: 'okay', emoji: '😐', label: 'Okay' }, { value: 'rough', emoji: '😫', label: 'Rough' },
];

const ENCOURAGING_MESSAGES = ["Sweet dreams! 🌙", "Rest time is growing time 💜", "Recharging batteries! ⚡", "Dream big, little one 💫"];

export default function NapTimer({ childId, userId, childName, onClose }: NapTimerProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const [selectedLocation, setSelectedLocation] = useState<NapLocation>('crib');
  const [selectedQuality, setSelectedQuality] = useState<NapQuality>('great');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showEndModal, setShowEndModal] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const activeNap = useQuery(api.napTimer.getActive, { childId: childId as Id<'children'> });
  const startNap = useMutation(api.napTimer.start);
  const stopNap = useMutation(api.napTimer.stop);
  const cancelNap = useMutation(api.napTimer.cancel);
  const updateLocation = useMutation(api.napTimer.updateLocation);
  const isNapActive = !!activeNap;

  useEffect(() => { if (isNapActive) { Animated.loop(Animated.sequence([Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }), Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })])).start(); } }, [isNapActive]);
  useEffect(() => { if (activeNap?.startTime) { const update = () => setElapsedSeconds(Math.floor((Date.now() - activeNap.startTime) / 1000)); update(); const i = setInterval(update, 1000); return () => clearInterval(i); } else { setElapsedSeconds(0); } }, [activeNap?.startTime]);
  useEffect(() => { if (isNapActive) { setEncouragement(ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]); const i = setInterval(() => setEncouragement(ENCOURAGING_MESSAGES[Math.floor(Math.random() * ENCOURAGING_MESSAGES.length)]), 30000); return () => clearInterval(i); } }, [isNapActive]);
  useEffect(() => { if (activeNap?.location) setSelectedLocation(activeNap.location); }, [activeNap?.location]);

  const formatTime = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60; return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`; };
  const formatDuration = (s: number) => { const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; };
  const handleStartNap = async () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); await startNap({ userId: userId as Id<'users'>, childId: childId as Id<'children'>, location: selectedLocation }); };
  const handleStopNap = async () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); await stopNap({ childId: childId as Id<'children'>, quality: selectedQuality, timezoneOffset: new Date().getTimezoneOffset() }); onClose(); };
  const handleCancelNap = async () => { await cancelNap({ childId: childId as Id<'children'> }); onClose(); };
  const handleLocationChange = async (loc: NapLocation) => { Haptics.selectionAsync(); setSelectedLocation(loc); if (isNapActive) await updateLocation({ childId: childId as Id<'children'>, location: loc }); };

  const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.95)', justifyContent: 'center', alignItems: 'center', padding: spacing.md },
    card: { backgroundColor: theme.bgCard, borderRadius: radius.xl, padding: spacing.lg, width: '100%', maxWidth: 360, borderWidth: 1, borderColor: theme.border },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    title: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: theme.textPrimary },
    closeButton: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: theme.bgSecondary },
    timerContainer: { alignItems: 'center', marginBottom: spacing.lg },
    timerCircle: { width: 180, height: 180, borderRadius: 90, borderWidth: 6, borderColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.1)' },
    timerText: { fontSize: 44, fontWeight: typography.weights.bold, color: theme.textPrimary },
    timerSubtext: { fontSize: typography.sizes.sm, color: theme.textMuted, marginTop: spacing.xs },
    encouragementBox: { backgroundColor: theme.accentLight, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.lg, alignItems: 'center' },
    encouragementText: { color: theme.accentPrimary, fontWeight: typography.weights.medium },
    locationLabel: { fontSize: typography.sizes.sm, color: theme.textMuted, marginBottom: spacing.sm, textAlign: 'center' },
    locationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    locationButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md },
    locationButtonText: { fontSize: typography.sizes.sm },
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
    qualityLabel: { fontSize: typography.sizes.sm, color: theme.textSecondary, marginBottom: spacing.sm, textAlign: 'center' },
    qualityRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    qualityButton: { alignItems: 'center', padding: spacing.md, borderRadius: radius.lg },
    qualityEmoji: { fontSize: 24, marginBottom: 4 },
    qualityText: { fontSize: typography.sizes.xs, fontWeight: typography.weights.medium },
  });

  if (showEndModal) return (
    <View style={styles.overlay}><View style={styles.card}>
      <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: spacing.md }}>☀️</Text>
      <Text style={[styles.title, { textAlign: 'center', marginBottom: spacing.xs }]}>{childName || 'Baby'} is awake!</Text>
      <Text style={{ color: theme.textMuted, textAlign: 'center', marginBottom: spacing.lg }}>Nap duration: <Text style={{ fontWeight: typography.weights.semibold }}>{formatDuration(elapsedSeconds)}</Text></Text>
      <Text style={styles.qualityLabel}>How was the nap?</Text>
      <View style={styles.qualityRow}>{QUALITY_OPTIONS.map((o) => <TouchableOpacity key={o.value} style={[styles.qualityButton, { backgroundColor: selectedQuality === o.value ? theme.accentPrimary : theme.bgSecondary, transform: [{ scale: selectedQuality === o.value ? 1.1 : 1 }] }]} onPress={() => setSelectedQuality(o.value)}><Text style={styles.qualityEmoji}>{o.emoji}</Text><Text style={[styles.qualityText, { color: selectedQuality === o.value ? 'white' : theme.textPrimary }]}>{o.label}</Text></TouchableOpacity>)}</View>
      <TouchableOpacity style={[styles.button, { backgroundColor: '#10b981' }]} onPress={handleStopNap}><Text style={styles.buttonText}>✓ Log Nap</Text></TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowEndModal(false)}><Text style={styles.secondaryButtonText}>← Go back</Text></TouchableOpacity>
    </View></View>
  );

  return (
    <View style={styles.overlay}><View style={styles.card}>
      <View style={styles.header}><View style={{ width: 40 }} /><Text style={styles.title}>😴 Nap Timer</Text><TouchableOpacity style={styles.closeButton} onPress={isNapActive ? handleCancelNap : onClose}><Text style={{ color: theme.textMuted }}>✕</Text></TouchableOpacity></View>
      {isNapActive ? (
        <>
          <View style={styles.timerContainer}><Animated.View style={[styles.timerCircle, { transform: [{ scale: pulseAnim }] }]}><Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text><Text style={styles.timerSubtext}>{childName || 'Baby'} is napping</Text></Animated.View></View>
          {encouragement && <View style={styles.encouragementBox}><Text style={styles.encouragementText}>{encouragement}</Text></View>}
          <Text style={styles.locationLabel}>Nap location</Text>
          <View style={styles.locationGrid}>{LOCATION_OPTIONS.map((o) => <TouchableOpacity key={o.value} style={[styles.locationButton, { backgroundColor: selectedLocation === o.value ? theme.accentPrimary : theme.bgSecondary }]} onPress={() => handleLocationChange(o.value)}><Text style={[styles.locationButtonText, { color: selectedLocation === o.value ? 'white' : theme.textPrimary }]}>{o.emoji} {o.label}</Text></TouchableOpacity>)}</View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#f59e0b' }]} onPress={() => setShowEndModal(true)}><Text style={styles.buttonText}>☀️ Baby Woke Up</Text></TouchableOpacity>
          <Text style={{ color: theme.textMuted, fontSize: typography.sizes.xs, textAlign: 'center', marginTop: spacing.md }}>Timer persists even if you leave the app</Text>
        </>
      ) : (
        <View style={styles.startContainer}>
          <Text style={styles.startEmoji}>💤</Text><Text style={styles.startTitle}>Start Nap Timer</Text><Text style={styles.startSubtitle}>Track {childName || 'baby'}'s nap in real-time</Text>
          <Text style={styles.locationLabel}>Where is {childName || 'baby'} napping?</Text>
          <View style={styles.locationGrid}>{LOCATION_OPTIONS.map((o) => <TouchableOpacity key={o.value} style={[styles.locationButton, { backgroundColor: selectedLocation === o.value ? theme.accentPrimary : theme.bgSecondary }]} onPress={() => handleLocationChange(o.value)}><Text style={[styles.locationButtonText, { color: selectedLocation === o.value ? 'white' : theme.textPrimary }]}>{o.emoji} {o.label}</Text></TouchableOpacity>)}</View>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#8b5cf6', width: '100%' }]} onPress={handleStartNap}><Text style={styles.buttonText}>😴 Start Nap</Text></TouchableOpacity>
        </View>
      )}
      <View style={styles.footer}><Text style={styles.footerText}>💡 Consistent nap times help establish healthy sleep patterns</Text></View>
    </View></View>
  );
}
