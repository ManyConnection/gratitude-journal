import * as Notifications from 'expo-notifications';
import { AppSettings } from '@/types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Request notification permissions
export async function requestPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.error('Failed to request permissions:', error);
    return false;
  }
}

// Schedule daily reminder notification
export async function scheduleReminder(settings: AppSettings): Promise<boolean> {
  try {
    // Cancel existing notifications first
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.reminderEnabled) {
      return true;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🙏 今日の感謝を記録しましょう',
        body: '3つの感謝を思い出して、心に留めてみませんか？',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: settings.reminderHour,
        minute: settings.reminderMinute,
      },
    });

    return true;
  } catch (error) {
    console.error('Failed to schedule reminder:', error);
    return false;
  }
}

// Cancel all scheduled notifications
export async function cancelAllReminders(): Promise<boolean> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return true;
  } catch (error) {
    console.error('Failed to cancel reminders:', error);
    return false;
  }
}

// Get scheduled notifications (for debugging)
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to get scheduled notifications:', error);
    return [];
  }
}
