'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { session } from '@/lib/session';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = session.access();
    const isTokenExpired = session.isTokenExpired();

    if (!token || isTokenExpired) {
      // Not authenticated, redirect to login
      router.replace('/login');
    } else {
      // Authenticated, redirect to create
      router.replace('/create');
    }
  }, [router]);

  // Show nothing while redirecting
  return null;
}
