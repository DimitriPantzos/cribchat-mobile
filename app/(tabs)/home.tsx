import { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, Modal, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { colors, spacing, radius, typography } from '../../lib/theme';
import { getAgeFromBirthdate, getGuidelinesForAge, getFeedingGuidelinesForAge, formatTimeDisplay, formatTimeSince, formatDuration, getCurrentTime, getNextNapTime } from '../../lib/scheduleUtils';
import NapTimer from '../../components/NapTimer';
import BreastFeedTimer from '../../components/BreastFeedTimer';
import QuickLogModal from '../../components/QuickLogModal';
import SmartInsights from '../../components/SmartInsights';

export default function Home() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  const convexUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : 'skip');
  const children = useQuery(api.children.getByUser, convexUser?._id ? { userId: convexUser._id } : 'skip');
  const today = new Date().toISOString().split('T')[0];
  const child = children?.[0];
  const dailyLog = useQuery(api.dailyLogs.getByDate, child?._id ? { childId: child._id, date: today } : 'skip');
  const activeNapSession = useQuery(api.napTimer.getActive, child?._id ? { childId: child._id } : 'skip');
  const activeBreastfeedSession = useQuery(api.breastfeedTimer.getActive, child?._id ? { childId: child._id } : 'skip');

  const logBottle = useMutation(api.dailyLogs.logBottle);
  const logMeal = useMutation(api.dailyLogs.logMeal);
  const logDiaper = useMutation(api.dailyLogs.logDiaper);
  const setWakeTime = useMutation(api.dailyLogs.setWakeTime);

  const [showNapTimer, setShowNapTimer] = useState(false);
  const [showBreastFeedTimer, setShowBreastFeedTimer] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState<'bottle' | 'meal' | 'diaper' | null>(null);

  // Auto-show timers when there's an active session (persist across app navigation)
  useEffect(() => {
    if (activeNapSession && !showNapTimer) setShowNapTimer(true);
  }, [activeNapSession]);

  useEffect(() => {
    if (activeBreastfeedSession && !showBreastFeedTimer) setShowBreastFeedTimer(true);
  }, [activeBreastfeedSession]);

  const ageInMonths = useMemo(() => child?.birthDate ? getAgeFromBirthdate(child.birthDate) : 9, [child]);
  const guidelines = useMemo(() => getGuidelinesForAge(ageInMonths), [ageInMonths]);
  const feedingGuidelines = useMemo(() => getFeedingGuidelinesForAge(ageInMonths), [ageInMonths]);
  const lastBottle = dailyLog?.bottles?.[dailyLog.bottles.length - 1];
  const lastMeal = dailyLog?.meals?.[dailyLog.meals.length - 1];
  const lastDiaper = dailyLog?.diapers?.[dailyLog.diapers.length - 1];
  const lastNap = dailyLog?.naps?.[dailyLog.naps.length - 1];
  const totalNapMinutes = dailyLog?.naps?.reduce((sum, nap) => sum + (nap.duration || 0), 0) || 0;
  const nextNap = useMemo(() => activeNapSession ? null : getNextNapTime(dailyLog?.wakeTime, dailyLog?.naps || [], ageInMonths), [dailyLog, ageInMonths, activeNapSession]);

  const handleQuickBottle = async (oz?: number) => { if (convexUser?._id && child?._id) { await logBottle({ userId: convexUser._id, childId: child._id, time: getCurrentTime(), type: 'bottle', amount: oz }); setShowQuickLog(null); } };
  const handleQuickMeal = async (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => { if (convexUser?._id && child?._id) { await logMeal({ userId: convexUser._id, childId: child._id, time: getCurrentTime(), type }); setShowQuickLog(null); } };
  const handleQuickDiaper = async (type: 'wet' | 'dirty' | 'both') => { if (convexUser?._id && child?._id) { await logDiaper({ userId: convexUser._id, childId: child._id, time: getCurrentTime(), type }); setShowQuickLog(null); } };
  const handleSetWakeNow = async () => { if (convexUser?._id && child?._id) await setWakeTime({ userId: convexUser._id, childId: child._id, wakeTime: getCurrentTime() }); };
  const formatTimeFromString = (timeStr: string): number => { const t = new Date(); const [h, m] = timeStr.split(':').map(Number); t.setHours(h, m, 0, 0); return t.getTime(); };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.accentPrimary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
    childName: { fontSize: typography.sizes.lg, fontWeight: typography.weights.semibold, color: theme.textPrimary },
    headerRight: { flexDirection: 'row', gap: spacing.sm },
    headerButton: { padding: spacing.sm, borderRadius: radius.md, backgroundColor: theme.bgCard },
    scrollContent: { padding: spacing.md, paddingBottom: 100 },
    sweetSpotCard: { borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sweetSpotLabel: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.2)', alignSelf: 'flex-start', marginBottom: spacing.xs },
    sweetSpotLabelText: { color: 'white', fontSize: 10, fontWeight: typography.weights.bold },
    sweetSpotTitle: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
    sweetSpotSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm },
    sweetSpotEmoji: { fontSize: 48 },
    ageText: { textAlign: 'center', fontSize: typography.sizes.xs, color: theme.textMuted, marginTop: spacing.sm },
    card: { borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    cardEmoji: { fontSize: 36 },
    cardTitle: { color: 'white', fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
    cardSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: typography.sizes.sm },
    cardBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.2)' },
    cardBadgeText: { color: 'white', fontSize: typography.sizes.xs, fontWeight: typography.weights.bold },
    gridRow: { flexDirection: 'row', gap: spacing.sm },
    gridCard: { flex: 1, borderRadius: radius.xl, padding: spacing.md },
    gridCardEmoji: { fontSize: 28, marginBottom: spacing.sm },
    gridCardTitle: { color: 'white', fontWeight: typography.weights.bold },
    gridCardSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sizes.xs },
    wakeButton: { position: 'absolute', bottom: 80, left: spacing.md, right: spacing.md, borderRadius: radius.xl, padding: spacing.lg, alignItems: 'center' },
    wakeButtonText: { color: 'white', fontSize: typography.sizes.lg, fontWeight: typography.weights.bold },
  });

  if (!isLoaded || (convexUser && children === undefined)) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.accentPrimary} /></View></SafeAreaView>;
  if (!children?.length) return <SafeAreaView style={styles.container}><View style={styles.loadingContainer}><Text style={{ color: theme.textPrimary, marginBottom: spacing.md }}>Add a child profile to get started</Text><TouchableOpacity style={{ backgroundColor: theme.accentPrimary, padding: spacing.md, borderRadius: radius.md }} onPress={() => router.push('/onboarding')}><Text style={{ color: 'white', fontWeight: typography.weights.semibold }}>Add Child</Text></TouchableOpacity></View></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{child?.name?.[0] || 'G'}</Text></View>
          <Text style={styles.childName}>{child?.name}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/schedule')}><Text>📅</Text></TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.push('/(tabs)/profile')}><Text>⚙️</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity style={[styles.sweetSpotCard, { backgroundColor: theme.accentPrimary }]} activeOpacity={0.9}>
          <View>
            <View style={styles.sweetSpotLabel}><Text style={styles.sweetSpotLabelText}>SweetSpot 📅</Text></View>
            {activeNapSession ? <><Text style={styles.sweetSpotTitle}>Currently Napping 💤</Text><Text style={styles.sweetSpotSubtitle}>Tap Sleep card to end nap</Text></> : nextNap ? <><Text style={styles.sweetSpotTitle}>In {nextNap.minutesUntil > 60 ? `${Math.floor(nextNap.minutesUntil / 60)}h ${nextNap.minutesUntil % 60}m` : `${nextNap.minutesUntil}m`}</Text><Text style={styles.sweetSpotSubtitle}>Nap time near {formatTimeDisplay(nextNap.time)}</Text></> : !dailyLog?.wakeTime ? <><Text style={styles.sweetSpotTitle}>Good morning! ☀️</Text><Text style={styles.sweetSpotSubtitle}>Log wake time to see nap prediction</Text></> : <><Text style={styles.sweetSpotTitle}>All naps complete! 🌙</Text><Text style={styles.sweetSpotSubtitle}>Bedtime at {dailyLog?.bedtime ? formatTimeDisplay(dailyLog.bedtime) : '~7:30 PM'}</Text></>}
          </View>
          <Text style={styles.sweetSpotEmoji}>{activeNapSession ? '😴' : '👶'}</Text>
        </TouchableOpacity>
        <Text style={styles.ageText}>{guidelines.napCount}-nap day • {guidelines.ageRange}</Text>

        <SmartInsights
          childName={child?.name}
          ageInMonths={ageInMonths}
          isCurrentlySleeping={!!activeNapSession}
          currentSleepStartTime={activeNapSession?.startTime}
          wakeTime={dailyLog?.wakeTime}
          lastNapEndTime={lastNap?.endTime}
          totalNightSleepMinutes={0}
          totalDaySleepMinutes={totalNapMinutes}
        />

        <TouchableOpacity style={[styles.card, { backgroundColor: '#6366f1', marginTop: spacing.md }]} activeOpacity={0.9} onPress={() => setShowNapTimer(true)}>
          <View style={[styles.cardRow, { justifyContent: 'space-between' }]}>
            <View style={[styles.cardRow, { flex: 1 }]}>
              <Text style={styles.cardEmoji}>💤</Text>
              <View><Text style={styles.cardTitle}>Sleep</Text><Text style={styles.cardSubtitle}>{activeNapSession ? 'Napping now...' : lastNap?.endTime ? formatTimeSince(formatTimeFromString(lastNap.endTime)) : dailyLog?.wakeTime ? `Woke at ${formatTimeDisplay(dailyLog.wakeTime)}` : 'Not logged'}{totalNapMinutes > 0 && ` • ${formatDuration(totalNapMinutes)} today`}</Text></View>
            </View>
            {activeNapSession && <View style={styles.cardBadge}><Text style={styles.cardBadgeText}>ACTIVE</Text></View>}
          </View>
        </TouchableOpacity>

        <View style={[styles.gridRow, { marginTop: spacing.sm }]}>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#8b5cf6' }]} activeOpacity={0.9} onPress={() => setShowBreastFeedTimer(true)}>
            <Text style={styles.gridCardEmoji}>🤱</Text><Text style={styles.gridCardTitle}>Nursing</Text><Text style={styles.gridCardSubtitle}>{activeBreastfeedSession ? 'In progress...' : 'Tap to start'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: '#a78bfa' }]} activeOpacity={0.9} onPress={() => setShowQuickLog('bottle')}>
            <Text style={styles.gridCardEmoji}>🍼</Text><Text style={styles.gridCardTitle}>Bottle</Text><Text style={styles.gridCardSubtitle}>{lastBottle ? `${formatTimeSince(formatTimeFromString(lastBottle.time))}${lastBottle.amount ? ` • ${lastBottle.amount}oz` : ''}` : 'Not logged'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#f472b6' }]} activeOpacity={0.9} onPress={() => setShowQuickLog('meal')}>
          <View style={styles.cardRow}><Text style={styles.cardEmoji}>🥣</Text><View><Text style={styles.cardTitle}>Solids</Text><Text style={styles.cardSubtitle}>{lastMeal ? `${formatTimeSince(formatTimeFromString(lastMeal.time))} • ${lastMeal.type}` : 'Not logged'}{dailyLog?.meals?.length ? ` (${dailyLog.meals.length}/${feedingGuidelines.mealsPerDay + feedingGuidelines.snacksPerDay} meals)` : ''}</Text></View></View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, { backgroundColor: '#64748b' }]} activeOpacity={0.9} onPress={() => setShowQuickLog('diaper')}>
          <View style={styles.cardRow}><Text style={styles.cardEmoji}>👶</Text><View><Text style={styles.cardTitle}>Diaper</Text><Text style={styles.cardSubtitle}>{lastDiaper ? `${formatTimeSince(formatTimeFromString(lastDiaper.time))} • ${lastDiaper.type === 'wet' ? 'Pee' : lastDiaper.type === 'dirty' ? 'Poop' : 'Both'}` : 'Not logged'}</Text></View></View>
        </TouchableOpacity>
      </ScrollView>

      {!dailyLog?.wakeTime && <TouchableOpacity style={[styles.wakeButton, { backgroundColor: '#f59e0b' }]} onPress={handleSetWakeNow}><Text style={styles.wakeButtonText}>☀️ Log Wake Time Now</Text></TouchableOpacity>}

      <Modal visible={showNapTimer} animationType="slide" transparent>{convexUser?._id && child?._id && <NapTimer childId={child._id} userId={convexUser._id} childName={child?.name} onClose={() => setShowNapTimer(false)} />}</Modal>
      <Modal visible={showBreastFeedTimer} animationType="slide" transparent>{convexUser?._id && child?._id && <BreastFeedTimer childId={child._id} userId={convexUser._id} childName={child?.name} onClose={() => setShowBreastFeedTimer(false)} />}</Modal>
      <QuickLogModal visible={showQuickLog === 'bottle'} type="bottle" onClose={() => setShowQuickLog(null)} onLogBottle={handleQuickBottle} theme={theme} />
      <QuickLogModal visible={showQuickLog === 'meal'} type="meal" onClose={() => setShowQuickLog(null)} onLogMeal={handleQuickMeal} theme={theme} />
      <QuickLogModal visible={showQuickLog === 'diaper'} type="diaper" onClose={() => setShowQuickLog(null)} onLogDiaper={handleQuickDiaper} theme={theme} />
    </SafeAreaView>
  );
}
