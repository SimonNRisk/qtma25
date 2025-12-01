'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaSlack } from 'react-icons/fa';

interface IntegrationHook {
  id: string;
  content: string;
  source: string;
  timestamp: string;
}

// Launching Dec 1st

// const SLACK_HOOKS: IntegrationHook[] = [
//   {
//     id: '1',
//     content: `🎉 Excited to share that we're growing our team! Just hired 2 incredible interns who are already making an impact.

// Here's what I learned from the hiring process:
// • Look for curiosity over credentials
// • Cultural fit matters more than you think
// • Fresh perspectives can challenge your assumptions

// The best part? Watching them bring new energy to the team. Sometimes the best hires are the ones who ask "why not?" instead of "why?"

// #Hiring #TeamBuilding #StartupLife`,
//     source: 'Slack - #general',
//     timestamp: '2 hours ago',
//   },
//   {
//     id: '2',
//     content: `Just wrapped up our Google Pay & Apple Pay integration. Here are the top 3 insights that surprised us:

// 1. **User behavior shifts dramatically** - Mobile payments increased our conversion rate by 34%. People want frictionless experiences.

// 2. **Security concerns are real** - We spent 2x more time on security than we budgeted. But it was worth it. Trust is everything.

// 3. **The "small" details matter** - The loading states, error messages, and edge cases? They make or break the experience.

// The biggest lesson? Ship fast, but don't compromise on the fundamentals. Your users notice.

// What's been your experience with payment integrations? Drop your insights below 👇

// #ProductDevelopment #FinTech #MobilePayments`,
//     source: 'Slack - #product',
//     timestamp: '5 hours ago',
//   },
//   {
//     id: '3',
//     content: `We just closed our Series A. Here's what I wish someone had told me before we started fundraising:

// **The process is emotional, not just financial.**
// You'll question everything - your product, your team, your vision. That's normal. The investors who get it will see through the noise.

// **Timing is everything.**
// We started fundraising 3 months too early. By the time we got term sheets, our metrics had improved 2x. That changed everything.

// **Your co-founder relationship will be tested.**
// Long nights, tough decisions, conflicting advice. If you're not aligned before fundraising, you won't be after.

// **The "no" that hurts the most isn't the rejection - it's the one that comes after 3 months of conversations.**

// But here's what I learned: every "no" made our pitch better. Every question we couldn't answer made us stronger.

// To everyone in the trenches: keep going. The right investors are out there. They just need to find you.

// #Fundraising #StartupLife #Entrepreneurship`,
//     source: 'Slack - #founders',
//     timestamp: '1 day ago',
//   },
// ];

// Helper function to render text with markdown-style bold (**text**)
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-semibold">
          {boldText}
        </strong>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

export function Integrations() {
  const router = useRouter();

  const handleUseHook = (hookText: string) => {
    const encodedText = encodeURIComponent(hookText);
    router.push(`/create/edit?text=${encodedText}`);
  };

  return (
    <div className="animate-[fade-in_0.6s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <FaSlack className="w-6 h-6 text-white/70" />
          <h2 className="text-2xl font-medium text-white">Slack Integration</h2>
        </div>
        <p className="text-white/60 text-sm">
          Internal company communications converted into LinkedIn-ready hooks
        </p>
      </div>

      {/* Launching Dec 1st */}
      <div className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <FaSlack className="w-12 h-12 text-white/50" />
          <div>
            <h3 className="text-xl font-medium text-white mb-2">Slack Integration</h3>
            <p className="text-white/60 text-sm">Launching Dec 1st</p>
          </div>
        </div>
      </div>

      {/* Hooks Grid - Commented out until launch */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SLACK_HOOKS.map(hook => (
          <div
            key={hook.id}
            className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/40 transition-all duration-300 flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FaSlack className="w-4 h-4 text-white/50" />
                <span className="text-xs text-white/50">{hook.source}</span>
              </div>
              <span className="text-xs text-white/40">{hook.timestamp}</span>
            </div>

            <div className="flex-1 mb-6">
              <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm">
                {renderBoldText(hook.content)}
              </p>
            </div>

            <button
              onClick={() => handleUseHook(hook.content)}
              className="w-full py-3 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90 bg-astro-sky"
            >
              Use Hook
            </button>
          </div>
        ))}
      </div> */}
    </div>
  );
}
