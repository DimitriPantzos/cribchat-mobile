/**
 * Sleep Science Knowledge Base
 * 
 * Evidence-based sleep information for contextual 3AM guidance.
 * When a parent wakes up exhausted and anxious, this provides calm, 
 * knowledgeable support — like having a sleep consultant in your pocket.
 * 
 * Scientific Sources:
 * - Dr. Richard Ferber, "Solve Your Child's Sleep Problems" (2006)
 * - Dr. Marc Weissbluth, "Healthy Sleep Habits, Happy Child" (2015)
 * - Dr. Jodi Mindell, "Sleeping Through the Night" (2005)
 * - American Academy of Pediatrics (AAP) sleep guidelines
 * - National Sleep Foundation recommendations
 */

// ============================================================================
// TOTAL SLEEP NEEDS BY AGE
// ============================================================================

export interface SleepNeeds {
  ageRange: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  totalSleep: { min: number; max: number };      // hours per 24h
  nightSleep: { min: number; max: number };      // hours
  daySleep: { min: number; max: number };        // hours
  nightWakings: { typical: number; max: number }; // expected wake-ups
  nightFeedsExpected: number;                     // 0 = can night wean
  source: string;
}

export const SLEEP_NEEDS_BY_AGE: SleepNeeds[] = [
  {
    ageRange: "0-2 months",
    ageMonthsMin: 0,
    ageMonthsMax: 2,
    totalSleep: { min: 14, max: 17 },
    nightSleep: { min: 8, max: 10 },
    daySleep: { min: 6, max: 8 },
    nightWakings: { typical: 3, max: 5 },
    nightFeedsExpected: 3,
    source: "AAP/NSF"
  },
  {
    ageRange: "2-4 months",
    ageMonthsMin: 2,
    ageMonthsMax: 4,
    totalSleep: { min: 14, max: 16 },
    nightSleep: { min: 9, max: 11 },
    daySleep: { min: 4, max: 5 },
    nightWakings: { typical: 2, max: 4 },
    nightFeedsExpected: 2,
    source: "Mindell"
  },
  {
    ageRange: "4-6 months",
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    totalSleep: { min: 12, max: 15 },
    nightSleep: { min: 10, max: 12 },
    daySleep: { min: 3, max: 4 },
    nightWakings: { typical: 1, max: 3 },
    nightFeedsExpected: 1,
    source: "Ferber"
  },
  {
    ageRange: "6-9 months",
    ageMonthsMin: 6,
    ageMonthsMax: 9,
    totalSleep: { min: 12, max: 14 },
    nightSleep: { min: 10, max: 12 },
    daySleep: { min: 2.5, max: 3.5 },
    nightWakings: { typical: 1, max: 2 },
    nightFeedsExpected: 1,
    source: "Weissbluth"
  },
  {
    ageRange: "9-12 months",
    ageMonthsMin: 9,
    ageMonthsMax: 12,
    totalSleep: { min: 12, max: 14 },
    nightSleep: { min: 10, max: 12 },
    daySleep: { min: 2, max: 3 },
    nightWakings: { typical: 0, max: 1 },
    nightFeedsExpected: 0, // Can typically night wean
    source: "Ferber"
  },
  {
    ageRange: "12-18 months",
    ageMonthsMin: 12,
    ageMonthsMax: 18,
    totalSleep: { min: 11, max: 14 },
    nightSleep: { min: 10, max: 12 },
    daySleep: { min: 2, max: 3 },
    nightWakings: { typical: 0, max: 1 },
    nightFeedsExpected: 0,
    source: "Mindell"
  },
  {
    ageRange: "18-24 months",
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    totalSleep: { min: 11, max: 14 },
    nightSleep: { min: 10, max: 12 },
    daySleep: { min: 1.5, max: 2.5 },
    nightWakings: { typical: 0, max: 1 },
    nightFeedsExpected: 0,
    source: "AAP"
  }
];

export function getSleepNeedsForAge(ageInMonths: number): SleepNeeds {
  for (const needs of SLEEP_NEEDS_BY_AGE) {
    if (ageInMonths >= needs.ageMonthsMin && ageInMonths < needs.ageMonthsMax) {
      return needs;
    }
  }
  return SLEEP_NEEDS_BY_AGE[SLEEP_NEEDS_BY_AGE.length - 1];
}

