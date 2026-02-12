import AsyncStorage from '@react-native-async-storage/async-storage';
import { GratitudeEntry, AppSettings } from '@/types';

const ENTRIES_KEY = 'gratitude_entries';
const SETTINGS_KEY = 'app_settings';

const DEFAULT_SETTINGS: AppSettings = {
  reminderEnabled: true,
  reminderHour: 21,
  reminderMinute: 0,
};

// Get all gratitude entries
export async function getEntries(): Promise<GratitudeEntry[]> {
  try {
    const json = await AsyncStorage.getItem(ENTRIES_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to get entries:', error);
    return [];
  }
}

// Get entry for a specific date
export async function getEntryByDate(date: string): Promise<GratitudeEntry | null> {
  try {
    const entries = await getEntries();
    return entries.find((e) => e.date === date) ?? null;
  } catch (error) {
    console.error('Failed to get entry by date:', error);
    return null;
  }
}

// Save a new gratitude entry
export async function saveEntry(entry: GratitudeEntry): Promise<boolean> {
  try {
    const entries = await getEntries();
    const existingIndex = entries.findIndex((e) => e.date === entry.date);

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    // Sort by date descending
    entries.sort((a, b) => b.date.localeCompare(a.date));

    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return true;
  } catch (error) {
    console.error('Failed to save entry:', error);
    return false;
  }
}

// Delete an entry
export async function deleteEntry(id: string): Promise<boolean> {
  try {
    const entries = await getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Failed to delete entry:', error);
    return false;
  }
}

// Get entries for a specific month
export async function getEntriesByMonth(yearMonth: string): Promise<GratitudeEntry[]> {
  try {
    const entries = await getEntries();
    return entries.filter((e) => e.date.startsWith(yearMonth));
  } catch (error) {
    console.error('Failed to get entries by month:', error);
    return [];
  }
}

// Get app settings
export async function getSettings(): Promise<AppSettings> {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return DEFAULT_SETTINGS;
  }
}

// Save app settings
export async function saveSettings(settings: AppSettings): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

// Clear all data (for testing/reset)
export async function clearAllData(): Promise<boolean> {
  try {
    await AsyncStorage.multiRemove([ENTRIES_KEY, SETTINGS_KEY]);
    return true;
  } catch (error) {
    console.error('Failed to clear data:', error);
    return false;
  }
}
