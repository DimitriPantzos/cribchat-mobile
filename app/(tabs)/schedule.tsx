import { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery } from 'convex/react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../convex/_generated/api';
import { colors, spacing, radius, typography } from '../../lib/theme';
import { getAgeFromBirthdate, getAgeDisplay, getGuidelinesForAge, getFeedingGuidelinesForAge, formatTimeDisplay, formatDuration } from '../../lib/scheduleUtils';

export default function Schedule() {
  const { user } = useUser();
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;
  const convexUser = useQuery(api.users.getByClerkId, user?.id ? { clerkId: user.id } : 'skip');
  const children = useQuery(api.children.getByUser, convexUser?._id ? { userId: convexUser._id } : 'skip');
  const child = children?.[0];
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = useQuery(api.dailyLogs.getByDate, child?._id ? { childId: child._id, date: today } : 'skip');

  const ageInMonths = useMemo(() => child?.birthDate ? getAgeFromBirthdate(child.birthDate) : 9, [child]);
  const guidelines = useMemo(() => getGuidelinesForAge(ageInMonths), [ageInMonths]);
  const feedingGuidelines = useMemo(() => getFeedingGuidelinesForAge(ageInMonths), [ageInMonths]);

  const timelineEvents = useMemo(() => {
    const events: Array<{ time: string; label: string }> = [];
    if (dailyLog?.wakeTime) events.push({ time: dailyLog.wakeTime, label: '🌅 Wake Up' });
    dailyLog?.naps?.forEach((nap, i) => { events.push({ time: nap.startTime, label: `😴 Nap ${i + 1}` }); if (nap.endTime) events.push({ time: nap.endTime, label: `☀️ Wake (${nap.duration}m)` }); });
    dailyLog?.bottles?.forEach((b) => events.push({ time: b.time, label: `🍼 ${b.amount ? b.amount + 'oz' : 'Bottle'}` }));
    dailyLog?.meals?.forEach((m) => events.push({ time: m.time, label: `🥣 ${m.type}` }));
    dailyLog?.diapers?.forEach((d) => events.push({ time: d.time, label: `👶 ${d.type === 'wet' ? 'Pee' : d.type === 'dirty' ? 'Poop' : 'Both'}` }));
    if (dailyLog?.bedtime) events.push({ time: dailyLog.bedtime, label: '🌙 Bedtime' });
    events.sort((a, b) => { const [ah, am] = a.time.split(':').map(Number); const [bh, bm] = b.time.split(':').map(Number); return (ah * 60 + am) - (bh * 60 + bm); });
    return events;
  }, [dailyLog]);

  const totalNapMinutes = dailyLog?.naps?.reduce((sum, nap) => sum + (nap.duration || 0), 0) || 0;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bgPrimary },
    header: { padding: spacing.md },
    title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: theme.textPrimary },
    subtitle: { fontSize: typography.sizes.sm, color: theme.textMuted, marginTop: 4 },
    content: { padding: spacing.md, paddingBottom: 100 },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: { flex: 1, backgroundColor: theme.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border },
    statEmoji: { fontSize: 24, marginBottom: spacing.xs },
    statValue: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, color: theme.textPrimary },
    statLabel: { fontSize: typography.sizes.xs, color: theme.textMuted },
    guidelinesCard: { backgroundColor: theme.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: theme.border },
    guidelinesTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: theme.textPrimary, marginBottom: spacing.sm },
    guidelinesRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
    guidelinesLabel: { color: theme.textSecondary, fontSize: typography.sizes.sm },
    guidelinesValue: { color: theme.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.medium },
    timelineCard: { backgroundColor: theme.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: theme.border },
    timelineTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: theme.textPrimary, marginBottom: spacing.md },
    timelineItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.border },
    timelineTime: { width: 70, color: theme.textMuted, fontSize: typography.sizes.sm },
    timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accentPrimary, marginRight: spacing.sm },
    timelineLabel: { flex: 1, color: theme.textPrimary, fontSize: typography.sizes.sm },
    emptyTimeline: { paddingVertical: spacing.xl, alignItems: 'center' },
    emptyText: { color: theme.textMuted, fontSize: typography.sizes.sm },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}><View style={styles.header}><Text style={styles.title}>📅 Schedule</Text><Text style={styles.subtitle}>{child?.name} • {getAgeDisplay(ageInMonths)} • {guidelines.ageRange}</Text></View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statsRow}><View style={styles.statCard}><Text style={styles.statEmoji}>💤</Text><Text style={styles.statValue}>{formatDuration(totalNapMinutes) || '0m'}</Text><Text style={styles.statLabel}>Nap Time</Text></View><View style={styles.statCard}><Text style={styles.statEmoji}>🍼</Text><Text style={styles.statValue}>{dailyLog?.bottles?.length || 0}</Text><Text style={styles.statLabel}>Bottles</Text></View><View style={styles.statCard}><Text style={styles.statEmoji}>👶</Text><Text style={styles.statValue}>{dailyLog?.diapers?.length || 0}</Text><Text style={styles.statLabel}>Diapers</Text></View></View>
        <View style={styles.guidelinesCard}><Text style={styles.guidelinesTitle}>💡 Age Guidelines</Text><View style={styles.guidelinesRow}><Text style={styles.guidelinesLabel}>Target Naps</Text><Text style={styles.guidelinesValue}>{guidelines.napCount} naps/day</Text></View><View style={styles.guidelinesRow}><Text style={styles.guidelinesLabel}>Day Sleep</Text><Text style={styles.guidelinesValue}>{guidelines.totalDaySleep}</Text></View><View style={styles.guidelinesRow}><Text style={styles.guidelinesLabel}>Night Sleep</Text><Text style={styles.guidelinesValue}>{guidelines.nightSleep}</Text></View><View style={styles.guidelinesRow}><Text style={styles.guidelinesLabel}>First Wake Window</Text><Text style={styles.guidelinesValue}>{formatDuration(guidelines.firstWW)}</Text></View></View>
        <View style={styles.timelineCard}><Text style={styles.timelineTitle}>📝 Today's Log</Text>{timelineEvents.length > 0 ? timelineEvents.map((e, i) => <View key={`${e.time}-${i}`} style={[styles.timelineItem, i === timelineEvents.length - 1 && { borderBottomWidth: 0 }]}><Text style={styles.timelineTime}>{formatTimeDisplay(e.time)}</Text><View style={styles.timelineDot} /><Text style={styles.timelineLabel}>{e.label}</Text></View>) : <View style={styles.emptyTimeline}><Text style={styles.emptyText}>No activities logged yet today</Text></View>}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
