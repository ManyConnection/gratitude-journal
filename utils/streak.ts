import { GratitudeEntry, StreakInfo } from '@/types';

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date string
export function getTodayString(): string {
  return formatDate(new Date());
}

// Parse date string to Date object
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Get the previous day's date string
export function getPreviousDay(dateStr: string): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() - 1);
  return formatDate(date);
}

// Calculate streak information from entries
export function calculateStreak(entries: GratitudeEntry[]): StreakInfo {
  if (entries.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDays: 0,
      lastEntryDate: null,
    };
  }

  // Sort entries by date descending
  const sortedDates = [...new Set(entries.map((e) => e.date))].sort((a, b) =>
    b.localeCompare(a)
  );

  const today = getTodayString();
  const yesterday = getPreviousDay(today);

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = today;

  // Check if today has an entry, otherwise start from yesterday
  if (!sortedDates.includes(today)) {
    if (sortedDates.includes(yesterday)) {
      checkDate = yesterday;
    } else {
      // No recent entries, streak is 0
      currentStreak = 0;
    }
  }

  if (sortedDates.includes(checkDate)) {
    currentStreak = 1;
    let nextCheck = getPreviousDay(checkDate);

    while (sortedDates.includes(nextCheck)) {
      currentStreak++;
      nextCheck = getPreviousDay(nextCheck);
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const currentDate = sortedDates[i];
    const nextDate = sortedDates[i + 1];
    const expectedPrevious = getPreviousDay(currentDate);

    if (nextDate === expectedPrevious) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return {
    currentStreak,
    longestStreak,
    totalDays: sortedDates.length,
    lastEntryDate: sortedDates[0],
  };
}

// Check if today's entry exists
export function hasTodayEntry(entries: GratitudeEntry[]): boolean {
  const today = getTodayString();
  return entries.some((e) => e.date === today);
}
