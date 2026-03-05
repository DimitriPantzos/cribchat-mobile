import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useUser } from '@clerk/clerk-expo';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, spacing, radius, typography } from '@/lib/theme';
import { calculateWakeWindows } from '@/lib/wakeWindows';
import { Id } from '@/convex/_generated/dataModel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

function getAgeFromBirthdate(birthDate: string): { months: number; display: string } {
  const birth = new Date(birthDate);
  const now = new Date();
  
  let months = (now.getFullYear() - birth.getFullYear()) * 12;
  months += now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  months = Math.max(0, months);
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (years > 0) {
    return {
      months,
      display: years === 1 
        ? `${years} year${remainingMonths > 0 ? `, ${remainingMonths}mo` : ''}`
        : `${years} years${remainingMonths > 0 ? `, ${remainingMonths}mo` : ''}`
    };
  }
  return { months, display: `${months}mo` };
}

const SUGGESTIONS = [
  "Should I feed when baby wakes?",
  "Standing and crying, what do I do?",
  "What wake windows for this age?",
  "Tips for longer naps?",
];

export default function Chat() {
  const { user } = useUser();
  const theme = useTheme();
  const flatListRef = useRef<FlatList>(null);
  
  const convexUser = useQuery(api.users.getByClerkId, 
    user?.id ? { clerkId: user.id } : 'skip'
  );
  const children = useQuery(api.children.getByUser,
    convexUser?._id ? { userId: convexUser._id } : 'skip'
  );
  const savedMessages = useQuery(api.messages.getRecent,
    convexUser?._id ? { userId: convexUser._id, limit: 50 } : 'skip'
  );
  const saveMessage = useMutation(api.messages.save);
  const clearMessages = useMutation(api.messages.clear);
  const sendChatMessage = useAction(api.chat.sendMessage);
  
  const child = children?.[0];
  const childAge = child ? getAgeFromBirthdate(child.birthDate) : null;
  const wakeWindows = childAge ? calculateWakeWindows(childAge.months) : null;
  
  // Get today's schedule for dynamic context
  const today = new Date().toISOString().split('T')[0];
  const dailyLog = useQuery(api.dailyLogs.getByDate, 
    child?._id ? { childId: child._id, date: today } : 'skip'
  );
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (savedMessages && messages.length === 0) {
      const loaded = [...savedMessages].reverse().map((msg: any) => ({
        id: msg._id,
        role: msg.role,
        content: msg.content,
      }));
      setMessages(loaded);
    }
  }, [savedMessages, messages.length]);

  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !convexUser) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    scrollToEnd();

    await saveMessage({
      userId: convexUser._id,
      childId: child?._id as Id<"children"> | undefined,
      role: 'user',
      content: userMessage.content,
    });

    try {
      // Build conversation history for context
      const conversationHistory = messages.slice(-10).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

      // Build today's schedule for dynamic context
      const todaySchedule = dailyLog ? {
        wakeTime: dailyLog.wakeTime,
        bedtime: dailyLog.bedtime,
        naps: (dailyLog.naps || []).map((n: any) => ({
          startTime: n.startTime,
          endTime: n.endTime,
          duration: n.duration,
          location: n.location,
        })),
        bottles: (dailyLog.bottles || []).map((b: any) => ({
          time: b.time,
          type: b.type || 'bottle',
          amount: b.amount,
        })),
        meals: (dailyLog.meals || []).map((m: any) => ({
          time: m.time,
          type: m.type,
          amount: m.amount,
        })),
      } : undefined;

      // Call real OpenAI via Convex action with full dynamic context
      const aiResponse = await sendChatMessage({
        message: userMessage.content,
        childName: child?.name,
        childAgeMonths: childAge?.months,
        childAgeDisplay: childAge?.display,
        wakeWindows: wakeWindows ? {
          first: wakeWindows.first,
          second: wakeWindows.second,
          third: wakeWindows.third,
          fourth: wakeWindows.fourth,
          naps: wakeWindows.naps,
        } : undefined,
        todaySchedule,
        conversationHistory,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      scrollToEnd();

      await saveMessage({
        userId: convexUser._id,
        childId: child?._id as Id<"children"> | undefined,
        role: 'assistant',
        content: assistantMessage.content,
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = async () => {
    if (!convexUser) return;
    await clearMessages({ userId: convexUser._id });
    setMessages([]);
  };

  const handleSuggestion = (text: string) => {
    setInput(text);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: item.role === 'user' ? theme.userBubble : theme.assistantBubble,
          },
        ]}
      >
        <Text
          style={[
            styles.messageText,
            { color: item.role === 'user' ? theme.textInverse : theme.assistantText },
          ]}
        >
          {item.content}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🌙</Text>
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>
        Hi{child ? `, ${child.name}'s parent` : ''}!
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textMuted }]}>
        Ask me anything about {child?.name || 'your baby'}'s sleep
      </Text>
      {wakeWindows && (
        <Text style={[styles.wakeWindowsInfo, { color: theme.textMuted }]}>
          Wake windows for {childAge?.display}: {wakeWindows.first} → {wakeWindows.second}
          {wakeWindows.third ? ` → ${wakeWindows.third}` : ''}
        </Text>
      )}
      <View style={styles.suggestions}>
        {SUGGESTIONS.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionButton, { backgroundColor: theme.bgCard, borderColor: theme.border }]}
            onPress={() => handleSuggestion(suggestion)}
          >
            <Text style={[styles.suggestionText, { color: theme.textSecondary }]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bgPrimary }]} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogo}>🍼</Text>
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Crib Chat</Text>
              {child && (
                <Text style={[styles.headerSubtitle, { color: theme.accentPrimary }]}>
                  {child.name}, {childAge?.display}
                </Text>
              )}
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={[styles.clearButton, { color: theme.textMuted }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={renderEmptyState}
          onContentSizeChange={scrollToEnd}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingBubble, { backgroundColor: theme.assistantBubble }]}>
              <ActivityIndicator size="small" color={theme.textMuted} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: theme.bgCard, borderTopColor: theme.border }]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.bgInput,
                borderColor: theme.border,
                color: theme.textPrimary,
              },
            ]}
            placeholder={`Ask about ${child?.name || 'baby'}'s sleep...`}
            placeholderTextColor={theme.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: isLoading || !input.trim() ? theme.border : theme.accentPrimary },
            ]}
            onPress={handleSend}
            disabled={isLoading || !input.trim()}
          >
            <Text style={[styles.sendButtonText, { color: theme.textInverse }]}>Send</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.disclaimer, { color: theme.textMuted, backgroundColor: theme.bgCard }]}>
          Not medical advice. Consult your pediatrician.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getSimulatedResponse(question: string, childName?: string, ageMonths?: number): string {
  const name = childName || 'baby';
  const age = ageMonths || 9;
  
  const lower = question.toLowerCase();
  
  if (lower.includes('wake') || lower.includes('feed')) {
    return `Great question! At ${age} months, ${name} may not need a feed every time they wake. Check if they're truly hungry or just seeking comfort.\n\n💡 Tip: A consistent response helps ${name} learn to self-soothe.`;
  }
  
  if (lower.includes('standing') || lower.includes('crying')) {
    return `When ${name} stands and cries in the crib, it's often a developmental phase!\n\n✨ What to try:\n1. Practice sitting during play time\n2. Use consistent verbal reassurance\n3. Give brief check-ins without picking up\n\nThis phase typically passes in 1-2 weeks!`;
  }
  
  if (lower.includes('wake window')) {
    const ww = calculateWakeWindows(age);
    return `For a ${age}-month-old like ${name}:\n\n⏰ First: ${ww.first}\n⏰ Second: ${ww.second}${ww.third ? `\n⏰ Third: ${ww.third}` : ''}\n\nExpect ${ww.naps} naps per day. 💡`;
  }
  
  if (lower.includes('nap') && lower.includes('long')) {
    return `Tips for longer naps:\n\n1. 🌑 Darken the room completely\n2. 🔊 Use white noise\n3. ⏰ Watch wake windows closely\n4. 🛏️ Create a mini nap routine\n5. ⏳ Try "crib hour" - 60 min total`;
  }
  
  return `I'd love to help with ${name}'s sleep! Tell me more about what's happening:\n\n• What time of day\n• How long ${name} has been awake\n• Any recent changes\n\nThe more context, the better advice! 💜`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerLogo: {
    fontSize: 28,
  },
  headerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  headerSubtitle: {
    fontSize: typography.sizes.xs,
  },
  clearButton: {
    fontSize: typography.sizes.xs,
    padding: spacing.xs,
  },
  messagesList: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginBottom: spacing.sm,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  messageText: {
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
  loadingContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  loadingBubble: {
    alignSelf: 'flex-start',
    padding: spacing.md,
    borderRadius: radius.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    maxHeight: 100,
  },
  sendButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    justifyContent: 'center',
  },
  sendButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
  },
  disclaimer: {
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    paddingBottom: spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.sizes.md,
    marginBottom: spacing.sm,
  },
  wakeWindowsInfo: {
    fontSize: typography.sizes.xs,
    marginBottom: spacing.lg,
  },
  suggestions: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestionButton: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: typography.sizes.sm,
  },
});
