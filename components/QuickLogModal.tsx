import { View, Text, TouchableOpacity, Modal, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { spacing, radius, typography, Theme } from '../lib/theme';

interface QuickLogModalProps {
  visible: boolean;
  type: 'bottle' | 'meal' | 'diaper';
  onClose: () => void;
  onLogBottle?: (oz?: number) => void;
  onLogMeal?: (type: 'breakfast' | 'lunch' | 'dinner' | 'snack') => void;
  onLogDiaper?: (type: 'wet' | 'dirty' | 'both') => void;
  theme: Theme;
}

export default function QuickLogModal({ visible, type, onClose, onLogBottle, onLogMeal, onLogDiaper, theme }: QuickLogModalProps) {
  const handlePress = (callback: () => void) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); callback(); };

  const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    sheet: { backgroundColor: theme.bgCard, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
    handle: { width: 48, height: 4, borderRadius: 2, backgroundColor: theme.border, alignSelf: 'center', marginBottom: spacing.md },
    title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: theme.textPrimary, marginBottom: spacing.md },
    subtitle: { fontSize: typography.sizes.sm, color: theme.textMuted, marginBottom: spacing.md },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    gridItem: { flex: 1, minWidth: '30%', paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center', backgroundColor: theme.accentPrimary },
    gridItemText: { color: 'white', fontWeight: typography.weights.bold, fontSize: typography.sizes.md },
    secondaryButton: { paddingVertical: spacing.md, borderRadius: radius.lg, alignItems: 'center', backgroundColor: theme.bgSecondary, marginTop: spacing.sm },
    secondaryButtonText: { color: theme.textPrimary },
    row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
    mealButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center', backgroundColor: theme.accentPrimary },
    mealEmoji: { fontSize: 24, marginBottom: 4 },
    mealText: { color: 'white', fontWeight: typography.weights.medium },
    diaperGrid: { flexDirection: 'row', gap: spacing.sm },
    diaperButton: { flex: 1, paddingVertical: spacing.lg, borderRadius: radius.lg, alignItems: 'center', backgroundColor: theme.accentPrimary },
    diaperEmoji: { fontSize: 24, marginBottom: 4 },
    diaperText: { color: 'white', fontWeight: typography.weights.medium, fontSize: typography.sizes.sm },
  });

  if (type === 'bottle') return (
    <Modal visible={visible} transparent animationType="slide"><View style={styles.overlay}><Pressable style={styles.backdrop} onPress={onClose} /><View style={styles.sheet}><View style={styles.handle} /><Text style={styles.title}>🍼 Log Feeding</Text><Text style={styles.subtitle}>Quick log a bottle</Text><View style={styles.grid}>{[4, 6, 8, 10].map((oz) => <TouchableOpacity key={oz} style={styles.gridItem} onPress={() => handlePress(() => onLogBottle?.(oz))}><Text style={styles.gridItemText}>{oz}oz</Text></TouchableOpacity>)}</View><TouchableOpacity style={styles.secondaryButton} onPress={() => handlePress(() => onLogBottle?.())}><Text style={styles.secondaryButtonText}>Log without amount</Text></TouchableOpacity></View></View></Modal>
  );

  if (type === 'meal') return (
    <Modal visible={visible} transparent animationType="slide"><View style={styles.overlay}><Pressable style={styles.backdrop} onPress={onClose} /><View style={styles.sheet}><View style={styles.handle} /><Text style={styles.title}>🥣 Log Meal</Text><View style={styles.row}><TouchableOpacity style={styles.mealButton} onPress={() => handlePress(() => onLogMeal?.('breakfast'))}><Text style={styles.mealEmoji}>🥣</Text><Text style={styles.mealText}>Breakfast</Text></TouchableOpacity><TouchableOpacity style={styles.mealButton} onPress={() => handlePress(() => onLogMeal?.('lunch'))}><Text style={styles.mealEmoji}>🥗</Text><Text style={styles.mealText}>Lunch</Text></TouchableOpacity></View><View style={styles.row}><TouchableOpacity style={styles.mealButton} onPress={() => handlePress(() => onLogMeal?.('dinner'))}><Text style={styles.mealEmoji}>🍽️</Text><Text style={styles.mealText}>Dinner</Text></TouchableOpacity><TouchableOpacity style={styles.mealButton} onPress={() => handlePress(() => onLogMeal?.('snack'))}><Text style={styles.mealEmoji}>🍎</Text><Text style={styles.mealText}>Snack</Text></TouchableOpacity></View></View></View></Modal>
  );

  if (type === 'diaper') return (
    <Modal visible={visible} transparent animationType="slide"><View style={styles.overlay}><Pressable style={styles.backdrop} onPress={onClose} /><View style={styles.sheet}><View style={styles.handle} /><Text style={styles.title}>👶 Log Diaper</Text><View style={styles.diaperGrid}><TouchableOpacity style={styles.diaperButton} onPress={() => handlePress(() => onLogDiaper?.('wet'))}><Text style={styles.diaperEmoji}>💧</Text><Text style={styles.diaperText}>Pee</Text></TouchableOpacity><TouchableOpacity style={styles.diaperButton} onPress={() => handlePress(() => onLogDiaper?.('dirty'))}><Text style={styles.diaperEmoji}>💩</Text><Text style={styles.diaperText}>Poop</Text></TouchableOpacity><TouchableOpacity style={styles.diaperButton} onPress={() => handlePress(() => onLogDiaper?.('both'))}><Text style={styles.diaperEmoji}>💧💩</Text><Text style={styles.diaperText}>Both</Text></TouchableOpacity></View></View></View></Modal>
  );

  return null;
}
