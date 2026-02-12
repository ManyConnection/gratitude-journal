import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppSettings } from '@/types';
import { getSettings, saveSettings, clearAllData } from '@/utils/storage';
import { scheduleReminder, requestPermissions } from '@/utils/notifications';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({
    reminderEnabled: true,
    reminderHour: 21,
    reminderMinute: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const savedSettings = await getSettings();
      setSettings(savedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings])
  );

  const handleToggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const hasPermission = await requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          '通知の許可が必要です',
          '設定アプリから通知を許可してください'
        );
        return;
      }
    }

    const newSettings = { ...settings, reminderEnabled: enabled };
    setSettings(newSettings);
    await saveAndSchedule(newSettings);
  };

  const handleHourChange = async (hour: number) => {
    const newSettings = { ...settings, reminderHour: hour };
    setSettings(newSettings);
    await saveAndSchedule(newSettings);
  };

  const handleMinuteChange = async (minute: number) => {
    const newSettings = { ...settings, reminderMinute: minute };
    setSettings(newSettings);
    await saveAndSchedule(newSettings);
  };

  const saveAndSchedule = async (newSettings: AppSettings) => {
    try {
      setIsSaving(true);
      await saveSettings(newSettings);
      await scheduleReminder(newSettings);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('エラー', '設定の保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'データを削除',
      'すべての感謝記録と設定が削除されます。この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await clearAllData();
              if (success) {
                Alert.alert('完了', 'すべてのデータを削除しました');
                await loadSettings();
              } else {
                Alert.alert('エラー', '削除に失敗しました');
              }
            } catch (error) {
              console.error('Failed to clear data:', error);
              Alert.alert('エラー', '削除に失敗しました');
            }
          },
        },
      ]
    );
  };

  const formatTime = (hour: number, minute: number): string => {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  };

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
      {/* Reminder Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 リマインダー</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>毎日のリマインダー</Text>
            <Text style={styles.settingDescription}>
              設定した時間に通知でお知らせします
            </Text>
          </View>
          <Switch
            value={settings.reminderEnabled}
            onValueChange={handleToggleReminder}
            trackColor={{ false: '#E5E5EA', true: '#FFD699' }}
            thumbColor={settings.reminderEnabled ? '#FF9500' : '#FFF'}
            testID="reminder-switch"
          />
        </View>

        {settings.reminderEnabled && (
          <View style={styles.timeSelector}>
            <Text style={styles.timeSelectorLabel}>通知時刻</Text>
            <View style={styles.timePickers}>
              {/* Hour Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>時</Text>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.pickerItem,
                        settings.reminderHour === hour && styles.pickerItemSelected,
                      ]}
                      onPress={() => handleHourChange(hour)}
                      testID={`hour-${hour}`}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          settings.reminderHour === hour &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(hour).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Text style={styles.timeSeparator}>:</Text>

              {/* Minute Picker */}
              <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>分</Text>
                <ScrollView
                  style={styles.picker}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {MINUTES.map((minute) => (
                    <TouchableOpacity
                      key={minute}
                      style={[
                        styles.pickerItem,
                        settings.reminderMinute === minute &&
                          styles.pickerItemSelected,
                      ]}
                      onPress={() => handleMinuteChange(minute)}
                      testID={`minute-${minute}`}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          settings.reminderMinute === minute &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {String(minute).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.selectedTime}>
              <Text style={styles.selectedTimeLabel}>通知予定時刻:</Text>
              <Text style={styles.selectedTimeValue}>
                {formatTime(settings.reminderHour, settings.reminderMinute)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 データ管理</Text>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
          testID="clear-data-button"
        >
          <Text style={styles.dangerButtonText}>すべてのデータを削除</Text>
        </TouchableOpacity>

        <Text style={styles.warningText}>
          ⚠️ この操作は取り消せません
        </Text>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ℹ️ アプリについて</Text>
        <View style={styles.aboutCard}>
          <Text style={styles.appName}>感謝日記</Text>
          <Text style={styles.appVersion}>バージョン 1.0.0</Text>
          <Text style={styles.appDescription}>
            毎日3つの感謝を記録して、{'\n'}
            幸せな習慣を身につけましょう 🙏
          </Text>
        </View>
      </View>

      {isSaving && (
        <View style={styles.savingOverlay}>
          <Text style={styles.savingText}>保存中...</Text>
        </View>
      )}
    </ScrollView>
  );
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
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  timeSelector: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  timeSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  timePickers: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  pickerContainer: {
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  picker: {
    height: 120,
    width: 70,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  pickerItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  pickerItemText: {
    fontSize: 18,
    color: '#1C1C1E',
  },
  pickerItemTextSelected: {
    color: '#FFF',
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1C1C1E',
    marginHorizontal: 16,
  },
  selectedTime: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF5E6',
    padding: 12,
    borderRadius: 12,
  },
  selectedTimeLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  selectedTimeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF9500',
  },
  dangerButton: {
    backgroundColor: '#FFE5E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
  },
  aboutCard: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  appVersion: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  appDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
  },
  savingOverlay: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  savingText: {
    color: '#FFF',
    fontSize: 12,
  },
});
