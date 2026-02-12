import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getEntries,
  getEntryByDate,
  saveEntry,
  deleteEntry,
  getEntriesByMonth,
  getSettings,
  saveSettings,
  clearAllData,
} from '@/utils/storage';
import { GratitudeEntry, AppSettings } from '@/types';

// Clear AsyncStorage before each test
beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('Storage - Entries', () => {
  const mockEntry: GratitudeEntry = {
    id: 'entry_2024-01-15',
    date: '2024-01-15',
    items: ['感謝1', '感謝2', '感謝3'],
    createdAt: Date.now(),
  };

  describe('getEntries', () => {
    it('should return empty array when no entries exist', async () => {
      const entries = await getEntries();
      expect(entries).toEqual([]);
    });

    it('should return all saved entries', async () => {
      await saveEntry(mockEntry);
      const entries = await getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].date).toBe('2024-01-15');
    });
  });

  describe('getEntryByDate', () => {
    it('should return null when entry does not exist', async () => {
      const entry = await getEntryByDate('2024-01-15');
      expect(entry).toBeNull();
    });

    it('should return entry for specific date', async () => {
      await saveEntry(mockEntry);
      const entry = await getEntryByDate('2024-01-15');
      expect(entry).not.toBeNull();
      expect(entry?.items).toEqual(['感謝1', '感謝2', '感謝3']);
    });
  });

  describe('saveEntry', () => {
    it('should save a new entry', async () => {
      const success = await saveEntry(mockEntry);
      expect(success).toBe(true);

      const entries = await getEntries();
      expect(entries).toHaveLength(1);
    });

    it('should update existing entry for same date', async () => {
      await saveEntry(mockEntry);

      const updatedEntry: GratitudeEntry = {
        ...mockEntry,
        items: ['更新1', '更新2', '更新3'],
      };
      await saveEntry(updatedEntry);

      const entries = await getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].items).toEqual(['更新1', '更新2', '更新3']);
    });

    it('should sort entries by date descending', async () => {
      const entry1: GratitudeEntry = {
        id: 'entry_2024-01-10',
        date: '2024-01-10',
        items: ['感謝A'],
        createdAt: Date.now(),
      };
      const entry2: GratitudeEntry = {
        id: 'entry_2024-01-20',
        date: '2024-01-20',
        items: ['感謝B'],
        createdAt: Date.now(),
      };

      await saveEntry(entry1);
      await saveEntry(entry2);

      const entries = await getEntries();
      expect(entries[0].date).toBe('2024-01-20');
      expect(entries[1].date).toBe('2024-01-10');
    });
  });

  describe('deleteEntry', () => {
    it('should delete an entry by id', async () => {
      await saveEntry(mockEntry);

      const success = await deleteEntry(mockEntry.id);
      expect(success).toBe(true);

      const entries = await getEntries();
      expect(entries).toHaveLength(0);
    });

    it('should not affect other entries', async () => {
      const entry2: GratitudeEntry = {
        id: 'entry_2024-01-16',
        date: '2024-01-16',
        items: ['別の感謝'],
        createdAt: Date.now(),
      };

      await saveEntry(mockEntry);
      await saveEntry(entry2);

      await deleteEntry(mockEntry.id);

      const entries = await getEntries();
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe('entry_2024-01-16');
    });
  });

  describe('getEntriesByMonth', () => {
    it('should return entries for specific month', async () => {
      const jan1: GratitudeEntry = {
        id: 'entry_2024-01-10',
        date: '2024-01-10',
        items: ['1月'],
        createdAt: Date.now(),
      };
      const jan2: GratitudeEntry = {
        id: 'entry_2024-01-20',
        date: '2024-01-20',
        items: ['1月'],
        createdAt: Date.now(),
      };
      const feb: GratitudeEntry = {
        id: 'entry_2024-02-05',
        date: '2024-02-05',
        items: ['2月'],
        createdAt: Date.now(),
      };

      await saveEntry(jan1);
      await saveEntry(jan2);
      await saveEntry(feb);

      const janEntries = await getEntriesByMonth('2024-01');
      expect(janEntries).toHaveLength(2);

      const febEntries = await getEntriesByMonth('2024-02');
      expect(febEntries).toHaveLength(1);
    });
  });
});

describe('Storage - Settings', () => {
  describe('getSettings', () => {
    it('should return default settings when none exist', async () => {
      const settings = await getSettings();
      expect(settings.reminderEnabled).toBe(true);
      expect(settings.reminderHour).toBe(21);
      expect(settings.reminderMinute).toBe(0);
    });
  });

  describe('saveSettings', () => {
    it('should save and retrieve settings', async () => {
      const newSettings: AppSettings = {
        reminderEnabled: false,
        reminderHour: 20,
        reminderMinute: 30,
      };

      const success = await saveSettings(newSettings);
      expect(success).toBe(true);

      const retrieved = await getSettings();
      expect(retrieved.reminderEnabled).toBe(false);
      expect(retrieved.reminderHour).toBe(20);
      expect(retrieved.reminderMinute).toBe(30);
    });
  });
});

describe('Storage - Clear Data', () => {
  it('should clear all entries and settings', async () => {
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);
    await saveSettings({
      reminderEnabled: false,
      reminderHour: 22,
      reminderMinute: 0,
    });

    const success = await clearAllData();
    expect(success).toBe(true);

    const entries = await getEntries();
    expect(entries).toHaveLength(0);

    // Settings should return to defaults
    const settings = await getSettings();
    expect(settings.reminderEnabled).toBe(true);
    expect(settings.reminderHour).toBe(21);
  });
});