// ============================================================================
// WHY BABIES WAKE - REASONS AND GUIDANCE
// ============================================================================

export type WakeReason = 
  | 'hunger'
  | 'discomfort'
  | 'sleep_association'
  | 'developmental_leap'
  | 'separation_anxiety'
  | 'overtired'
  | 'undertired'
  | 'teething'
  | 'illness'
  | 'environmental'
  | 'habit';

export interface WakeReasonInfo {
  id: WakeReason;
  name: string;
  description: string;
  ageRange?: { min: number; max: number }; // months where this is most common
  signs: string[];
  guidance: string[];
  source: string;
}

export const WAKE_REASONS: WakeReasonInfo[] = [
  {
    id: 'hunger',
    name: 'Genuine Hunger',
    description: 'Baby needs calories. Most common in younger babies.',
    ageRange: { min: 0, max: 9 },
    signs: [
      'Eats vigorously when fed',
      'Takes full feed (not just comfort sucks)',
      'Falls back asleep quickly after feeding'
    ],
    guidance: [
      'If under 6mo, feed without hesitation',
      'By 9mo, most babies can go 10-12h without feeds',
      'Gradually reduce night feeds if ready'
    ],
    source: 'Ferber'
  },
  {
    id: 'discomfort',
    name: 'Physical Discomfort',
    description: 'Wet diaper, too hot/cold, gas, or illness.',
    signs: [
      'Squirming or arching back',
      'Passing gas',
      'Fever or congestion',
      'Diaper is soaked'
    ],
    guidance: [
      'Quick diaper check (minimal stimulation)',
      'Check room temp: 68-72°F ideal',
      'Watch for illness signs: fever, pulling ears'
    ],
    source: 'AAP'
  },
  {
    id: 'sleep_association',
    name: 'Sleep Association',
    description: 'Baby needs help recreating how they fell asleep.',
    signs: [
      'Wakes at predictable intervals (every 2-3h)',
      'Cries immediately upon waking',
      'Calms only when picked up/fed/rocked'
    ],
    guidance: [
      'This is the #1 fixable cause of frequent waking',
      'Practice putting baby down drowsy but awake',
      'Consider sleep training if ready (4mo+)'
    ],
    source: 'Mindell'
  },
  {
    id: 'developmental_leap',
    name: 'Developmental Leap',
    description: 'Brain is busy processing new skills.',
    ageRange: { min: 3, max: 18 },
    signs: [
      'Practicing new skills (rolling, crawling, standing)',
      'More clingy during the day',
      'Temporary regression after good sleep'
    ],
    guidance: [
      'This is temporary (usually 1-3 weeks)',
      'Maintain consistent routines',
      'Extra practice of new skills during the day helps'
    ],
    source: 'Wonder Weeks / Mindell'
  },
  {
    id: 'separation_anxiety',
    name: 'Separation Anxiety',
    description: 'Baby realizes you exist when you\'re gone.',
    ageRange: { min: 6, max: 18 },
    signs: [
      'More clingy at bedtime',
      'Cries when you leave the room',
      'Wants to be held more than usual'
    ],
    guidance: [
      'Peak at 8-10 months and 18 months',
      'Practice short separations during the day',
      'Brief, boring check-ins are okay',
      'Consistency helps — they learn you always come back'
    ],
    source: 'Ferber'
  },
  {
    id: 'overtired',
    name: 'Overtiredness',
    description: 'Missed sleep window → cortisol spike → harder to sleep.',
    signs: [
      'Hyper/wired behavior before bed',
      'Takes forever to fall asleep',
      'Wakes frequently in first half of night',
      'Short naps earlier in day'
    ],
    guidance: [
      'Earlier bedtime tomorrow (even 30-60 min)',
      'Watch wake windows more carefully',
      'Prioritize first nap of the day'
    ],
    source: 'Weissbluth'
  },
  {
    id: 'undertired',
    name: 'Undertiredness',
    description: 'Not enough sleep pressure built up.',
    signs: [
      'Happy and alert at bedtime',
      'Takes 30+ min to fall asleep',
      'Wakes early in the morning ready to party',
      'Long naps during the day'
    ],
    guidance: [
      'Cap daytime sleep (age-appropriate limits)',
      'Extend wake windows slightly',
      'Push bedtime 15-30 min later'
    ],
    source: 'Ferber'
  },
  {
    id: 'teething',
    name: 'Teething',
    description: 'Tooth eruption can disrupt sleep temporarily.',
    ageRange: { min: 4, max: 24 },
    signs: [
      'Excessive drooling',
      'Chewing on everything',
      'Swollen gums',
      'Fussier than usual'
    ],
    guidance: [
      'Often blamed but rarely the sole cause',
      'Discomfort is usually worst when tooth breaks through',
      'Cool teething ring before bed can help',
      'Pain relief (consult pediatrician) if truly severe'
    ],
    source: 'AAP'
  },
  {
    id: 'habit',
    name: 'Habitual Waking',
    description: 'Baby wakes at the same time out of habit, not need.',
    signs: [
      'Wakes at exact same time every night',
      'Not particularly hungry or distressed',
      'Has been doing this for weeks'
    ],
    guidance: [
      'Delay response by a few minutes each night',
      'They often self-settle if given a chance',
      'Scheduled wake-up technique can help'
    ],
    source: 'Mindell'
  },
  {
    id: 'environmental',
    name: 'Environmental Factors',
    description: 'Room conditions affecting sleep.',
    signs: [
      'Wakes at consistent times (e.g., when furnace kicks on)',
      'Noise disturbances',
      'Light coming in'
    ],
    guidance: [
      'White noise machine (consistent, all night)',
      'Blackout curtains',
      'Check for temperature fluctuations',
      'Consistent sleep environment'
    ],
    source: 'Mindell'
  }
];

