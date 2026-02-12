export interface GratitudeEntry {
  id: string;
  date: string; // YYYY-MM-DD
  items: string[]; // 3 gratitude items
  createdAt: number; // timestamp
}

export interface AppSettings {
  reminderEnabled: boolean;
  reminderHour: number;
  reminderMinute: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lastEntryDate: string | null;
}

export interface WordFrequency {
  word: string;
  count: number;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  entryCount: number;
  topWords: WordFrequency[];
  averageItemsPerDay: number;
}
