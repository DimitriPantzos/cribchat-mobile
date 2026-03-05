"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface NapEntry {
  startTime: string;
  endTime?: string;
  duration?: number;
  location?: string;
}

interface BottleEntry {
  time: string;
  type: string;
  amount?: number;
}

interface MealEntry {
  time: string;
  type: string;
  amount?: string;
}

interface TodaySchedule {
  wakeTime?: string;
  bedtime?: string;
  naps: NapEntry[];
  bottles: BottleEntry[];
  meals: MealEntry[];
}

interface WakeWindows {
  first: string;
  second: string;
  third?: string;
  fourth?: string;
  naps: number;
}

interface ChildContext {
  name: string;
  ageMonths?: number;
  ageDisplay?: string;
  wakeWindows?: WakeWindows;
  todaySchedule?: TodaySchedule;
}

function buildSystemPrompt(childContext?: ChildContext): string {
  const basePrompt = `You are Crib Chat, a warm and supportive AI sleep consultant for exhausted parents. You specialize in infant and toddler sleep using the Ferber method (graduated extinction).

## Your Personality
- Calm, reassuring, and non-judgmental
- Brief and clear (parents are exhausted, don't ramble)
- Practical over theoretical
- Acknowledge that sleep training is hard

## Your Approach (Ferber Method)
- Graduated extinction: systematic check-ins with increasing intervals
- First night: 3min, 5min, 10min intervals
- Subsequent nights: increase by 2-3 minutes
- Check-ins are brief (1-2 min), verbal reassurance only
- Consistency is everything - partial response makes it worse

## Key Sleep Principles
- Wake windows matter more than clock time
- Drowsy but awake is the goal
- It's okay to let babies fuss/cry for intervals
- Night weaning usually possible after 6 months with pediatrician OK
- Regressions are temporary (usually 1-2 weeks)`;

  if (!childContext) return basePrompt;

  let personalContext = `\n\n## Current Child\nYou are helping with ${childContext.name}`;
  
  if (childContext.ageDisplay) {
    personalContext += ` (${childContext.ageDisplay} old)`;
  }
  personalContext += '.';

  if (childContext.wakeWindows) {
    const ww = childContext.wakeWindows;
    personalContext += `\n\n### ${childContext.name}'s Recommended Wake Windows
- First: ${ww.first}
- Second: ${ww.second}`;
    if (ww.third) personalContext += `\n- Third: ${ww.third}`;
    if (ww.fourth) personalContext += `\n- Fourth: ${ww.fourth}`;
    personalContext += `\n- Recommended naps: ${ww.naps}`;
  }

  if (childContext.todaySchedule) {
    const today = childContext.todaySchedule;
    personalContext += `\n\n### TODAY'S ACTUAL SCHEDULE (use this for specific advice)`;
    
    if (today.wakeTime) {
      personalContext += `\n- Woke up: ${today.wakeTime}`;
    }
    
    if (today.naps.length > 0) {
      personalContext += `\n- Naps today (${today.naps.length}):`;
      today.naps.forEach((nap, i) => {
        if (nap.endTime && nap.duration) {
          personalContext += `\n  ${i + 1}. ${nap.startTime}-${nap.endTime} (${nap.duration}min)`;
        } else {
          personalContext += `\n  ${i + 1}. Started ${nap.startTime} (IN PROGRESS)`;
        }
      });
      
      const totalNapMin = today.naps
        .filter(n => n.duration)
        .reduce((sum, n) => sum + (n.duration || 0), 0);
      if (totalNapMin > 0) {
        personalContext += `\n- Total nap time today: ${totalNapMin} minutes`;
      }
    } else {
      personalContext += `\n- No naps logged yet today`;
    }
    
    if (today.bottles.length > 0) {
      personalContext += `\n- Feeds today (${today.bottles.length}):`;
      today.bottles.forEach((b, i) => {
        const detail = b.type === 'bottle' && b.amount ? `${b.amount}oz` : b.type;
        personalContext += `\n  ${i + 1}. ${b.time} (${detail})`;
      });
    }
    
    if (today.meals.length > 0) {
      personalContext += `\n- Meals today:`;
      today.meals.forEach((m) => {
        personalContext += `\n  - ${m.type} at ${m.time}`;
      });
    }
    
    if (today.bedtime) {
      personalContext += `\n- Bedtime: ${today.bedtime}`;
    }
  }

  return basePrompt + personalContext;
}

export const sendMessage = action({
  args: {
    message: v.string(),
    childName: v.optional(v.string()),
    childAgeMonths: v.optional(v.number()),
    childAgeDisplay: v.optional(v.string()),
    wakeWindows: v.optional(v.object({
      first: v.string(),
      second: v.string(),
      third: v.optional(v.string()),
      fourth: v.optional(v.string()),
      naps: v.number(),
    })),
    todaySchedule: v.optional(v.object({
      wakeTime: v.optional(v.string()),
      bedtime: v.optional(v.string()),
      naps: v.array(v.object({
        startTime: v.string(),
        endTime: v.optional(v.string()),
        duration: v.optional(v.number()),
        location: v.optional(v.string()),
      })),
      bottles: v.array(v.object({
        time: v.string(),
        type: v.string(),
        amount: v.optional(v.number()),
      })),
      meals: v.array(v.object({
        time: v.string(),
        type: v.string(),
        amount: v.optional(v.string()),
      })),
    })),
    conversationHistory: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("assistant")),
      content: v.string(),
    }))),
  },
  handler: async (ctx, args) => {
    const childContext: ChildContext | undefined = args.childName ? {
      name: args.childName,
      ageMonths: args.childAgeMonths,
      ageDisplay: args.childAgeDisplay,
      wakeWindows: args.wakeWindows,
      todaySchedule: args.todaySchedule,
    } : undefined;

    const systemPrompt = buildSystemPrompt(childContext);
    
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (last 10 messages for context)
    if (args.conversationHistory) {
      const recentHistory = args.conversationHistory.slice(-10);
      for (const msg of recentHistory) {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current message
    messages.push({ role: "user", content: args.message });

    const response = await openai.chat.completions.create({
      model: "ft:gpt-4o-mini-2024-07-18:personal:cribchat:DF9tBUYD",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response. Please try again.";
  },
});
