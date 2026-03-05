import { Tabs } from 'expo-router';
import { useColorScheme, View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/theme';

type TabIconProps = {
  icon: string;
  label: string;
  focused: boolean;
  isTimer?: boolean;
};

function TabIcon({ icon, label, focused, isTimer }: TabIconProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  if (isTimer) {
    return (
      <View style={[styles.timerTab, { backgroundColor: focused ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)' }]}>
        <Text style={styles.timerIcon}>{icon}</Text>
        <Text style={[styles.timerLabel, { color: focused ? 'white' : '#f59e0b' }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.tabItem, focused && { backgroundColor: theme.accentLight }]}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: focused ? theme.accentPrimary : theme.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, width: 56 },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 10, fontWeight: '500' },
  timerTab: { alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, width: 56 },
  timerIcon: { fontSize: 18, marginBottom: 2 },
  timerLabel: { fontSize: 10, fontWeight: '600' },
});

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? colors.dark : colors.light;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.bgCard, borderTopColor: theme.border, borderTopWidth: 1, height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="home" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Home" focused={focused} /> }} />
      <Tabs.Screen name="schedule" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📅" label="Schedule" focused={focused} /> }} />
      <Tabs.Screen name="timer" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="⏱️" label="Timer" focused={focused} isTimer /> }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="💬" label="Chat" focused={focused} /> }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👶" label="Profile" focused={focused} /> }} />
    </Tabs>
  );
}
