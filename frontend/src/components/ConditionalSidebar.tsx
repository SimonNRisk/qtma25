'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { shouldShowSidebar } from '@/lib/routes';

export function ConditionalSidebar() {
  const pathname = usePathname();

  if (!shouldShowSidebar(pathname)) {
    return null;
  }

  return <Sidebar />;
}
