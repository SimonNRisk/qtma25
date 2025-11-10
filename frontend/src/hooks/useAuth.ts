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
    const checkAuth = () => {
      const token = session.access();
      const isTokenExpired = session.isTokenExpired();

      if (!token || isTokenExpired) {
        setIsAuthenticated(false);
        setUser(null);
        if (redirectTo) {
          router.replace(redirectTo);
        }
        return;
      }

      setIsAuthenticated(true);
      setUser(session.getUser());
    };

    checkAuth();
  }, [router, redirectTo]);

  const logout = () => {
    session.clear();
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
