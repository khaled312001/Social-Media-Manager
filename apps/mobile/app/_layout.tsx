import { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '../src/store/auth.store';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

/** Watches auth state and redirects accordingly */
function AuthGuard() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const segments = useSegments();

  useEffect(() => {
    const inAuth = segments[0] === '(auth)';
    if (!accessToken && !inAuth) {
      router.replace('/(auth)/login');
    } else if (accessToken && inAuth) {
      router.replace('/(tabs)');
    }
  }, [accessToken, segments]);

  return null;
}

/** Restores session from secure storage on cold start */
function SessionRestorer() {
  useEffect(() => {
    (async () => {
      const token = await SecureStore.getItemAsync('auth-token');
      if (!token) return;

      try {
        const { apiClient } = await import('../src/lib/api');
        const res: any = await apiClient.get('/users/me');
        const user = res?.data ?? res;
        const wsId = await SecureStore.getItemAsync('workspace-id');
        useAuthStore.setState({
          accessToken: token,
          user,
          workspace: wsId ? { id: wsId, name: '', slug: '' } : null,
        });
      } catch {
        // Token expired — clear storage
        await Promise.all([
          SecureStore.deleteItemAsync('auth-token'),
          SecureStore.deleteItemAsync('refresh-token'),
          SecureStore.deleteItemAsync('workspace-id'),
        ]);
      }
    })();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionRestorer />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
