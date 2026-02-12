import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StatsScreen from '@/app/(tabs)/stats';
import { saveEntry } from '@/utils/storage';
import { GratitudeEntry } from '@/types';
import { getCurrentMonth, getPreviousMonth } from '@/utils/stats';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('StatsScreen', () => {
  it('should render streak card with zeros when no entries', async () => {
    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('🔥 連続記録')).toBeTruthy();
      expect(getByText('現在の連続')).toBeTruthy();
      expect(getByText('最長連続')).toBeTruthy();
      expect(getByText('総記録日数')).toBeTruthy();
    });
  });

  it('should display current streak', async () => {
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

    const { getAllByText } = render(<StatsScreen />);

    await waitFor(() => {
      // Should show 2 for current streak and total days
      const twos = getAllByText('2');
      expect(twos.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should display monthly stats', async () => {
    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('記録日数')).toBeTruthy();
      expect(getByText('平均感謝数/日')).toBeTruthy();
    });
  });

  it('should show month selector with navigation', async () => {
    const { getByTestId } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByTestId('prev-month-button')).toBeTruthy();
      expect(getByTestId('next-month-button')).toBeTruthy();
    });
  });

  it('should navigate to previous month', async () => {
    const currentMonth = getCurrentMonth();
    const prevMonth = getPreviousMonth(currentMonth);
    const [, prevMonthNum] = prevMonth.split('-').map(Number);

    const { getByTestId, getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByTestId('prev-month-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('prev-month-button'));

    await waitFor(() => {
      expect(getByText(new RegExp(`${prevMonthNum}月`))).toBeTruthy();
    });
  });

  it('should show word cloud section', async () => {
    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('💭 よく使った言葉')).toBeTruthy();
    });
  });

  it('should display words when entries exist', async () => {
    const currentMonth = getCurrentMonth();
    const entry: GratitudeEntry = {
      id: `entry_${currentMonth}-15`,
      date: `${currentMonth}-15`,
      items: ['家族に感謝', '友達に感謝', '健康に感謝'],
      createdAt: Date.now(),
    };
    await saveEntry(entry);

    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      // Should show full phrases from entries (tokenizer splits on whitespace)
      expect(getByText('家族に感謝')).toBeTruthy();
    });
  });

  it('should show empty message when no entries for month', async () => {
    // Navigate to a month with no entries
    const { getByTestId, getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByTestId('prev-month-button')).toBeTruthy();
    });

    // Go back several months to ensure no entries
    fireEvent.press(getByTestId('prev-month-button'));
    fireEvent.press(getByTestId('prev-month-button'));
    fireEvent.press(getByTestId('prev-month-button'));

    await waitFor(() => {
      expect(getByText('この月の記録がまだありません')).toBeTruthy();
    });
  });

  it('should show motivation message based on streak', async () => {
    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      // Default message for low streak
      expect(getByText('毎日少しずつ感謝を見つけましょう')).toBeTruthy();
    });
  });

  it('should show different motivation for 3+ day streak', async () => {
    const today = new Date().toISOString().split('T')[0];
    const dates = [today];
    for (let i = 1; i < 4; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dates.push(date);
    }

    for (const date of dates) {
      await saveEntry({
        id: `entry_${date}`,
        date,
        items: ['感謝'],
        createdAt: Date.now(),
      });
    }

    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('良い調子です！継続は力なり 💪')).toBeTruthy();
    });
  });

  it('should show special motivation for 7+ day streak', async () => {
    const today = new Date().toISOString().split('T')[0];
    const dates = [today];
    for (let i = 1; i < 8; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
      dates.push(date);
    }

    for (const date of dates) {
      await saveEntry({
        id: `entry_${date}`,
        date,
        items: ['感謝'],
        createdAt: Date.now(),
      });
    }

    const { getByText } = render(<StatsScreen />);

    await waitFor(() => {
      expect(getByText('素晴らしい！1週間以上続けています！')).toBeTruthy();
    });
  });

  it('should disable next button for current month', async () => {
    const { getByTestId } = render(<StatsScreen />);

    await waitFor(() => {
      const nextButton = getByTestId('next-month-button');
      expect(nextButton.props.accessibilityState?.disabled).toBe(true);
    });
  });
});
