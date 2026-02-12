import {
  tokenizeText,
  calculateWordFrequencies,
  getTopWords,
  calculateMonthlyStats,
  getCurrentMonth,
  formatMonthDisplay,
  getPreviousMonth,
  getNextMonth,
} from '@/utils/stats';
import { GratitudeEntry } from '@/types';

describe('Stats Utilities', () => {
  describe('tokenizeText', () => {
    it('should split text into words', () => {
      const words = tokenizeText('家族 友達 健康');
      expect(words).toContain('家族');
      expect(words).toContain('友達');
      expect(words).toContain('健康');
    });

    it('should filter out short words', () => {
      const words = tokenizeText('あ い う 家族');
      expect(words).not.toContain('あ');
      expect(words).toContain('家族');
    });

    it('should remove punctuation', () => {
      const words = tokenizeText('感謝！ありがとう。元気、');
      expect(words.every((w) => !/[！。、]/.test(w))).toBe(true);
    });

    it('should filter out stop words', () => {
      const words = tokenizeText('これは テスト です');
      expect(words).not.toContain('これ');
      expect(words).not.toContain('です');
      expect(words).toContain('テスト');
    });
  });

  describe('calculateWordFrequencies', () => {
    const createEntry = (date: string, items: string[]): GratitudeEntry => ({
      id: `entry_${date}`,
      date,
      items,
      createdAt: Date.now(),
    });

    it('should count word frequencies across entries', () => {
      const entries = [
        createEntry('2024-01-01', ['家族 感謝', '友達 感謝']),
        createEntry('2024-01-02', ['家族 愛情', '健康 体調']),
      ];

      const frequencies = calculateWordFrequencies(entries);
      const familyWord = frequencies.find((f) => f.word === '家族');

      expect(familyWord).toBeDefined();
      expect(familyWord?.count).toBe(2);
    });

    it('should sort by frequency descending', () => {
      const entries = [
        createEntry('2024-01-01', ['感謝 感謝 感謝']),
        createEntry('2024-01-02', ['友達']),
      ];

      const frequencies = calculateWordFrequencies(entries);
      expect(frequencies[0].count).toBeGreaterThanOrEqual(frequencies[1]?.count || 0);
    });

    it('should return empty array for no entries', () => {
      const frequencies = calculateWordFrequencies([]);
      expect(frequencies).toHaveLength(0);
    });
  });

  describe('getTopWords', () => {
    const createEntry = (date: string, items: string[]): GratitudeEntry => ({
      id: `entry_${date}`,
      date,
      items,
      createdAt: Date.now(),
    });

    it('should return limited number of words', () => {
      const entries = [
        createEntry('2024-01-01', ['一つ 二つ 三つ 四つ 五つ 六つ 七つ 八つ 九つ 十個 十一 十二']),
      ];

      const topWords = getTopWords(entries, 5);
      expect(topWords.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for no entries', () => {
      const topWords = getTopWords([], 10);
      expect(topWords).toHaveLength(0);
    });
  });

  describe('calculateMonthlyStats', () => {
    const createEntry = (date: string, items: string[]): GratitudeEntry => ({
      id: `entry_${date}`,
      date,
      items,
      createdAt: Date.now(),
    });

    it('should calculate stats for specific month', () => {
      const entries = [
        createEntry('2024-01-01', ['感謝1', '感謝2', '感謝3']),
        createEntry('2024-01-15', ['感謝A', '感謝B']),
        createEntry('2024-02-01', ['2月の感謝']),
      ];

      const stats = calculateMonthlyStats(entries, '2024-01');

      expect(stats.month).toBe('2024-01');
      expect(stats.entryCount).toBe(2);
      expect(stats.averageItemsPerDay).toBe(2.5); // (3 + 2) / 2
    });

    it('should return zeros for month with no entries', () => {
      const entries = [createEntry('2024-01-01', ['感謝'])];

      const stats = calculateMonthlyStats(entries, '2024-02');

      expect(stats.entryCount).toBe(0);
      expect(stats.averageItemsPerDay).toBe(0);
      expect(stats.topWords).toHaveLength(0);
    });
  });

  describe('Month Navigation', () => {
    describe('getCurrentMonth', () => {
      it('should return current month in YYYY-MM format', () => {
        const month = getCurrentMonth();
        expect(month).toMatch(/^\d{4}-\d{2}$/);
      });
    });

    describe('formatMonthDisplay', () => {
      it('should format month for display', () => {
        expect(formatMonthDisplay('2024-01')).toBe('2024年1月');
        expect(formatMonthDisplay('2024-12')).toBe('2024年12月');
      });
    });

    describe('getPreviousMonth', () => {
      it('should return previous month', () => {
        expect(getPreviousMonth('2024-03')).toBe('2024-02');
      });

      it('should handle year boundary', () => {
        expect(getPreviousMonth('2024-01')).toBe('2023-12');
      });
    });

    describe('getNextMonth', () => {
      it('should return next month', () => {
        expect(getNextMonth('2024-03')).toBe('2024-04');
      });

      it('should handle year boundary', () => {
        expect(getNextMonth('2024-12')).toBe('2025-01');
      });
    });
  });
});
