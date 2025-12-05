'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { session } from '@/lib/session';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we're coming from OAuth callback (has code or access_token in URL)
    // If so, give cookies more time to be set before checking auth
    const isOAuthCallback = searchParams.get('code') || searchParams.get('access_token');
    const initialDelay = isOAuthCallback ? 1000 : 0;

    const checkAuth = async () => {
      // Check authentication via API (cookies sent automatically)
      // Use more retries if we're coming from OAuth
      const retries = isOAuthCallback ? 5 : 2;
      const isAuth = await session.isAuthenticated(retries);

      if (isAuth) {
        router.replace('/explore');
      } else {
        router.replace('/welcome');
      }
    };

    // Add initial delay if coming from OAuth to give cookies time to be set
    if (initialDelay > 0) {
      setTimeout(checkAuth, initialDelay);
    } else {
      checkAuth();
    }
  }, [router, searchParams]);

  // Show nothing while redirecting
  return null;
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
