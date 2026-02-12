import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { GratitudeEntry } from '@/types';
import { getEntryByDate, saveEntry, getEntries } from '@/utils/storage';
import { getTodayString, calculateStreak } from '@/utils/streak';

export default function HomeScreen() {
  const [items, setItems] = useState<string[]>(['', '', '']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasEntryToday, setHasEntryToday] = useState(false);

  const today = getTodayString();

  const loadTodayEntry = useCallback(async () => {
    try {
      setIsLoading(true);
      const entry = await getEntryByDate(today);
      if (entry) {
        setItems(entry.items.length === 3 ? entry.items : [...entry.items, '', ''].slice(0, 3));
        setHasEntryToday(true);
      } else {
        setItems(['', '', '']);
        setHasEntryToday(false);
      }

      // Calculate streak
      const allEntries = await getEntries();
      const streakInfo = calculateStreak(allEntries);
      setCurrentStreak(streakInfo.currentStreak);
    } catch (error) {
      console.error('Failed to load entry:', error);
      Alert.alert('エラー', '読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useFocusEffect(
    useCallback(() => {
      loadTodayEntry();
    }, [loadTodayEntry])
  );

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);
  };

  const handleSave = async () => {
    const filledItems = items.filter((item) => item.trim() !== '');
    if (filledItems.length === 0) {
      Alert.alert('入力してください', '少なくとも1つの感謝を入力してください');
      return;
    }

    try {
      setIsSaving(true);
      const entry: GratitudeEntry = {
        id: `entry_${today}`,
        date: today,
        items: items.map((i) => i.trim()).filter((i) => i !== ''),
        createdAt: Date.now(),
      };

      const success = await saveEntry(entry);
      if (success) {
        setHasEntryToday(true);
        // Reload to update streak
        await loadTodayEntry();
        Alert.alert('保存しました', '今日の感謝を記録しました 🙏');
      } else {
        Alert.alert('エラー', '保存に失敗しました');
      }
    } catch (error) {
      console.error('Failed to save:', error);
      Alert.alert('エラー', '保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Date and Streak Header */}
        <View style={styles.header}>
          <Text style={styles.dateText}>{formatDate(today)}</Text>
          <View style={styles.streakContainer}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>{currentStreak}日連続</Text>
          </View>
        </View>

        {/* Status Badge */}
        {hasEntryToday && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✅ 今日は記録済み</Text>
          </View>
        )}

        {/* Gratitude Inputs */}
        <View style={styles.inputsContainer}>
          <Text style={styles.sectionTitle}>今日感謝していること</Text>

          {items.map((item, index) => (
            <View key={index} style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>{index + 1}.</Text>
              <TextInput
                style={styles.input}
                value={item}
                onChangeText={(value) => handleItemChange(index, value)}
                placeholder={`感謝 ${index + 1}`}
                placeholderTextColor="#C7C7CC"
                multiline
                maxLength={200}
                testID={`gratitude-input-${index}`}
              />
            </View>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          testID="save-button"
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? '保存中...' : hasEntryToday ? '更新する' : '保存する'}
          </Text>
        </TouchableOpacity>

        {/* Motivation Text */}
        <View style={styles.motivationContainer}>
          <Text style={styles.motivationText}>
            毎日3つの感謝を記録することで{'\n'}
            幸福度が向上することが研究で示されています 🌟
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF5E6',
  },
  scrollView: {
    flex: 1,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakEmoji: {
    fontSize: 16,
    marginRight: 4,
  },
  streakText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
  },
  statusBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: '#2E7D32',
    fontWeight: '600',
    fontSize: 14,
  },
  inputsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF9500',
    marginRight: 12,
    marginTop: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1C1C1E',
    minHeight: 48,
  },
  saveButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  motivationContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  motivationText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
