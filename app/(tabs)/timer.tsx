import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Vibration,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, radius, typography } from '@/lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Id } from '@/convex/_generated/dataModel';

const DEFAULT_INTERVALS = [5, 10, 15, 15];

const ENCOURAGEMENTS = [
  "You're doing great! 💪",
  "Stay strong, this is working! 🌟",
  "Deep breaths, you're amazing! 🌙",
  "Every minute counts! 💫",
  "You're teaching healthy sleep! 🎯",
  "This gets easier, promise! 🤗",
  "You're being a great parent! 💜",
  "They're learning, you're helping! ⭐",
];

const FINAL_MESSAGES = [
  "Time to comfort! Go give a quick check 🤗",
  "Interval done! Brief comfort, then restart if needed 💜",
  "You made it! Quick check-in time ⭐",
];

export default function Timer() {
  const { user } = useUser();
  const theme = useTheme();
  
  const convexUser = useQuery(api.users.getByClerkId, 
    user?.id ? { clerkId: user.id } : 'skip'
  );
  const children = useQuery(api.children.getByUser,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );
  const child = children?.[0];
  
  const saveCrySession = useMutation(api.crySessions.save);

  // Timer state - timestamp-based for background resilience
  const [intervals, setIntervals] = useState<number[]>(DEFAULT_INTERVALS);
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
  const [encouragement, setEncouragement] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showOutcome, setShowOutcome] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const encouragementRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  // Handle app state changes for background resilience
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - recalculate time based on timestamps
        if (isRunning && intervalStartTime && !isPaused) {
          const elapsed = Math.floor((Date.now() - intervalStartTime) / 1000);
          const remaining = Math.max(0, totalSeconds - elapsed);
          setSecondsLeft(remaining);
          
          if (remaining <= 0 && !isComplete) {
            setIsComplete(true);
            setIsRunning(false);
            triggerAlert();
          }
        }
      }
      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, [isRunning, intervalStartTime, totalSeconds, isPaused, isComplete]);

  // Timer logic - calculates remaining time from timestamps
  useEffect(() => {
    if (isRunning && intervalStartTime && !isPaused) {
      const updateTimer = () => {
        const elapsed = Math.floor((Date.now() - intervalStartTime) / 1000);
        const remaining = Math.max(0, totalSeconds - elapsed);
        setSecondsLeft(remaining);
        
        if (remaining <= 0 && !isComplete) {
          setIsComplete(true);
          setIsRunning(false);
          triggerAlert();
        }
      };
      
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
      
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isRunning, isPaused, intervalStartTime, totalSeconds, isComplete]);

  // Update encouragement periodically
  useEffect(() => {
    if (isRunning && !isComplete && !isPaused) {
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      
      encouragementRef.current = setInterval(() => {
        setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      }, 20000);
      
      return () => {
        if (encouragementRef.current) clearInterval(encouragementRef.current);
      };
    }
  }, [isRunning, isComplete, isPaused]);

  const triggerAlert = useCallback(() => {
    Vibration.vibrate([300, 150, 300, 150, 300]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEncouragement(FINAL_MESSAGES[Math.floor(Math.random() * FINAL_MESSAGES.length)]);
  }, []);

  const startTimer = () => {
    const minutes = intervals[currentIntervalIndex] || intervals[intervals.length - 1];
    const totalSecs = minutes * 60;
    const now = Date.now();
    
    setIntervalStartTime(now);
    setTotalSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    setIsRunning(true);
    setIsPaused(false);
    setPausedAt(null);
    setIsComplete(false);
    
    if (!hasStartedSession) {
      setHasStartedSession(true);
      setSessionStartTime(now);
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const pauseTimer = () => {
    setIsPaused(true);
    setPausedAt(secondsLeft);
    if (timerRef.current) clearInterval(timerRef.current);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const resumeTimer = () => {
    if (pausedAt !== null) {
      const now = Date.now();
      setIntervalStartTime(now - (totalSeconds - pausedAt) * 1000);
    }
    setIsPaused(false);
    setPausedAt(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const nextInterval = () => {
    const nextIndex = Math.min(currentIntervalIndex + 1, intervals.length - 1);
    setCurrentIntervalIndex(nextIndex);
    setIsComplete(false);
    
    const minutes = intervals[nextIndex] || intervals[intervals.length - 1];
    const totalSecs = minutes * 60;
    const now = Date.now();
    
    setIntervalStartTime(now);
    setTotalSeconds(totalSecs);
    setSecondsLeft(totalSecs);
    setIsRunning(true);
    setIsPaused(false);
    setPausedAt(null);
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleEndSession = async (outcome: 'asleep' | 'comforted' | 'stopped') => {
    if (child?._id && convexUser?._id && sessionStartTime) {
      const endTime = Date.now();
      const totalDurationMin = Math.round((endTime - sessionStartTime) / 60000);
      
      try {
        await saveCrySession({
          userId: convexUser._id as Id<"users">,
          childId: child._id as Id<"children">,
          startTime: sessionStartTime,
          endTime,
          intervalsCompleted: currentIntervalIndex + (isComplete ? 1 : 0),
          intervals,
          totalDurationMin,
          outcome,
        });
      } catch (err) {
        console.error('Failed to save session:', err);
      }
    }
    
    resetSession();
    setShowOutcome(false);
  };

  const resetSession = () => {
    setCurrentIntervalIndex(0);
    setIntervalStartTime(null);
    setTotalSeconds(0);
    setSecondsLeft(0);
    setIsRunning(false);
    setIsPaused(false);
    setPausedAt(null);
    setIsComplete(false);
    setHasStartedSession(false);
    setSessionStartTime(null);
    setEncouragement('');
  };

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (totalSeconds === 0) return 0;
    return ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  };

  // Outcome Modal
  if (showOutcome) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        <View style={styles.modalContent}>
          <Text style={styles.outcomeEmoji}>🌙</Text>
          <Text style={[styles.outcomeTitle, { color: theme.textPrimary }]}>
            How did it go?
          </Text>
          <Text style={[styles.outcomeSubtitle, { color: theme.textMuted }]}>
            {currentIntervalIndex + (isComplete ? 1 : 0)} interval{currentIntervalIndex !== 0 || isComplete ? 's' : ''} completed
          </Text>
          
          <View style={styles.outcomeButtons}>
            <TouchableOpacity
              style={styles.outcomeButton}
              onPress={() => handleEndSession('asleep')}
            >
              <LinearGradient
                colors={theme.gradientSuccess as [string, string]}
                style={styles.outcomeButtonGradient}
              >
                <Text style={styles.outcomeButtonText}>
                  😴 {child?.name || 'Baby'} fell asleep!
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.outcomeButton}
              onPress={() => handleEndSession('comforted')}
            >
              <LinearGradient
                colors={theme.gradientAccent as [string, string]}
                style={styles.outcomeButtonGradient}
              >
                <Text style={styles.outcomeButtonText}>
                  🤗 Comforted & done for now
                </Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.outcomeCancelButton, { backgroundColor: theme.bgSecondary }]}
              onPress={() => handleEndSession('stopped')}
            >
              <Text style={[styles.outcomeCancelText, { color: theme.textSecondary }]}>
                Just stopped the timer
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setShowOutcome(false)}>
              <Text style={[styles.backText, { color: theme.textMuted }]}>← Go back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Settings Modal
  if (showSettings) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
        <View style={styles.modalContent}>
          <View style={styles.settingsHeader}>
            <Text style={[styles.settingsTitle, { color: theme.textPrimary }]}>
              ⚙️ Timer Settings
            </Text>
            <TouchableOpacity onPress={() => setShowSettings(false)}>
              <Text style={{ fontSize: 24, color: theme.textMuted }}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.settingsDescription, { color: theme.textMuted }]}>
            Set your Ferber intervals (in minutes). Standard progression is 5→10→15→15.
          </Text>
          
          <View style={styles.intervalsContainer}>
            {intervals.map((interval, index) => (
              <View key={index} style={styles.intervalRow}>
                <Text style={[styles.intervalLabel, { color: theme.textSecondary }]}>
                  Check {index + 1}:
                </Text>
                <View style={styles.intervalControls}>
                  <TouchableOpacity
                    style={[styles.intervalButton, { backgroundColor: theme.bgSecondary }]}
                    onPress={() => {
                      const newIntervals = [...intervals];
                      newIntervals[index] = Math.max(1, interval - 1);
                      setIntervals(newIntervals);
                    }}
                  >
                    <Text style={{ color: theme.textPrimary, fontSize: 20 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.intervalValue, { color: theme.textPrimary }]}>
                    {interval} min
                  </Text>
                  <TouchableOpacity
                    style={[styles.intervalButton, { backgroundColor: theme.bgSecondary }]}
                    onPress={() => {
                      const newIntervals = [...intervals];
                      newIntervals[index] = Math.min(30, interval + 1);
                      setIntervals(newIntervals);
                    }}
                  >
                    <Text style={{ color: theme.textPrimary, fontSize: 20 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
          
          <TouchableOpacity
            style={[styles.doneButton, { backgroundColor: theme.accentPrimary }]}
            onPress={() => setShowSettings(false)}
          >
            <Text style={[styles.doneButtonText, { color: theme.textInverse }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.bgSecondary }]}
            onPress={() => setShowSettings(true)}
          >
            <Text style={{ fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>🍼 Cry Timer</Text>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: theme.bgSecondary }]}
            onPress={() => hasStartedSession ? setShowOutcome(true) : resetSession()}
          >
            <Text style={{ fontSize: 20 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Interval indicators */}
        <View style={styles.intervals}>
          {intervals.map((interval, index) => (
            <View key={index} style={styles.intervalIndicator}>
              <View
                style={[
                  styles.intervalCircle,
                  {
                    backgroundColor: index < currentIntervalIndex 
                      ? theme.successBg 
                      : index === currentIntervalIndex 
                        ? theme.accentPrimary 
                        : theme.bgSecondary,
                    borderColor: index === currentIntervalIndex ? theme.accentPrimary : theme.border,
                    transform: [{ scale: index === currentIntervalIndex ? 1.15 : 1 }],
                  },
                ]}
              >
                <Text
                  style={[
                    styles.intervalText,
                    {
                      color: index === currentIntervalIndex 
                        ? theme.textInverse 
                        : index < currentIntervalIndex 
                          ? theme.successText 
                          : theme.textMuted,
                    },
                  ]}
                >
                  {index < currentIntervalIndex ? '✓' : `${interval}m`}
                </Text>
              </View>
              <Text style={[styles.intervalNumber, { 
                color: index === currentIntervalIndex ? theme.accentPrimary : theme.textMuted 
              }]}>
                #{index + 1}
              </Text>
            </View>
          ))}
        </View>

        {/* Timer Display */}
        {hasStartedSession ? (
          <View style={styles.timerContainer}>
            {/* Progress Ring */}
            <View style={styles.progressRing}>
              <View 
                style={[
                  styles.progressBackground, 
                  { borderColor: theme.bgSecondary }
                ]} 
              />
              <View style={styles.progressCenter}>
                <Text
                  style={[
                    styles.timerText,
                    { color: isComplete ? theme.successText : isPaused ? theme.textMuted : theme.textPrimary },
                  ]}
                >
                  {formatTime(secondsLeft)}
                </Text>
                {!isComplete && (
                  <Text style={[styles.timerSubtext, { color: theme.textMuted }]}>
                    {isPaused ? 'PAUSED' : `Interval ${currentIntervalIndex + 1} of ${intervals.length}`}
                  </Text>
                )}
                {isComplete && (
                  <Text style={[styles.timerSubtext, { color: theme.successText }]}>
                    ✓ Time to comfort!
                  </Text>
                )}
              </View>
            </View>

            {/* Encouragement */}
            {encouragement && (
              <View style={[styles.encouragement, { backgroundColor: isComplete ? theme.successBg : theme.accentLight }]}>
                <Text style={[styles.encouragementText, { color: isComplete ? theme.successText : theme.accentPrimary }]}>
                  {encouragement}
                </Text>
              </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
              {isComplete ? (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={nextInterval}>
                    <LinearGradient
                      colors={theme.gradientAccent as [string, string]}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        ▶ Start Next ({intervals[Math.min(currentIntervalIndex + 1, intervals.length - 1)]}m)
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setShowOutcome(true)}>
                    <LinearGradient
                      colors={theme.gradientSuccess as [string, string]}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>
                        😴 {child?.name || 'Baby'} fell asleep!
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : isPaused ? (
                <>
                  <TouchableOpacity style={styles.primaryButton} onPress={resumeTimer}>
                    <LinearGradient
                      colors={theme.gradientAccent as [string, string]}
                      style={styles.primaryButtonGradient}
                    >
                      <Text style={styles.primaryButtonText}>▶ Resume</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.secondaryButton, { backgroundColor: theme.bgSecondary }]}
                    onPress={() => setShowOutcome(true)}
                  >
                    <Text style={[styles.secondaryButtonText, { color: theme.textSecondary }]}>
                      Stop Session
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.pauseButton, { backgroundColor: theme.bgSecondary, borderColor: theme.border }]}
                    onPress={pauseTimer}
                  >
                    <Text style={[styles.pauseButtonText, { color: theme.textPrimary }]}>⏸ Pause</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setShowOutcome(true)}>
                    <Text style={[styles.stopText, { color: theme.textMuted }]}>Stop Session</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.startContainer}>
            <Text style={styles.bigEmoji}>⏱️</Text>
            <Text style={[styles.startTitle, { color: theme.textPrimary }]}>
              Ferber Sleep Training
            </Text>
            <Text style={[styles.startSubtitle, { color: theme.textMuted }]}>
              Graduated waiting: {intervals.join(' → ')} min
            </Text>
            
            <TouchableOpacity style={styles.startButton} onPress={startTimer}>
              <LinearGradient
                colors={theme.gradientWarning as [string, string]}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>🍼 Start Timer</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <Text style={[styles.startHint, { color: theme.textMuted }]}>
              Press when {child?.name || 'baby'} starts crying.{'\n'}
              You'll be alerted when it's time to comfort.
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <Text style={[styles.footerText, { color: theme.textMuted }]}>
            💡 Brief comfort (1-2 min), then restart if still crying
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  intervals: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  intervalIndicator: {
    alignItems: 'center',
  },
  intervalCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  intervalText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  intervalNumber: {
    fontSize: typography.sizes.xs,
    marginTop: 4,
  },
  timerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressRing: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressBackground: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 10,
  },
  progressCenter: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 56,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  timerSubtext: {
    fontSize: typography.sizes.sm,
    marginTop: 4,
  },
  encouragement: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  encouragementText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  controls: {
    width: '100%',
    gap: spacing.sm,
  },
  primaryButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  secondaryButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
  },
  pauseButton: {
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    alignItems: 'center',
    borderWidth: 2,
  },
  pauseButtonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  stopText: {
    textAlign: 'center',
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  bigEmoji: {
    fontSize: 72,
    marginBottom: spacing.md,
  },
  startTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  startSubtitle: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.xl,
  },
  startButton: {
    width: '100%',
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  startButtonGradient: {
    paddingVertical: spacing.lg + 4,
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  startHint: {
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.xs,
  },
  modalContent: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  outcomeEmoji: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  outcomeTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  outcomeSubtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  outcomeButtons: {
    gap: spacing.sm,
  },
  outcomeButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  outcomeButtonGradient: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  outcomeButtonText: {
    color: 'white',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  outcomeCancelButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    alignItems: 'center',
  },
  outcomeCancelText: {
    fontSize: typography.sizes.sm,
  },
  backText: {
    textAlign: 'center',
    paddingVertical: spacing.md,
    fontSize: typography.sizes.sm,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  settingsTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
  },
  settingsDescription: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  intervalsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  intervalLabel: {
    fontSize: typography.sizes.sm,
    width: 80,
  },
  intervalControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  intervalButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  intervalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    width: 60,
    textAlign: 'center',
  },
  doneButton: {
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
