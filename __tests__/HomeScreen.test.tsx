import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from '@/app/(tabs)/index';
import { saveEntry, getEntries } from '@/utils/storage';
import { GratitudeEntry } from '@/types';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
}));

const Alert = require('react-native/Libraries/Alert/Alert');

beforeEach(async () => {
  await AsyncStorage.clear();
  Alert.alert.mockClear();
});

describe('HomeScreen', () => {
  it('should render the home screen', async () => {
    const { getByText, getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('今日感謝していること')).toBeTruthy();
    });

    expect(getByTestId('gratitude-input-0')).toBeTruthy();
    expect(getByTestId('gratitude-input-1')).toBeTruthy();
    expect(getByTestId('gratitude-input-2')).toBeTruthy();
    expect(getByTestId('save-button')).toBeTruthy();
  });

  it('should display streak counter', async () => {
    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('0日連続')).toBeTruthy();
    });
  });

  it('should allow typing in gratitude inputs', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('gratitude-input-0')).toBeTruthy();
    });

    const input0 = getByTestId('gratitude-input-0');
    fireEvent.changeText(input0, '家族に感謝');

    expect(input0.props.value).toBe('家族に感謝');
  });

  it('should show alert when saving empty entries', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('save-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('save-button'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '入力してください',
        '少なくとも1つの感謝を入力してください'
      );
    });
  });

  it('should save entries when save button is pressed', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('gratitude-input-0')).toBeTruthy();
    });

    // Fill in gratitude
    fireEvent.changeText(getByTestId('gratitude-input-0'), '今日の感謝1');
    fireEvent.changeText(getByTestId('gratitude-input-1'), '今日の感謝2');

    // Press save
    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    // Check that entries were saved
    await waitFor(async () => {
      const entries = await getEntries();
      expect(entries.length).toBe(1);
      expect(entries[0].items).toContain('今日の感謝1');
      expect(entries[0].items).toContain('今日の感謝2');
    });
  });

  it('should show success alert after saving', async () => {
    const { getByTestId } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('gratitude-input-0')).toBeTruthy();
    });

    fireEvent.changeText(getByTestId('gratitude-input-0'), 'テスト感謝');

    await act(async () => {
      fireEvent.press(getByTestId('save-button'));
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '保存しました',
        '今日の感謝を記録しました 🙏'
      );
    });
  });

  it('should load existing entry for today', async () => {
    // Pre-save an entry for today
    const today = new Date().toISOString().split('T')[0];
    const entry: GratitudeEntry = {
      id: `entry_${today}`,
      date: today,
      items: ['既存の感謝1', '既存の感謝2', '既存の感謝3'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByTestId, getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByTestId('gratitude-input-0').props.value).toBe('既存の感謝1');
      expect(getByTestId('gratitude-input-1').props.value).toBe('既存の感謝2');
      expect(getByTestId('gratitude-input-2').props.value).toBe('既存の感謝3');
    });

    // Should show "recorded today" badge
    expect(getByText('✅ 今日は記録済み')).toBeTruthy();
  });

  it('should update button text when entry exists', async () => {
    // Pre-save an entry for today
    const today = new Date().toISOString().split('T')[0];
    const entry: GratitudeEntry = {
      id: `entry_${today}`,
      date: today,
      items: ['感謝'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('更新する')).toBeTruthy();
    });
  });

  it('should display streak count based on entries', async () => {
    // Create entries for consecutive days
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    await saveEntry({
      id: `entry_${today}`,
      date: today,
      items: ['今日'],
      createdAt: Date.now(),
    });
    await saveEntry({
      id: `entry_${yesterday}`,
      date: yesterday,
      items: ['昨日'],
      createdAt: Date.now(),
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('2日連続')).toBeTruthy();
    });
  });
});