export function getRelevantWakeReasons(ageInMonths: number): WakeReasonInfo[] {
  return WAKE_REASONS.filter(reason => {
    if (!reason.ageRange) return true;
    return ageInMonths >= reason.ageRange.min && ageInMonths <= reason.ageRange.max;
  });
}

// ============================================================================
// OVERTIREDNESS VS UNDERTIREDNESS SIGNALS
// ============================================================================

export interface TirednessSignals {
  level: 'just-right' | 'overtired' | 'undertired';
  signals: string[];
  action: string;
}

export const TIREDNESS_SIGNALS = {
  drowsyCues: [
    'Yawning',
    'Eye rubbing',
    'Looking away',
    'Decreased activity',
    'Quieter than usual',
    'Red eyebrows or around eyes'
  ],
  overtiredCues: [
    'Hyperactive/wired',
    'Jerky movements',
    'Arching back',
    'Inconsolable crying',
    'Stiff body',
    'Fighting sleep intensely'
  ],
  undertiredCues: [
    'Happy and playful at sleep time',
    'Chatting in crib instead of sleeping',
    'Takes 30+ min to fall asleep',
    'Short naps (30 min) with happy wake',
    'Early morning waking (before 6 AM) but content'
  ]
};

// ============================================================================
// 3AM GUIDANCE MESSAGES - THE HEART OF THE SYSTEM
// ============================================================================

export interface GuidanceMessage {
  id: string;
  category: 'reassurance' | 'action' | 'science' | 'projection';
  priority: number; // 1 = highest
  message: string;
  subtext?: string;
}

/**
 * Get calming guidance for a 3AM night wake scenario
 */
