'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaRocket, FaComments, FaCompass, FaCalendar, FaChartBar, FaUser } from 'react-icons/fa';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  isLogo?: boolean;
}

function SidebarItem({ href, icon, label, isActive, isLogo = false }: SidebarItemProps) {
  const color = isLogo || isActive ? 'text-white' : 'text-gray-400';

  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-colors duration-200"
      style={{
        backgroundColor: isActive ? 'rgba(60, 105, 142, 0.3)' : 'transparent',
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'rgba(60, 105, 142, 0.2)';
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div className={color}>{icon}</div>
      <span className={`text-xs mt-1 ${color}`}>{label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  // Determine active routes
  const isCreateActive = pathname?.includes('/create');
  const isExploreActive = pathname?.includes('/explore');
  const isScheduleActive = pathname?.includes('/schedule');
  const isAnalyzeActive = pathname?.includes('/analyze');
  const isUserActive = pathname?.includes('/me') || pathname === '/';

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-20 flex flex-col items-center py-6 z-50 border-r"
      style={{
        background:
          'linear-gradient(180deg, var(--astro-indigo) 0%, var(--astro-lazuli) 50%, var(--astro-indigo) 100%)',
        borderColor: 'rgba(60, 105, 142, 0.3)',
      }}
    >
      {/* Top section - Logo and main nav items */}
      <div className="flex flex-col items-center space-y-4 flex-1">
        {/* Astro Logo */}
        <div className="mb-6">
          <Link
            href="/"
            className="flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-colors duration-200"
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(60, 105, 142, 0.2)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div className="text-white">
              <FaRocket className="w-8 h-8" />
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <SidebarItem
          href="/create"
          icon={<FaComments className="w-6 h-6" />}
          label="Create"
          isActive={isCreateActive}
        />
        <SidebarItem
          href="/explore"
          icon={<FaCompass className="w-6 h-6" />}
          label="Explore"
          isActive={isExploreActive}
        />
        <SidebarItem
          href="/schedule"
          icon={<FaCalendar className="w-6 h-6" />}
          label="Schedule"
          isActive={isScheduleActive}
        />
        <SidebarItem
          href="/analyze"
          icon={<FaChartBar className="w-6 h-6" />}
          label="Analyze"
          isActive={isAnalyzeActive}
        />
      </div>

      {/* Bottom section - User */}
      <div className="mt-auto">
        <SidebarItem
          href="/me"
          icon={<FaUser className="w-6 h-6" />}
          label="user"
          isActive={isUserActive}
        />
      </div>
    </aside>
  );
}
