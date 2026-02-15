// Notifications disabled - stub file

export async function requestNotificationPermissions(): Promise<boolean> {
  return false;
}

export async function scheduleReminderNotification(hour: number, minute: number): Promise<string | null> {
  return null;
}

export async function cancelAllNotifications(): Promise<void> {
  // No-op
}
