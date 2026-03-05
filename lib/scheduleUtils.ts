/**
 * Schedule utilities for CribChat Mobile
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
}

export const WAKE_WINDOW_GUIDELINES: WakeWindowGuidelines[] = [
  { ageRange: "0-2 months", ageMonthsMin: 0, ageMonthsMax: 2, firstWW: 45, subsequentWW: 60, lastWW: 60, napCount: 5, totalDaySleep: "6-8 hours", nightSleep: "8-10 hours" },
  { ageRange: "2-4 months", ageMonthsMin: 2, ageMonthsMax: 4, firstWW: 75, subsequentWW: 90, lastWW: 105, napCount: 4, totalDaySleep: "4-5 hours", nightSleep: "10-11 hours" },
  { ageRange: "4-6 months", ageMonthsMin: 4, ageMonthsMax: 6, firstWW: 105, subsequentWW: 120, lastWW: 135, napCount: 3, totalDaySleep: "3.5-4.5 hours", nightSleep: "10-12 hours" },
  { ageRange: "6-8 months", ageMonthsMin: 6, ageMonthsMax: 8, firstWW: 135, subsequentWW: 150, lastWW: 165, napCount: 3, totalDaySleep: "3-4 hours", nightSleep: "10-12 hours" },
  { ageRange: "8-10 months", ageMonthsMin: 8, ageMonthsMax: 10, firstWW: 180, subsequentWW: 195, lastWW: 210, napCount: 2, totalDaySleep: "2.5-3.5 hours", nightSleep: "11-12 hours" },
  { ageRange: "10-12 months", ageMonthsMin: 10, ageMonthsMax: 12, firstWW: 195, subsequentWW: 210, lastWW: 225, napCount: 2, totalDaySleep: "2-3 hours", nightSleep: "11-12 hours" },
  { ageRange: "12-15 months", ageMonthsMin: 12, ageMonthsMax: 15, firstWW: 210, subsequentWW: 240, lastWW: 240, napCount: 2, totalDaySleep: "2-3 hours", nightSleep: "11-12 hours" },
  { ageRange: "15-18 months", ageMonthsMin: 15, ageMonthsMax: 18, firstWW: 270, subsequentWW: 300, lastWW: 300, napCount: 1, totalDaySleep: "2-2.5 hours", nightSleep: "11-12 hours" },
  { ageRange: "18-24 months", ageMonthsMin: 18, ageMonthsMax: 24, firstWW: 300, subsequentWW: 330, lastWW: 330, napCount: 1, totalDaySleep: "1.5-2.5 hours", nightSleep: "11-12 hours" },
];

export interface FeedingGuidelines {
  ageRange: string;
  ageMonthsMin: number;
  ageMonthsMax: number;
  bottlesPerDay: number;
  ozPerBottle: number;
  totalOzPerDay: string;
  mealsPerDay: number;
  snacksPerDay: number;
}

export const FEEDING_GUIDELINES: FeedingGuidelines[] = [
  { ageRange: "0-4 months", ageMonthsMin: 0, ageMonthsMax: 4, bottlesPerDay: 8, ozPerBottle: 4, totalOzPerDay: "24-32 oz", mealsPerDay: 0, snacksPerDay: 0 },
  { ageRange: "4-6 months", ageMonthsMin: 4, ageMonthsMax: 6, bottlesPerDay: 5, ozPerBottle: 6, totalOzPerDay: "28-32 oz", mealsPerDay: 1, snacksPerDay: 0 },
  { ageRange: "6-9 months", ageMonthsMin: 6, ageMonthsMax: 9, bottlesPerDay: 4, ozPerBottle: 7, totalOzPerDay: "24-32 oz", mealsPerDay: 2, snacksPerDay: 0 },
  { ageRange: "9-12 months", ageMonthsMin: 9, ageMonthsMax: 12, bottlesPerDay: 3, ozPerBottle: 8, totalOzPerDay: "24-30 oz", mealsPerDay: 3, snacksPerDay: 1 },
  { ageRange: "12-18 months", ageMonthsMin: 12, ageMonthsMax: 18, bottlesPerDay: 2, ozPerBottle: 8, totalOzPerDay: "16-20 oz", mealsPerDay: 3, snacksPerDay: 2 },
  { ageRange: "18-24 months", ageMonthsMin: 18, ageMonthsMax: 24, bottlesPerDay: 0, ozPerBottle: 0, totalOzPerDay: "16-20 oz (cup)", mealsPerDay: 3, snacksPerDay: 2 },
];

export function getGuidelinesForAge(ageInMonths: number): WakeWindowGuidelines {
  for (const g of WAKE_WINDOW_GUIDELINES) { if (ageInMonths >= g.ageMonthsMin && ageInMonths < g.ageMonthsMax) return g; }
  return WAKE_WINDOW_GUIDELINES[WAKE_WINDOW_GUIDELINES.length - 1];
}

export function getFeedingGuidelinesForAge(ageInMonths: number): FeedingGuidelines {
  for (const g of FEEDING_GUIDELINES) { if (ageInMonths >= g.ageMonthsMin && ageInMonths < g.ageMonthsMax) return g; }
  return FEEDING_GUIDELINES[FEEDING_GUIDELINES.length - 1];
}

export function getAgeFromBirthdate(birthDate: string): number {
  const birth = new Date(birthDate); const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months--;
  return Math.max(0, months);
}

export function getAgeDisplay(ageInMonths: number): string {
  const years = Math.floor(ageInMonths / 12); const months = ageInMonths % 12;
  return years > 0 ? (months > 0 ? `${years}y ${months}mo` : `${years}y`) : `${ageInMonths}mo`;
}

export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60); const m = minutes % 60;
  return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
}

export function formatTimeDisplay(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function formatTimeSince(timestamp: number | string | undefined): string {
  if (!timestamp) return 'Not logged';
  const time = typeof timestamp === 'string' ? new Date().setHours(parseInt(timestamp.split(':')[0]), parseInt(timestamp.split(':')[1])) : timestamp;
  const diff = Date.now() - time;
  if (diff < 0) return 'Just now';
  const minutes = Math.floor(diff / 60000); const hours = Math.floor(minutes / 60); const days = Math.floor(hours / 24);
  return days > 0 ? `${days}d ${hours % 24}h ago` : hours > 0 ? `${hours}h ${minutes % 60}m ago` : `${minutes}m ago`;
}

export function getCurrentTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function getNextNapTime(wakeTime: string | undefined, naps: Array<{ startTime: string; endTime?: string }>, ageInMonths: number): { time: string; minutesUntil: number } | null {
  if (!wakeTime) return null;
  const guidelines = getGuidelinesForAge(ageInMonths);
  const completedNaps = naps.filter(n => n.endTime).length;
  if (completedNaps >= guidelines.napCount) return null;
  let lastWakeTime = wakeTime;
  if (naps.length > 0) { const lastNap = naps[naps.length - 1]; if (lastNap.endTime) lastWakeTime = lastNap.endTime; else return null; }
  const wakeWindow = completedNaps === 0 ? guidelines.firstWW : completedNaps === guidelines.napCount - 1 ? guidelines.lastWW : guidelines.subsequentWW;
  const nextNapTime = addMinutesToTime(lastWakeTime, wakeWindow);
  const [napH, napM] = nextNapTime.split(':').map(Number);
  const napDate = new Date(); napDate.setHours(napH, napM, 0, 0);
  return { time: nextNapTime, minutesUntil: Math.round((napDate.getTime() - Date.now()) / 60000) };
}
