'use client';

import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export function useAuth() {
  const router = useRouter();
  const { user, workspace, workspaces, accessToken, isLoading, login, register, logout, setWorkspace } =
    useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string, totpCode?: string) => {
      await login(email, password, totpCode);
      router.push('/dashboard');
    },
    [login, router],
  );

  const handleRegister = useCallback(
    async (data: { name: string; email: string; password: string; workspaceName: string }) => {
      await register(data);
      router.push('/dashboard');
    },
    [register, router],
  );

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/login');
  }, [logout, router]);

  return {
    user,
    workspace,
    workspaces,
    accessToken,
    isLoading,
    isAuthenticated: !!user && !!accessToken,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    setWorkspace,
  };
}
