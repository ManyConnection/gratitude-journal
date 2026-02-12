import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GratitudeEntry, StreakInfo, MonthlyStats } from '@/types';
import { getEntries, getEntriesByMonth } from '@/utils/storage';
import { calculateStreak } from '@/utils/streak';
import {
  calculateMonthlyStats,
  getCurrentMonth,
  formatMonthDisplay,
  getPreviousMonth,
  getNextMonth,
} from '@/utils/stats';

export default function StatsScreen() {
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const allEntries = await getEntries();

      // Calculate streak
      const streak = calculateStreak(allEntries);
      setStreakInfo(streak);

      // Calculate monthly stats
      const stats = calculateMonthlyStats(allEntries, selectedMonth);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
      Alert.alert('エラー', '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  const handlePreviousMonth = () => {
    setSelectedMonth(getPreviousMonth(selectedMonth));
  };

  const handleNextMonth = () => {
    const currentMonth = getCurrentMonth();
    const nextMonth = getNextMonth(selectedMonth);
    if (nextMonth <= currentMonth) {
      setSelectedMonth(nextMonth);
    }
  };

  const canGoNext = getNextMonth(selectedMonth) <= getCurrentMonth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Streak Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔥 連続記録</Text>
        <View style={styles.streakStats}>
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streakInfo?.currentStreak || 0}</Text>
            <Text style={styles.streakLabel}>現在の連続</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streakInfo?.longestStreak || 0}</Text>
            <Text style={styles.streakLabel}>最長連続</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakValue}>{streakInfo?.totalDays || 0}</Text>
            <Text style={styles.streakLabel}>総記録日数</Text>
          </View>
        </View>
      </View>

      {/* Monthly Summary Card */}
      <View style={styles.card}>
        <View style={styles.monthSelector}>
          <TouchableOpacity
            onPress={handlePreviousMonth}
            style={styles.monthButton}
            testID="prev-month-button"
          >
            <Text style={styles.monthButtonText}>◀</Text>
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{formatMonthDisplay(selectedMonth)}</Text>
          <TouchableOpacity
            onPress={handleNextMonth}
            style={[styles.monthButton, !canGoNext && styles.monthButtonDisabled]}
            disabled={!canGoNext}
            testID="next-month-button"
          >
            <Text
              style={[
                styles.monthButtonText,
                !canGoNext && styles.monthButtonTextDisabled,
              ]}
            >
              ▶
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.monthStats}>
          <View style={styles.monthStatItem}>
            <Text style={styles.monthStatValue}>{monthlyStats?.entryCount || 0}</Text>
            <Text style={styles.monthStatLabel}>記録日数</Text>
          </View>
          <View style={styles.monthStatItem}>
            <Text style={styles.monthStatValue}>
              {monthlyStats?.averageItemsPerDay?.toFixed(1) || '0.0'}
            </Text>
            <Text style={styles.monthStatLabel}>平均感謝数/日</Text>
          </View>
        </View>
      </View>

      {/* Word Cloud Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💭 よく使った言葉</Text>
        {monthlyStats && monthlyStats.topWords.length > 0 ? (
          <View style={styles.wordCloud}>
            {monthlyStats.topWords.slice(0, 15).map((word, index) => (
              <View
                key={`${word.word}-${index}`}
                style={[
                  styles.wordTag,
                  {
                    backgroundColor: getWordColor(index),
                    transform: [{ scale: getWordScale(index) }],
                  },
                ]}
              >
                <Text style={styles.wordText}>{word.word}</Text>
                <Text style={styles.wordCount}>{word.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyWords}>
            <Text style={styles.emptyWordsText}>
              この月の記録がまだありません
            </Text>
          </View>
        )}
      </View>

      {/* Motivation */}
      <View style={styles.motivationCard}>
        <Text style={styles.motivationEmoji}>✨</Text>
        <Text style={styles.motivationText}>
          {streakInfo && streakInfo.currentStreak >= 7
            ? '素晴らしい！1週間以上続けています！'
            : streakInfo && streakInfo.currentStreak >= 3
            ? '良い調子です！継続は力なり 💪'
            : '毎日少しずつ感謝を見つけましょう'}
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper functions for word cloud styling
function getWordColor(index: number): string {
  const colors = [
    '#FFE4B5',
    '#FFF0E0',
    '#FFE8CC',
    '#FFF5E6',
    '#FFEEDD',
    '#FFF2E5',
    '#FFE9D6',
    '#FFFAF0',
  ];
  return colors[index % colors.length];
}

function getWordScale(index: number): number {
  if (index < 3) return 1.1;
  if (index < 6) return 1.0;
  return 0.9;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF9500',
  },
  streakLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  streakDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5EA',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthButton: {
    padding: 8,
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 18,
    color: '#FF9500',
  },
  monthButtonTextDisabled: {
    color: '#C7C7CC',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  monthStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthStatItem: {
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF9500',
  },
  monthStatLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  wordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  wordCount: {
    fontSize: 11,
    color: '#8E8E93',
  },
  emptyWords: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyWordsText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  motivationCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
  },
});
