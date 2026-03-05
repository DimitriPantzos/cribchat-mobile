/**
 * Wake Window Calculator
 * 
 * Evidence-based wake windows derived from pediatric sleep research.
 */

export interface WakeWindowData {
  first: string;
  second: string;
  third?: string;
  fourth?: string;
  naps: number;
  source: string;
  notes?: string;
}

export function calculateWakeWindows(ageInMonths: number): WakeWindowData {
  if (ageInMonths < 2) {
    return {
      first: "0:45",
      second: "1:00",
      third: "1:00",
      fourth: "1:00",
      naps: 5,
      source: "Weissbluth",
      notes: "Watch for drowsy cues; newborns tire quickly"
    };
  }

  if (ageInMonths < 4) {
    return {
      first: "1:15",
      second: "1:30",
      third: "1:30",
      fourth: "1:45",
      naps: 4,
      source: "Mindell",
      notes: "Sleep patterns becoming more predictable"
    };
  }

  if (ageInMonths < 6) {
    return {
      first: "1:45",
      second: "2:00",
      third: "2:15",
      fourth: "2:15",
      naps: 3,
      source: "Ferber",
      notes: "May be ready for sleep training; 4→3 nap transition"
    };
  }

  if (ageInMonths < 8) {
    return {
      first: "2:15",
      second: "2:30",
      third: "2:45",
      naps: 3,
      source: "Weissbluth",
      notes: "3rd nap may become a catnap; watch for 3→2 transition signs"
    };
  }

  if (ageInMonths < 10) {
    return {
      first: "3:00",
      second: "3:15",
      third: "3:30",
      naps: 2,
      source: "Ferber",
      notes: "First WW is 3 hours! Well-established 2-nap schedule"
    };
  }

  if (ageInMonths < 12) {
    return {
      first: "3:15",
      second: "3:30",
      third: "3:45",
      naps: 2,
      source: "Mindell",
      notes: "Naps consolidating; may resist afternoon nap"
    };
  }

  if (ageInMonths < 15) {
    return {
      first: "3:30",
      second: "4:00",
      third: "4:00",
      naps: 2,
      source: "Weissbluth",
      notes: "Don't rush to 1 nap; most not ready until 15+ months"
    };
  }

  if (ageInMonths < 18) {
    return {
      first: "4:30",
      second: "5:00",
      naps: 1,
      source: "Ferber",
      notes: "Transitioning to 1 nap; may need early bedtime during transition"
    };
  }

  return {
    first: "5:00",
    second: "5:30",
    naps: 1,
    source: "Mindell",
    notes: "Single afternoon nap; 5-6 hour wake windows typical"
  };
}

export function formatWakeWindowsDisplay(ww: WakeWindowData): string {
  const windows = [ww.first, ww.second];
  if (ww.third) windows.push(ww.third);
  return windows.join(' → ');
}
