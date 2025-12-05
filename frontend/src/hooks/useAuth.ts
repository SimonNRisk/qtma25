'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/session';

export function useAuth(redirectTo: string = '/login') {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<{
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const isAuth = await session.isAuthenticated();
      const isExpired = await session.isTokenExpired();

      if (!isAuth || isExpired) {
        setIsAuthenticated(false);
        setUser(null);
        if (redirectTo) {
          router.replace(redirectTo);
        }
        return;
      }

      setIsAuthenticated(true);
      const userData = await session.getUser();
      setUser(userData);
    };

    checkAuth();
  }, [router, redirectTo]);

  const logout = async () => {
    await session.clear(); // Clear cookies via backend
    setIsAuthenticated(false);
    setUser(null);
    router.replace('/login');
  };

  return {
    isAuthenticated,
    user,
    logout,
    isLoading: isAuthenticated === null,
  };
}
