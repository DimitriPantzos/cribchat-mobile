/**
 * Dynamic Schedule Generator for CribChat Mobile
 */

export interface WakeWindowGuidelines {
  ageRange: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  firstWW: number;
  subsequentWW: number;
  lastWW: number;
  napCount: number;
  totalDaySleep: string;
  nightSleep: string;
  source: string;
  tip: string;
}

export const WAKE_WINDOW_GUIDELINES: WakeWindowGuidelines[] = [
  {
    ageRange: "0-2 months",
    ageMonthsMin: 0,
    ageMonthsMax: 2,
    firstWW: 45,
    subsequentWW: 60,
    lastWW: 60,
    napCount: 5,
    totalDaySleep: "6-8 hours",
    nightSleep: "8-10 hours (with feeds)",
    source: "Weissbluth",
    tip: "Watch for drowsy cues — newborns can only handle 45-90 min awake."
  },
  {
    ageRange: "2-4 months",
    ageMonthsMin: 2,
    ageMonthsMax: 4,
    firstWW: 75,
    subsequentWW: 90,
    lastWW: 105,
    napCount: 4,
    totalDaySleep: "4-5 hours",
    nightSleep: "10-11 hours",
    source: "Mindell",
    tip: "Circadian rhythm is developing. Start a bedtime routine."
  },
  {
    ageRange: "4-6 months",
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    firstWW: 105,
    subsequentWW: 120,
    lastWW: 135,
    napCount: 3,
    totalDaySleep: "3.5-4.5 hours",
    nightSleep: "10-12 hours",
    source: "Ferber",
    tip: "Sleep training can begin if desired."
  },
  {
    ageRange: "6-8 months",
    ageMonthsMin: 6,
    ageMonthsMax: 8,
    firstWW: 135,
    subsequentWW: 150,
    lastWW: 165,
    napCount: 3,
    totalDaySleep: "3-4 hours",
    nightSleep: "10-12 hours",
    source: "Weissbluth",
    tip: "3rd nap is a catnap (30-45 min)."
  },
  {
    ageRange: "8-10 months",
    ageMonthsMin: 8,
    ageMonthsMax: 10,
    firstWW: 180,
    subsequentWW: 195,
    lastWW: 210,
    napCount: 2,
    totalDaySleep: "2.5-3.5 hours",
    nightSleep: "11-12 hours",
    source: "Ferber",
    tip: "Most babies drop to 2 naps around 8-9 months."
  },
  {
    ageRange: "10-12 months",
    ageMonthsMin: 10,
    ageMonthsMax: 12,
    firstWW: 195,
    subsequentWW: 210,
    lastWW: 225,
    napCount: 2,
    totalDaySleep: "2-3 hours",
    nightSleep: "11-12 hours",
    source: "Mindell",
    tip: "Naps are consolidating."
  },
  {
    ageRange: "12-15 months",
    ageMonthsMin: 12,
    ageMonthsMax: 15,
    firstWW: 210,
    subsequentWW: 240,
    lastWW: 240,
    napCount: 2,
    totalDaySleep: "2-3 hours",
    nightSleep: "11-12 hours",
    source: "Weissbluth",
    tip: "Keep 2 naps until at least 15 months."
  },
  {
    ageRange: "15-18 months",
    ageMonthsMin: 15,
    ageMonthsMax: 18,
    firstWW: 270,
    subsequentWW: 300,
    lastWW: 300,
    napCount: 1,
    totalDaySleep: "2-2.5 hours",
    nightSleep: "11-12 hours",
    source: "Ferber",
    tip: "Transition to 1 nap is gradual."
  },
  {
    ageRange: "18-24 months",
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    firstWW: 300,
    subsequentWW: 330,
    lastWW: 330,
    napCount: 1,
    totalDaySleep: "1.5-2.5 hours",
    nightSleep: "11-12 hours",
    source: "Mindell",
    tip: "Single midday nap."
  }
];

export function getGuidelinesForAge(ageInMonths: number): WakeWindowGuidelines {
  for (const guidelines of WAKE_WINDOW_GUIDELINES) {
    if (ageInMonths >= guidelines.ageMonthsMin && ageInMonths < guidelines.ageMonthsMax) {
      return guidelines;
    }
  }
  return WAKE_WINDOW_GUIDELINES[WAKE_WINDOW_GUIDELINES.length - 1];
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatTimeDisplay(time: string): string {
  const [hours, mins] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(mins).padStart(2, '0')} ${period}`;
}

export interface FeedingGuidelines {
  ageRange: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  bottlesPerDay: number;
  ozPerBottle: number;
  totalOzPerDay: string;
  mealsPerDay: number;
  snacksPerDay: number;
  solidsNote: string;
  source: string;
}

export const FEEDING_GUIDELINES: FeedingGuidelines[] = [
  {
    ageRange: "0-4 months",
    ageMonthsMin: 0,
    ageMonthsMax: 4,
    bottlesPerDay: 8,
    ozPerBottle: 4,
    totalOzPerDay: "24-32 oz",
    mealsPerDay: 0,
    snacksPerDay: 0,
    solidsNote: "Breast milk or formula only",
    source: "AAP"
  },
  {
    ageRange: "4-6 months",
    ageMonthsMin: 4,
    ageMonthsMax: 6,
    bottlesPerDay: 5,
    ozPerBottle: 6,
    totalOzPerDay: "28-32 oz",
    mealsPerDay: 1,
    snacksPerDay: 0,
    solidsNote: "Introducing purees",
    source: "AAP"
  },
  {
    ageRange: "6-9 months",
    ageMonthsMin: 6,
    ageMonthsMax: 9,
    bottlesPerDay: 4,
    ozPerBottle: 7,
    totalOzPerDay: "24-32 oz",
    mealsPerDay: 2,
    snacksPerDay: 0,
    solidsNote: "2 meals, exploring textures",
    source: "WHO/AAP"
  },
  {
    ageRange: "9-12 months",
    ageMonthsMin: 9,
    ageMonthsMax: 12,
    bottlesPerDay: 3,
    ozPerBottle: 8,
    totalOzPerDay: "24-30 oz",
    mealsPerDay: 3,
    snacksPerDay: 1,
    solidsNote: "3 meals + 1 snack, finger foods",
    source: "WHO/AAP"
  },
  {
    ageRange: "12-18 months",
    ageMonthsMin: 12,
    ageMonthsMax: 18,
    bottlesPerDay: 2,
    ozPerBottle: 8,
    totalOzPerDay: "16-20 oz",
    mealsPerDay: 3,
    snacksPerDay: 2,
    solidsNote: "3 meals + 2 snacks, weaning",
    source: "AAP"
  },
  {
    ageRange: "18-24 months",
    ageMonthsMin: 18,
    ageMonthsMax: 24,
    bottlesPerDay: 0,
    ozPerBottle: 0,
    totalOzPerDay: "16-20 oz whole milk",
    mealsPerDay: 3,
    snacksPerDay: 2,
    solidsNote: "Bottles should be phased out",
    source: "AAP"
  }
];

export function getFeedingGuidelinesForAge(ageInMonths: number): FeedingGuidelines {
  for (const guidelines of FEEDING_GUIDELINES) {
    if (ageInMonths >= guidelines.ageMonthsMin && ageInMonths < guidelines.ageMonthsMax) {
      return guidelines;
    }
  }
  return FEEDING_GUIDELINES[FEEDING_GUIDELINES.length - 1];
}
