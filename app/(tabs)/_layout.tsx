import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

interface TabIconProps {
  emoji: string;
  focused: boolean;
}

function TabIcon({ emoji, focused }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF9500',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopColor: '#E5E5EA',
          height: 85,
          paddingBottom: 25,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: '#FFF5E6',
        },
        headerTintColor: '#1C1C1E',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '今日の感謝',
          headerTitle: '🙏 今日の感謝',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✏️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: '履歴',
          headerTitle: '📖 感謝の履歴',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: '統計',
          headerTitle: '📊 統計',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          headerTitle: '⚙️ 設定',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerFocused: {
    backgroundColor: '#FFF5E6',
  },
  emoji: {
    fontSize: 20,
  },
});