export function getNightWakeGuidance(
  ageInMonths: number,
  sleepDurationMinutes: number,
  timeOfNight: 'early' | 'middle' | 'late' // early = before midnight, late = after 4am
): GuidanceMessage[] {
  const needs = getSleepNeedsForAge(ageInMonths);
  const messages: GuidanceMessage[] = [];
  
  // Reassurance based on how long they've slept
  const hoursSlept = sleepDurationMinutes / 60;
  
  if (hoursSlept >= 5) {
    messages.push({
      id: 'good-stretch',
      category: 'reassurance',
      priority: 1,
      message: `That was a ${formatHoursMinutes(sleepDurationMinutes)} stretch. That's solid for ${ageInMonths} months!`,
      subtext: 'One wake-up after a long stretch is developmentally normal.'
    });
  } else if (hoursSlept >= 3) {
    messages.push({
      id: 'normal-wake',
      category: 'reassurance',
      priority: 1,
      message: `Waking after ${formatHoursMinutes(sleepDurationMinutes)} is common at this age.`,
      subtext: 'Sleep cycles are 2-3 hours. They may be between cycles.'
    });
  } else {
    messages.push({
      id: 'short-wake',
      category: 'reassurance',
      priority: 1,
      message: 'Short stretches happen. You\'re doing great.',
      subtext: 'This could be overtiredness from earlier. Tomorrow is a new day.'
    });
  }
  
  // Action guidance
  messages.push({
    id: 'action-dark',
    category: 'action',
    priority: 2,
    message: 'Keep it boring: dim lights, minimal talking, slow movements.',
    subtext: 'Your calm energy helps them stay drowsy.'
  });
  
  // Age-specific feeding guidance
  if (ageInMonths >= 9 && needs.nightFeedsExpected === 0) {
    messages.push({
      id: 'feeding-optional',
      category: 'science',
      priority: 3,
      message: 'At this age, night feeds are optional — they can go 10-12h without eating.',
      subtext: 'A brief comfort nursing is fine, but they don\'t need calories.'
    });
  } else if (ageInMonths < 6) {
    messages.push({
      id: 'feeding-expected',
      category: 'science',
      priority: 3,
      message: 'Night feeds are still expected. Feed without guilt.',
      subtext: 'Their stomachs are small and they need the calories.'
    });
  }
  
  // Time-of-night specific guidance
  if (timeOfNight === 'early') {
    messages.push({
      id: 'early-wake-action',
      category: 'action',
      priority: 2,
      message: 'Early night wakes are often overtiredness.',
      subtext: 'Consider an earlier bedtime tomorrow.'
    });
  } else if (timeOfNight === 'late') {
    messages.push({
      id: 'late-wake-projection',
      category: 'projection',
      priority: 2,
      message: 'Close to morning — they may settle back for another 1-2 hours.',
      subtext: 'Or this might be wake-up time. Either is okay.'
    });
  }
  
  // Separation anxiety reminder for peak ages
  if (ageInMonths >= 8 && ageInMonths <= 10) {
    messages.push({
      id: 'separation-anxiety',
      category: 'science',
      priority: 4,
      message: 'Separation anxiety peaks around this age.',
      subtext: 'Brief reassurance is fine. They\'re learning you always come back.'
    });
  }
  
  return messages.sort((a, b) => a.priority - b.priority);
}

/**
 * Get guidance for when baby is currently sleeping (monitoring view)
 */
export function getDuringSleepGuidance(
  ageInMonths: number,
  sleepDurationMinutes: number,
  bedtime: string,
  currentTime: string
): GuidanceMessage[] {
  const needs = getSleepNeedsForAge(ageInMonths);
  const messages: GuidanceMessage[] = [];
  
  const hoursSlept = sleepDurationMinutes / 60;
  const expectedNightSleep = (needs.nightSleep.min + needs.nightSleep.max) / 2;
  const remainingHours = expectedNightSleep - hoursSlept;
  
  // Progress message
  messages.push({
    id: 'sleep-progress',
    category: 'science',
    priority: 1,
    message: `${formatHoursMinutes(sleepDurationMinutes)} of sleep so far.`,
    subtext: `Babies this age typically need ${needs.nightSleep.min}-${needs.nightSleep.max}h overnight.`
  });
  
  // Expected wake projection
  if (remainingHours > 0) {
    const expectedWakeTime = addMinutesToTimeString(bedtime, Math.round(expectedNightSleep * 60));
    const wakeWindowStart = addMinutesToTimeString(expectedWakeTime, -30);
    const wakeWindowEnd = addMinutesToTimeString(expectedWakeTime, 30);
    
    messages.push({
      id: 'wake-projection',
      category: 'projection',
      priority: 2,
      message: `Expected wake window: ${formatTime12h(wakeWindowStart)} - ${formatTime12h(wakeWindowEnd)}`,
      subtext: 'Based on typical sleep needs for this age.'
    });
  }
  
  // If it's the middle of the night
  const hour = parseInt(currentTime.split(':')[0]);
  if (hour >= 0 && hour < 5) {
    messages.push({
      id: 'overnight-reassurance',
      category: 'reassurance',
      priority: 3,
      message: 'Everything is on track. Try to rest while you can.',
      subtext: 'They\'ll let you know when they need you.'
    });
  }
  
  return messages.sort((a, b) => a.priority - b.priority);
}

