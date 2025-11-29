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
      // Not authenticated, send to public welcome page
      router.replace('/welcome');
    } else {
      // Authenticated, redirect to explore
      router.replace('/explore');
    }
  }, [router]);

  // Show nothing while redirecting
  return null;
}
