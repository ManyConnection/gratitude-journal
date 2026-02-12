import {
  formatDate,
  getTodayString,
  parseDate,
  getPreviousDay,
  calculateStreak,
  hasTodayEntry,
} from '@/utils/streak';
import { GratitudeEntry } from '@/types';

describe('Streak Utilities', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should pad single digit month and day', () => {
      const date = new Date(2024, 2, 5); // March 5, 2024
      expect(formatDate(date)).toBe('2024-03-05');
    });
  });

  describe('parseDate', () => {
    it('should parse YYYY-MM-DD string to Date', () => {
      const date = parseDate('2024-01-15');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0); // January is 0
      expect(date.getDate()).toBe(15);
    });
  });

  describe('getPreviousDay', () => {
    it('should return previous day', () => {
      expect(getPreviousDay('2024-01-15')).toBe('2024-01-14');
    });

    it('should handle month boundary', () => {
      expect(getPreviousDay('2024-02-01')).toBe('2024-01-31');
    });

    it('should handle year boundary', () => {
      expect(getPreviousDay('2024-01-01')).toBe('2023-12-31');
    });
  });

  describe('calculateStreak', () => {
    // Helper to create entries
    const createEntry = (date: string): GratitudeEntry => ({
      id: `entry_${date}`,
      date,
      items: ['感謝'],
      createdAt: Date.now(),
    });

    it('should return zeros for empty entries', () => {
      const result = calculateStreak([]);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(0);
      expect(result.totalDays).toBe(0);
      expect(result.lastEntryDate).toBeNull();
    });

    it('should calculate streak for single entry today', () => {
      const today = getTodayString();
      const entries = [createEntry(today)];

      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
      expect(result.totalDays).toBe(1);
      expect(result.lastEntryDate).toBe(today);
    });

    it('should calculate consecutive days streak', () => {
      const today = getTodayString();
      const yesterday = getPreviousDay(today);
      const dayBefore = getPreviousDay(yesterday);

      const entries = [
        createEntry(today),
        createEntry(yesterday),
        createEntry(dayBefore),
      ];

      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.totalDays).toBe(3);
    });

    it('should reset current streak when day is skipped', () => {
      const today = getTodayString();
      const threeDaysAgo = getPreviousDay(getPreviousDay(getPreviousDay(today)));

      const entries = [
        createEntry(today),
        createEntry(threeDaysAgo),
      ];

      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(1);
      expect(result.totalDays).toBe(2);
    });

    it('should continue streak from yesterday if no entry today', () => {
      const today = getTodayString();
      const yesterday = getPreviousDay(today);
      const dayBefore = getPreviousDay(yesterday);

      const entries = [
        createEntry(yesterday),
        createEntry(dayBefore),
      ];

      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(2);
    });

    it('should track longest streak separately from current', () => {
      const today = getTodayString();
      const prev1 = getPreviousDay(today);
      // Gap
      const prev5 = getPreviousDay(
        getPreviousDay(getPreviousDay(getPreviousDay(prev1)))
      );
      const prev6 = getPreviousDay(prev5);
      const prev7 = getPreviousDay(prev6);
      const prev8 = getPreviousDay(prev7);
      const prev9 = getPreviousDay(prev8);

      const entries = [
        createEntry(today),
        createEntry(prev1),
        // Gap of 3 days
        createEntry(prev5),
        createEntry(prev6),
        createEntry(prev7),
        createEntry(prev8),
        createEntry(prev9),
      ];

      const result = calculateStreak(entries);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(5);
      expect(result.totalDays).toBe(7);
    });
  });

  describe('hasTodayEntry', () => {
    const createEntry = (date: string): GratitudeEntry => ({
      id: `entry_${date}`,
      date,
      items: ['感謝'],
      createdAt: Date.now(),
    });

    it('should return true if today has an entry', () => {
      const today = getTodayString();
      const entries = [createEntry(today)];
      expect(hasTodayEntry(entries)).toBe(true);
    });

    it('should return false if today has no entry', () => {
      const yesterday = getPreviousDay(getTodayString());
      const entries = [createEntry(yesterday)];
      expect(hasTodayEntry(entries)).toBe(false);
    });

    it('should return false for empty entries', () => {
      expect(hasTodayEntry([])).toBe(false);
    });
  });
});