/**
 * Get guidance for morning wake
 */
export function getMorningWakeGuidance(
  ageInMonths: number,
  totalNightSleepMinutes: number,
  wakeTime: string
): { summary: GuidanceMessage; schedule: DayProjection } {
  const needs = getSleepNeedsForAge(ageInMonths);
  const hoursSlept = totalNightSleepMinutes / 60;
  
  // Evaluate the night
  let summaryMessage: GuidanceMessage;
  if (hoursSlept >= needs.nightSleep.min) {
    summaryMessage = {
      id: 'great-night',
      category: 'reassurance',
      priority: 1,
      message: `${formatHoursMinutes(totalNightSleepMinutes)} of sleep — great night! 🌟`,
      subtext: `Target range: ${needs.nightSleep.min}-${needs.nightSleep.max}h`
    };
  } else if (hoursSlept >= needs.nightSleep.min - 1) {
    summaryMessage = {
      id: 'okay-night',
      category: 'reassurance',
      priority: 1,
      message: `${formatHoursMinutes(totalNightSleepMinutes)} — not bad! Could use a bit more.`,
      subtext: 'First nap might be a good one today.'
    };
  } else {
    summaryMessage = {
      id: 'tough-night',
      category: 'reassurance',
      priority: 1,
      message: `Tough night (${formatHoursMinutes(totalNightSleepMinutes)}). That's okay — recovery naps help.`,
      subtext: 'Consider an earlier bedtime tonight.'
    };
  }
  
  // Generate day schedule
  const schedule = generateDayProjection(ageInMonths, wakeTime);
  
  return { summary: summaryMessage, schedule };
}

// ============================================================================
// DAY SCHEDULE PROJECTION
// ============================================================================

export interface DayProjection {
  wakeTime: string;
  naps: { start: string; end: string; duration: number }[];
  bedtime: string;
  totalDaySleep: number; // minutes
  summary: string;
}

