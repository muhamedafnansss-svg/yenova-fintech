import { Stack } from 'expo-router';
import { AuthProvider } from '../store/AuthContext';
import { useEffect } from 'react';
import { syncManager } from '../offline/SyncManager';

export default function RootLayout() {
  useEffect(() => {
    const unsubscribe = syncManager.initNetworkListener();
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
      </Stack>
    </AuthProvider>
  );
}
