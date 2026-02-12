import '@testing-library/react-native/extend-expect';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  SchedulableTriggerInputTypes: {
    DAILY: 'daily',
    WEEKLY: 'weekly',
    TIME_INTERVAL: 'timeInterval',
    CALENDAR: 'calendar',
    DATE: 'date',
  },
}));

// Mock expo-router
jest.mock('expo-router', () => {
  const mockReact = require('react');
  return {
    useRouter: () => ({
      push: jest.fn(),
      back: jest.fn(),
      replace: jest.fn(),
    }),
    useLocalSearchParams: () => ({}),
    useFocusEffect: (callback) => {
      mockReact.useEffect(() => {
        callback();
      }, []);
    },
    Link: 'Link',
    Tabs: {
      Screen: 'Screen',
    },
    Stack: {
      Screen: 'Screen',
    },
  };
});

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

// Silence console.error for expected test scenarios
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
       args[0].includes('Failed to request permissions') ||
       args[0].includes('Failed to cancel reminders') ||
       args[0].includes('Failed to get scheduled notifications'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
