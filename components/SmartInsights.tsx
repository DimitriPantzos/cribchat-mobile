import { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  getSleepNeedsForAge,
  getNightWakeGuidance,
  getDuringSleepGuidance,
  getMorningWakeGuidance,
  getRandomCalmTip,
  getCurrentDevelopmentalContext,
  generateDayProjection,
  type GuidanceMessage,
} from '../lib/sleepScience';
import { useTheme, spacing, radius, typography } from '../lib/theme';

type InsightScenario = 
  | 'sleeping'
  | 'night_wake'
  | 'morning_wake'
  | 'pre_nap'
  | 'napping';

interface SmartInsightsProps {
  childName?: string;
  ageInMonths: number;
  isCurrentlySleeping: boolean;
  currentSleepStartTime?: number;
  bedtime?: string;
  wakeTime?: string;
  lastNapEndTime?: string;
  totalNightSleepMinutes?: number;
  totalDaySleepMinutes?: number;
}

export default function SmartInsights({
  childName = 'Baby',
  ageInMonths,
  isCurrentlySleeping,
  currentSleepStartTime,
  bedtime,
  wakeTime,
  lastNapEndTime,
  totalNightSleepMinutes,
}: SmartInsightsProps) {
  const theme = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDetails, setShowDetails] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const scenario = useMemo((): InsightScenario => {
    const hour = currentTime.getHours();
    const isNightTime = hour >= 19 || hour < 7;
    
    if (isCurrentlySleeping && isNightTime) return 'sleeping';
    if (isCurrentlySleeping && !isNightTime) return 'napping';
    if (!isCurrentlySleeping && wakeTime && hour >= 5 && hour < 10) return 'morning_wake';
    if (!isCurrentlySleeping && isNightTime) return 'night_wake';
    
    return 'morning_wake';
  }, [currentTime, isCurrentlySleeping, wakeTime]);
  
  const sleepNeeds = useMemo(() => getSleepNeedsForAge(ageInMonths), [ageInMonths]);
  const devContext = useMemo(() => getCurrentDevelopmentalContext(ageInMonths), [ageInMonths]);
  
  const guidance = useMemo((): GuidanceMessage | null => {
    switch (scenario) {
      case 'sleeping':
        return getDuringSleepGuidance(ageInMonths, currentSleepStartTime);
      case 'night_wake':
        return getNightWakeGuidance(ageInMonths, totalNightSleepMinutes);
      case 'morning_wake':
        return getMorningWakeGuidance(ageInMonths, wakeTime);
      case 'napping':
        return getDuringSleepGuidance(ageInMonths, currentSleepStartTime);
      default:
        return getRandomCalmTip();
    }
  }, [scenario, ageInMonths, currentSleepStartTime, totalNightSleepMinutes, wakeTime]);

  const projection = useMemo(() => {
    if (wakeTime) {
      return generateDayProjection(ageInMonths, wakeTime);
    }
    return null;
  }, [ageInMonths, wakeTime]);

  if (!guidance) return null;

  const getScenarioEmoji = () => {
    switch (scenario) {
      case 'sleeping': return '🌙';
      case 'night_wake': return '😴';
      case 'morning_wake': return '☀️';
      case 'napping': return '💤';
      default: return '👶';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
      onPress={() => setShowDetails(!showDetails)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.emoji}>{getScenarioEmoji()}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            {guidance.headline}
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            {guidance.message}
          </Text>
        </View>
      </View>

      {showDetails && (
        <View style={[styles.details, { borderTopColor: theme.border }]}>
          {sleepNeeds && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                Sleep needs ({sleepNeeds.ageRange}):
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {sleepNeeds.totalSleep.min}-{sleepNeeds.totalSleep.max}h total
              </Text>
            </View>
          )}
          
          {devContext && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                Development note:
              </Text>
              <Text style={[styles.detailValue, { color: theme.textPrimary }]}>
                {devContext.note}
              </Text>
            </View>
          )}

          {projection && (
            <View style={styles.projectionContainer}>
              <Text style={[styles.projectionTitle, { color: theme.accentPrimary }]}>
                Today's Projection
              </Text>
              {projection.naps.map((nap, i) => (
                <Text key={i} style={[styles.projectionItem, { color: theme.textSecondary }]}>
                  Nap {i + 1}: ~{nap.suggestedStart}
                </Text>
              ))}
              <Text style={[styles.projectionItem, { color: theme.textSecondary }]}>
                Bedtime: ~{projection.suggestedBedtime}
              </Text>
            </View>
          )}

          {guidance.actionTip && (
            <View style={[styles.tipContainer, { backgroundColor: theme.bgInput }]}>
              <Text style={[styles.tipText, { color: theme.textPrimary }]}>
                💡 {guidance.actionTip}
              </Text>
            </View>
          )}
        </View>
      )}
      
      <Text style={[styles.tapHint, { color: theme.textMuted }]}>
        {showDetails ? 'Tap to collapse' : 'Tap for more'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    padding: spacing.md,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  emoji: {
    fontSize: 32,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
  },
  detailRow: {
    marginBottom: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
  },
  projectionContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  projectionTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  projectionItem: {
    fontSize: typography.sizes.sm,
    marginLeft: spacing.sm,
  },
  tipContainer: {
    padding: spacing.sm,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  tipText: {
    fontSize: typography.sizes.sm,
  },
  tapHint: {
    fontSize: typography.sizes.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
