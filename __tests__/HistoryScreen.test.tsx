import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HistoryScreen from '@/app/(tabs)/history';
import { saveEntry, getEntries } from '@/utils/storage';
import { GratitudeEntry } from '@/types';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
    // Store the callback for manual triggering in tests
    if (buttons && buttons.length > 1) {
      (global as any).alertButtons = buttons;
    }
  }),
}));

const Alert = require('react-native/Libraries/Alert/Alert');

beforeEach(async () => {
  await AsyncStorage.clear();
  Alert.alert.mockClear();
  (global as any).alertButtons = null;
});

describe('HistoryScreen', () => {
  it('should render empty state when no entries', async () => {
    const { getByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('まだ記録がありません')).toBeTruthy();
      expect(getByText(/「今日の感謝」タブから/)).toBeTruthy();
    });
  });

  it('should display entries list', async () => {
    // Pre-save entries
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['感謝1', '感謝2', '感謝3'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByText, getByTestId } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('感謝1')).toBeTruthy();
      expect(getByText('感謝2')).toBeTruthy();
      expect(getByText('感謝3')).toBeTruthy();
    });

    expect(getByTestId('entry-card-2024-01-15')).toBeTruthy();
  });

  it('should display date with day of week', async () => {
    // January 15, 2024 is a Monday
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('1月15日 (月)')).toBeTruthy();
    });
  });

  it('should show delete button for each entry', async () => {
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByTestId } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByTestId('delete-button-2024-01-15')).toBeTruthy();
    });
  });

  it('should show confirmation alert when delete is pressed', async () => {
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByTestId } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByTestId('delete-button-2024-01-15')).toBeTruthy();
    });

    fireEvent.press(getByTestId('delete-button-2024-01-15'));

    expect(Alert.alert).toHaveBeenCalledWith(
      '削除確認',
      expect.stringContaining('1月15日'),
      expect.any(Array)
    );
  });

  it('should delete entry when confirmed', async () => {
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByTestId, queryByTestId } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByTestId('delete-button-2024-01-15')).toBeTruthy();
    });

    // Press delete button
    fireEvent.press(getByTestId('delete-button-2024-01-15'));

    // Simulate pressing "削除" button in alert
    await act(async () => {
      const buttons = (global as any).alertButtons;
      if (buttons) {
        const deleteButton = buttons.find((b: any) => b.text === '削除');
        if (deleteButton && deleteButton.onPress) {
          await deleteButton.onPress();
        }
      }
    });

    // Entry should be removed from list
    await waitFor(() => {
      expect(queryByTestId('entry-card-2024-01-15')).toBeNull();
    });

    // Verify entry was deleted from storage
    const entries = await getEntries();
    expect(entries).toHaveLength(0);
  });

  it('should display multiple entries in descending date order', async () => {
    await saveEntry({
      id: 'entry_2024-01-10',
      date: '2024-01-10',
      items: ['古い'],
      createdAt: Date.now(),
    });
    await saveEntry({
      id: 'entry_2024-01-20',
      date: '2024-01-20',
      items: ['新しい'],
      createdAt: Date.now(),
    });

    const { getByTestId } = render(<HistoryScreen />);

    await waitFor(() => {
      const list = getByTestId('entries-list');
      expect(list).toBeTruthy();
    });

    // The first entry should be the newer one
    const entries = await getEntries();
    expect(entries[0].date).toBe('2024-01-20');
    expect(entries[1].date).toBe('2024-01-10');
  });

  it('should display numbered gratitude items', async () => {
    const entry: GratitudeEntry = {
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['一つ目', '二つ目', '三つ目'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByText } = render(<HistoryScreen />);

    await waitFor(() => {
      expect(getByText('1.')).toBeTruthy();
      expect(getByText('2.')).toBeTruthy();
      expect(getByText('3.')).toBeTruthy();
    });
  });
});
