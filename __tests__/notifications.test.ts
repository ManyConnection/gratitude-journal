import * as Notifications from 'expo-notifications';
import {
  requestPermissions,
  scheduleReminder,
  cancelAllReminders,
  getScheduledNotifications,
} from '@/utils/notifications';
import { AppSettings } from '@/types';

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  // Re-initialize mock implementations after clearAllMocks
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'granted',
  });
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
    status: 'granted',
  });
  (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue('notification-id');
  (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(undefined);
  (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
});

describe('Notifications', () => {
  describe('requestPermissions', () => {
    it('should return true when permission is granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestPermissions();
      expect(result).toBe(true);
    });

    it('should request permission if not already granted', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestPermissions();

      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when permission is denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestPermissions();
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockRejectedValue(
        new Error('Permission error')
      );

      const result = await requestPermissions();
      expect(result).toBe(false);
    });
  });

  describe('scheduleReminder', () => {
    const defaultSettings: AppSettings = {
      reminderEnabled: true,
      reminderHour: 21,
      reminderMinute: 0,
    };

    it('should cancel existing notifications before scheduling new one', async () => {
      await scheduleReminder(defaultSettings);

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });

    it('should schedule notification when reminder is enabled', async () => {
      await scheduleReminder(defaultSettings);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '🙏 今日の感謝を記録しましょう',
          body: '3つの感謝を思い出して、心に留めてみませんか？',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 21,
          minute: 0,
        },
      });
    });

    it('should not schedule when reminder is disabled', async () => {
      const disabledSettings: AppSettings = {
        ...defaultSettings,
        reminderEnabled: false,
      };

      await scheduleReminder(disabledSettings);

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should use custom time from settings', async () => {
      const customSettings: AppSettings = {
        reminderEnabled: true,
        reminderHour: 20,
        reminderMinute: 30,
      };

      await scheduleReminder(customSettings);

      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          trigger: expect.objectContaining({
            hour: 20,
            minute: 30,
          }),
        })
      );
    });

    it('should return true on success', async () => {
      const result = await scheduleReminder(defaultSettings);
      expect(result).toBe(true);
    });

    it('should return false when permission denied', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await scheduleReminder(defaultSettings);
      expect(result).toBe(false);
    });
  });

  describe('cancelAllReminders', () => {
    it('should call cancelAllScheduledNotificationsAsync', async () => {
      const result = await cancelAllReminders();

      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should handle errors gracefully', async () => {
      (Notifications.cancelAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Cancel error')
      );

      const result = await cancelAllReminders();
      expect(result).toBe(false);
    });
  });

  describe('getScheduledNotifications', () => {
    it('should return scheduled notifications', async () => {
      const mockNotifications = [{ id: '1' }, { id: '2' }];
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue(
        mockNotifications
      );

      const result = await getScheduledNotifications();
      expect(result).toEqual(mockNotifications);
    });

    it('should return empty array on error', async () => {
      (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(
        new Error('Fetch error')
      );

      const result = await getScheduledNotifications();
      expect(result).toEqual([]);
    });
  });
});
