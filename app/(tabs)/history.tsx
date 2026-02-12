import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GratitudeEntry } from '@/types';
import { getEntries, deleteEntry } from '@/utils/storage';

export default function HistoryScreen() {
  const [entries, setEntries] = useState<GratitudeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    try {
      setIsLoading(true);
      const allEntries = await getEntries();
      setEntries(allEntries);
    } catch (error) {
      console.error('Failed to load entries:', error);
      Alert.alert('エラー', '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const formatDate = (dateStr: string): string => {
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayName = dayNames[date.getDay()];
    return `${parseInt(month)}月${parseInt(day)}日 (${dayName})`;
  };

  const handleDelete = (entry: GratitudeEntry) => {
    Alert.alert(
      '削除確認',
      `${formatDate(entry.date)}の記録を削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await deleteEntry(entry.id);
              if (success) {
                setEntries((prev) => prev.filter((e) => e.id !== entry.id));
              } else {
                Alert.alert('エラー', '削除に失敗しました');
              }
            } catch (error) {
              console.error('Failed to delete:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const renderEntry = ({ item }: { item: GratitudeEntry }) => (
    <View style={styles.entryCard} testID={`entry-card-${item.date}`}>
      <View style={styles.entryHeader}>
        <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
        <TouchableOpacity
          onPress={() => handleDelete(item)}
          style={styles.deleteButton}
          testID={`delete-button-${item.date}`}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemsContainer}>
        {item.items.map((gratitude, index) => (
          <View key={index} style={styles.gratitudeItem}>
            <Text style={styles.gratitudeNumber}>{index + 1}.</Text>
            <Text style={styles.gratitudeText}>{gratitude}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📝</Text>
      <Text style={styles.emptyTitle}>まだ記録がありません</Text>
      <Text style={styles.emptySubtitle}>
        「今日の感謝」タブから{'\n'}最初の感謝を記録してみましょう
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          entries.length === 0 && styles.listContentEmpty,
        ]}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        testID="entries-list"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#8E8E93',
  },
  entryCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF9500',
  },
  deleteButton: {
    padding: 4,
  },
  deleteButtonText: {
    fontSize: 18,
  },
  itemsContainer: {
    gap: 8,
  },
  gratitudeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  gratitudeNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginRight: 8,
    width: 20,
  },
  gratitudeText: {
    flex: 1,
    fontSize: 15,
    color: '#1C1C1E',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
});