export function generateDayProjection(ageInMonths: number, wakeTime: string): DayProjection {
  // Import wake window guidelines
  const guidelines = getWakeWindowsForAge(ageInMonths);
  
  const naps: { start: string; end: string; duration: number }[] = [];
  let currentTime = wakeTime;
  let totalDaySleep = 0;
  
  // Generate naps based on wake windows
  const wakeWindows = [guidelines.firstWW, guidelines.subsequentWW, guidelines.lastWW];
  const napDurations = getNapDurations(ageInMonths, guidelines.napCount);
  
  for (let i = 0; i < guidelines.napCount; i++) {
    const ww = i === 0 ? wakeWindows[0] : (i === guidelines.napCount - 1 ? wakeWindows[2] : wakeWindows[1]);
    const napStart = addMinutesToTimeString(currentTime, ww);
    const napDuration = napDurations[i];
    const napEnd = addMinutesToTimeString(napStart, napDuration);
    
    naps.push({ start: napStart, end: napEnd, duration: napDuration });
    totalDaySleep += napDuration;
    currentTime = napEnd;
  }
  
  // Calculate bedtime
  const lastWW = wakeWindows[2];
  const bedtime = addMinutesToTimeString(currentTime, lastWW);
  
  // Generate summary
  const summaryParts = [`Nap 1 at ${formatTime12h(naps[0].start)}`];
  if (naps.length > 1) summaryParts.push(`Nap 2 at ${formatTime12h(naps[1].start)}`);
  if (naps.length > 2) summaryParts.push(`Nap 3 at ${formatTime12h(naps[2].start)}`);
  summaryParts.push(`Bedtime ${formatTime12h(bedtime)}`);
  
  return {
    wakeTime,
    naps,
    bedtime,
    totalDaySleep,
    summary: `Based on ${formatTime12h(wakeTime)} wake: ${summaryParts.join(', ')}`
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface WakeWindowGuidelines {
  napCount: number;
  firstWW: number;
  subsequentWW: number;
  lastWW: number;
}

function getWakeWindowsForAge(ageInMonths: number): WakeWindowGuidelines {
  if (ageInMonths < 4) return { napCount: 4, firstWW: 75, subsequentWW: 90, lastWW: 105 };
  if (ageInMonths < 6) return { napCount: 3, firstWW: 105, subsequentWW: 120, lastWW: 135 };
  if (ageInMonths < 8) return { napCount: 3, firstWW: 135, subsequentWW: 150, lastWW: 165 };
  if (ageInMonths < 10) return { napCount: 2, firstWW: 180, subsequentWW: 195, lastWW: 210 };
  if (ageInMonths < 12) return { napCount: 2, firstWW: 195, subsequentWW: 210, lastWW: 225 };
  if (ageInMonths < 15) return { napCount: 2, firstWW: 210, subsequentWW: 240, lastWW: 240 };
  if (ageInMonths < 18) return { napCount: 1, firstWW: 270, subsequentWW: 300, lastWW: 300 };
  return { napCount: 1, firstWW: 300, subsequentWW: 330, lastWW: 330 };
}

function getNapDurations(ageInMonths: number, napCount: number): number[] {
  // Returns expected nap durations in minutes
  if (napCount === 1) return [120]; // Single long nap
  if (napCount === 2) return [90, 75]; // Two naps
  if (napCount === 3) return [90, 60, 30]; // Three naps (last is catnap)
  return [45, 45, 45, 45]; // Four short naps (newborn)
}

function addMinutesToTimeString(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatTime12h(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

// ============================================================================
// SLEEP TIPS FOR 3AM PARENTS
// ============================================================================

export const CALM_3AM_TIPS = [
  "Deep breaths. This is temporary. You're exactly the parent they need.",
  "Keep the room dark. Your calm energy is contagious.",
  "Minimal eye contact, boring voice, slow movements.",
  "It's okay to take a moment before responding. 30 seconds won't hurt.",
  "Tomorrow is a fresh start. One tough night doesn't ruin progress.",
  "You're doing hard work in the dark. That's love.",
  "This season is short, even when nights feel long.",
  "If you need to take a break, put baby in a safe place and breathe.",
];

export function getRandomCalmTip(): string {
  return CALM_3AM_TIPS[Math.floor(Math.random() * CALM_3AM_TIPS.length)];
}

// ============================================================================
// DEVELOPMENTAL LEAPS / REGRESSIONS
// ============================================================================

export interface DevelopmentalInfo {
  ageMonths: number;
  name: string;
  sleepImpact: string;
  duration: string;
  tips: string[];
}

export const DEVELOPMENTAL_DISRUPTIONS: DevelopmentalInfo[] = [
  {
    ageMonths: 4,
    name: '4-Month Sleep Regression',
    sleepImpact: 'Sleep architecture permanently changes. More wake-ups as they cycle through light sleep.',
    duration: '2-6 weeks',
    tips: [
      'This is biological, not behavioral',
      'Good time to establish independent sleep skills',
      'Earlier bedtime can help'
    ]
  },
  {
    ageMonths: 8,
    name: '8-10 Month Regression (Separation Anxiety)',
    sleepImpact: 'Object permanence + separation anxiety = more wake-ups calling for you.',
    duration: '2-4 weeks',
    tips: [
      'Practice separations during the day',
      'Brief check-ins are okay',
      'Consistent response helps'
    ]
  },
  {
    ageMonths: 12,
    name: '12-Month Regression',
    sleepImpact: 'Walking practice, language explosion, possible nap strike.',
    duration: '2-4 weeks',
    tips: [
      'Don\'t drop to 1 nap yet — usually not ready',
      'Lots of practice of new skills during the day',
      'This too shall pass'
    ]
  },
  {
    ageMonths: 18,
    name: '18-Month Regression',
    sleepImpact: 'Independence surge + second separation anxiety peak.',
    duration: '2-6 weeks',
    tips: [
      'Firm, loving boundaries',
      'Consistent routine is key',
      'Acknowledge their feelings'
    ]
  }
];

export function getCurrentDevelopmentalContext(ageInMonths: number): DevelopmentalInfo | null {
  // Check if within ±1 month of a regression
  return DEVELOPMENTAL_DISRUPTIONS.find(d => 
    ageInMonths >= d.ageMonths - 1 && ageInMonths <= d.ageMonths + 1
  ) || null;
}
