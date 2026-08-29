import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: '#0F172A', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="journey"
        options={{
          title: 'My Journey',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>📑</Text>,
        }}
      />
      <Tabs.Screen
        name="find-care"
        options={{
          title: 'Find Care',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🏥</Text>,
        }}
      />
      <Tabs.Screen
        name="assistance"
        options={{
          title: 'CARELINK',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🧭</Text>,
        }}
      />
    </Tabs>
  );
}
