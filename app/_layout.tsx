import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { getSettings } from '@/utils/storage';
import { scheduleReminder } from '@/utils/notifications';

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

export default function RootLayout() {
  useEffect(() => {
    // Setup reminder on app launch
    async function setupReminder() {
      try {
        const settings = await getSettings();
        await scheduleReminder(settings);
      } catch (error) {
        console.error('Failed to setup reminder:', error);
      }
    }
    setupReminder();
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
