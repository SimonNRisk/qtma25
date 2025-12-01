'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { FaHeart, FaArrowRight } from 'react-icons/fa';

interface RepackagePost {
  id: string;
  date: string;
  originalHook: string;
  reactions: number;
  engagementRate: string;
  alternativeHooks: string[];
}

// Make a post with astro to begin getting analytics on past posts

// const REPACKAGE_POSTS: RepackagePost[] = [
//   {
//     id: '1',
//     date: '2 weeks ago',
//     originalHook: `Just hit 10K followers on LinkedIn. Here's what I learned about building an audience:

// 1. Consistency beats perfection - I posted 3x/week for 6 months, even when I didn't feel like it
// 2. Value first, promotion second - 80% of my content educates, 20% promotes
// 3. Engage authentically - I respond to every comment for the first hour after posting

// The game-changer? Starting conversations, not just broadcasting.

// What's your biggest lesson in building an audience? 👇`,
//     reactions: 1247,
//     engagementRate: '12.4%',
//     alternativeHooks: [
//       `10K followers later, here's the truth about LinkedIn growth:

// Most people overthink it. I didn't.

// I just showed up consistently, gave value, and talked to people like humans.

// The secret? There isn't one. Just do the work.`,
//       `I hit 10K followers. Everyone asks "how?"

// The real answer: I stopped trying to go viral and started trying to help.

// 3 posts a week. Real conversations. Genuine value.

// That's it. That's the strategy.`
//     ],
//   },
//   {
//     id: '2',
//     date: '3 weeks ago',
//     originalHook: `We just raised our Series A. The fundraising process was brutal, but I learned 3 things that changed everything:

// 1. **Timing matters more than traction** - We started too early. By the time we got term sheets, our metrics had 2x'd. That changed everything.

// 2. **Your co-founder relationship will be tested** - Long nights, tough decisions, conflicting advice. If you're not aligned before, you won't be after.

// 3. **The "no" that hurts most isn't the rejection** - It's the one that comes after 3 months of conversations.

// But here's what I learned: every "no" made our pitch better. Every question we couldn't answer made us stronger.

// To everyone in the trenches: keep going. The right investors are out there.`,
//     reactions: 892,
//     engagementRate: '9.8%',
//     alternativeHooks: [
//       `Series A closed. Here's what fundraising really taught me:

// It's not about the money. It's about finding partners who believe in your vision when you're at your lowest.

// The process will test you. Your relationships. Your conviction.

// But if you're building something real, the right people will find you.`,
//       `We raised our Series A. The biggest lesson?

// Fundraising isn't about convincing investors you're right.

// It's about finding the ones who already believe you're right.

// The difference? Everything.`
//     ],
//   },
//   {
//     id: '3',
//     date: '1 month ago',
//     originalHook: `I fired my best employee last week.

// Not because they weren't talented. They were exceptional.

// But because they weren't aligned with where we're going.

// Here's what I learned:
// • Great skills + wrong direction = bad hire
// • Culture fit isn't optional, it's essential
// • Sometimes the hardest decisions are the right ones

// The team is stronger now. More focused. More aligned.

// Sometimes you have to let go of good to make room for great.`,
//     reactions: 2156,
//     engagementRate: '18.2%',
//     alternativeHooks: [
//       `I let go of my best performer last week.

// The hardest decision I've made as a founder.

// But here's why it was right: talent without alignment is just expensive misdirection.

// Sometimes you have to choose between what's good and what's right.`,
//       `Firing my best employee taught me this:

// Skills can be taught. Alignment can't.

// When someone's talented but going the wrong direction, you're not helping them by keeping them.

// You're hurting everyone.`
//     ],
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

export function Repackage() {
  const router = useRouter();

  const handleUseHook = (hookText: string) => {
    const encodedText = encodeURIComponent(hookText);
    router.push(`/create/edit?text=${encodedText}`);
  };

  return (
    <div className="animate-[fade-in_0.6s_ease-out]">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-medium text-white mb-2">Repackage Your Best Content</h2>
        <p className="text-white/60 text-sm">
          Take your well-performing posts and give them new life with fresh angles
        </p>
      </div>

      {/* Message: Make a post with astro first */}
      <div className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
            <FaHeart className="w-8 h-8 text-white/50" />
          </div>
          <div>
            <h3 className="text-xl font-medium text-white mb-2">Get Started with Repackaging</h3>
            <p className="text-white/60 text-sm max-w-md">
              Make a post with Astro first to begin getting analytics on past posts and repackage
              your best content
            </p>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {/* Make a post with astro to begin getting analytics on past posts */}
      {/* <div className="space-y-6">
        {REPACKAGE_POSTS.map(post => (
          <div
            key={post.id}
            className="bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:border-white/40 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-4">
                <span className="text-xs text-white/50">{post.date}</span>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <FaHeart className="w-4 h-4 text-red-400" />
                    <span>{post.reactions.toLocaleString()} reactions</span>
                  </div>
                  <div className="px-2 py-1 bg-white/10 rounded text-xs text-white/80 font-medium">
                    {post.engagementRate} engagement
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Original Post
                </span>
              </div>
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <p className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm">
                  {renderBoldText(post.originalHook)}
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Repackaged Hooks
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.alternativeHooks.map((hook, index) => (
                  <div
                    key={index}
                    className="bg-brand-dark/20 rounded-lg p-4 border border-white/10 flex flex-col"
                  >
                    <p className="text-white/80 leading-relaxed whitespace-pre-wrap text-sm mb-4 flex-1">
                      {hook}
                    </p>
                    <button
                      onClick={() => handleUseHook(hook)}
                      className="w-full py-2.5 text-white rounded-lg text-sm font-medium transition-colors hover:opacity-90 flex items-center justify-center gap-2 bg-astro-sky"
                    >
                      Use This Hook
                      <FaArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div> */}
    </div>
  );
}
