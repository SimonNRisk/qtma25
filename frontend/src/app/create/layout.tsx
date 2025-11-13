'use client';

import { usePathname, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

export default function CreateLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const isGenerate = pathname === '/create/generate' || pathname === '/create';
  const isEdit = pathname === '/create/edit';

  const handleTabClick = (tab: 'generate' | 'edit') => {
    router.push(`/create/${tab}`);
  };

  return (
    <AuthGuard>
      <div
        className="min-h-screen px-4 py-20 sm:px-6 lg:px-8"
        style={{
          background: 'var(--astro-hero-gradient)',
        }}
      >
        <div className="max-w-5xl mx-auto text-white">
          {/* Header */}
          <div className="text-center mb-14">
            <h1 className="text-left text-4xl sm:text-5xl font-medium tracking-tight mb-6 leading-tight text-foreground">
              Create your content
            </h1>
            <div className="h-px w-full max-w-3xl mr-auto bg-white/30 mb-6" />

            {/* Tab Pills */}
            <div className="flex items-center justify-start gap-4 mb-12">
              <button
                onClick={() => handleTabClick('generate')}
                className={`px-6 py-2 rounded-xl text-sm font-normal transition-all border ${
                  isGenerate
                    ? 'border-foreground bg-white/20 text-foreground shadow-[0_8px_20px_rgba(12,31,45,0.35)]'
                    : 'border-white/40 text-white/80 hover:border-white/70'
                }`}
              >
                Generate
              </button>
              <button
                onClick={() => handleTabClick('edit')}
                className={`px-6 py-2 rounded-xl text-sm font-normal transition-all border ${
                  isEdit
                    ? 'border-foreground bg-white/20 text-foreground shadow-[0_8px_20px_rgba(12,31,45,0.35)]'
                    : 'border-white/40 text-white/80 hover:border-white/70'
                }`}
              >
                Edit
              </button>
            </div>
          </div>

          {/* Page Content */}
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
