'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreatePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to generate by default
    router.replace('/create/generate');
  }, [router]);

  return null;
}
