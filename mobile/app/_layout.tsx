import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0F172A' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'CAREPATH — Sign In', headerShown: false }} />
        <Stack.Screen name="profile" options={{ title: 'Health Profile Setup' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="upload/index" options={{ title: 'Upload Medical Report' }} />
        <Stack.Screen name="referral/[id]" options={{ title: 'Referral Details & QR' }} />
      </Stack>
    </>
  );
}
