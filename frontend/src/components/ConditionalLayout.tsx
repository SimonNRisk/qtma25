'use client';

import { usePathname } from 'next/navigation';
import { shouldShowSidebar } from '@/lib/routes';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return <div className={shouldShowSidebar(pathname) ? 'ml-20' : ''}>{children}</div>;
}
