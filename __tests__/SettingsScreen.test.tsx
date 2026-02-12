import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SettingsScreen from '@/app/(tabs)/settings';
import { saveSettings, getSettings, saveEntry } from '@/utils/storage';

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn((title, message, buttons) => {
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

describe('SettingsScreen', () => {
  it('should render reminder settings', async () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('🔔 リマインダー')).toBeTruthy();
      expect(getByText('毎日のリマインダー')).toBeTruthy();
      expect(getByTestId('reminder-switch')).toBeTruthy();
    });
  });

  it('should show default reminder time', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('21:00')).toBeTruthy();
    });
  });

  it('should toggle reminder on/off', async () => {
    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('reminder-switch')).toBeTruthy();
    });

    const toggle = getByTestId('reminder-switch');
    expect(toggle.props.value).toBe(true); // Default is on

    await act(async () => {
      fireEvent(toggle, 'valueChange', false);
    });

    await waitFor(async () => {
      const settings = await getSettings();
      expect(settings.reminderEnabled).toBe(false);
    });
  });

  it('should change reminder hour', async () => {
    const { getByTestId, getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('hour-20')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('hour-20'));
    });

    await waitFor(() => {
      expect(getByText('20:00')).toBeTruthy();
    });

    const settings = await getSettings();
    expect(settings.reminderHour).toBe(20);
  });

  it('should change reminder minute', async () => {
    const { getByTestId, getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('minute-30')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('minute-30'));
    });

    await waitFor(() => {
      expect(getByText('21:30')).toBeTruthy();
    });

    const settings = await getSettings();
    expect(settings.reminderMinute).toBe(30);
  });

  it('should render data management section', async () => {
    const { getByText, getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('📦 データ管理')).toBeTruthy();
      expect(getByTestId('clear-data-button')).toBeTruthy();
      expect(getByText('すべてのデータを削除')).toBeTruthy();
    });
  });

  it('should show confirmation when clear data is pressed', async () => {
    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('clear-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('clear-data-button'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'データを削除',
      expect.stringContaining('すべての感謝記録と設定が削除されます'),
      expect.any(Array)
    );
  });

  it('should clear all data when confirmed', async () => {
    // Pre-save some data
    await saveEntry({
      id: 'entry_2024-01-15',
      date: '2024-01-15',
      items: ['テスト'],
      createdAt: Date.now(),
    });
    await saveSettings({
      reminderEnabled: false,
      reminderHour: 22,
      reminderMinute: 30,
    });

    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('clear-data-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('clear-data-button'));

    // Simulate pressing "削除" button
    await act(async () => {
      const buttons = (global as any).alertButtons;
      if (buttons) {
        const deleteButton = buttons.find((b: any) => b.text === '削除');
        if (deleteButton && deleteButton.onPress) {
          await deleteButton.onPress();
        }
      }
    });

    // Verify alert was shown
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenLastCalledWith(
        '完了',
        'すべてのデータを削除しました'
      );
    });
  });

  it('should render about section', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('ℹ️ アプリについて')).toBeTruthy();
      expect(getByText('感謝日記')).toBeTruthy();
      expect(getByText('バージョン 1.0.0')).toBeTruthy();
    });
  });

  it('should load saved settings on mount', async () => {
    // Pre-save custom settings
    await saveSettings({
      reminderEnabled: false,
      reminderHour: 19,
      reminderMinute: 45,
    });

    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      const toggle = getByTestId('reminder-switch');
      expect(toggle.props.value).toBe(false);
    });
  });

  it('should show warning text about data deletion', async () => {
    const { getByText } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByText('⚠️ この操作は取り消せません')).toBeTruthy();
    });
  });

  it('should display hour picker options', async () => {
    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      // Check some hour options exist
      expect(getByTestId('hour-0')).toBeTruthy();
      expect(getByTestId('hour-12')).toBeTruthy();
      expect(getByTestId('hour-23')).toBeTruthy();
    });
  });

  it('should display minute picker options', async () => {
    const { getByTestId } = render(<SettingsScreen />);

    await waitFor(() => {
      expect(getByTestId('minute-0')).toBeTruthy();
      expect(getByTestId('minute-15')).toBeTruthy();
      expect(getByTestId('minute-30')).toBeTruthy();
      expect(getByTestId('minute-45')).toBeTruthy();
    });
  });
});
