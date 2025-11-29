'use client';

import { useState } from 'react';
import { FaBookmark, FaCopy, FaCheck, FaEdit } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

interface HookSuggestionProps {
  hook: {
    id: string;
    content: string;
    index: number;
    isBookmarked?: boolean;
  };
  onBookmark?: (hookId: string) => void;
  onCopy?: (hookId: string, content: string) => void;
  copiedId?: string | null;
}

export function HookSuggestion({ hook, onBookmark, onCopy, copiedId }: HookSuggestionProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleUseHook = () => {
    router.push(`/create/edit?text=${encodeURIComponent(hook.content)}`);
  };

  return (
    <div
      className="bg-gradient-to-r from-brand-dark/20 to-brand-blue/20 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:border-brand-dark transition-all shadow-lg mb-4 animate-in fade-in slide-in-from-bottom-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-brand-dark bg-brand-dark/20 px-2 py-1 rounded">
              Hook #{hook.index}
            </span>
            {hook.isBookmarked && (
              <span className="text-xs text-yellow-400 bg-yellow-400/20 px-2 py-1 rounded">
                Bookmarked
              </span>
            )}
          </div>
          <p className="text-white/90 whitespace-pre-wrap leading-relaxed">
            {hook.content.trim()}
          </p>
        </div>
        <button
          onClick={() => onBookmark?.(hook.id)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            hook.isBookmarked
              ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
              : 'text-white/60 bg-white/10 hover:bg-white/20 hover:text-white'
          }`}
          aria-label={hook.isBookmarked ? 'Bookmarked' : 'Bookmark this hook'}
        >
          <FaBookmark className={`w-5 h-5 ${hook.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => onCopy?.(hook.id, hook.content)}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
        >
          {copiedId === hook.id ? (
            <>
              <FaCheck className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <FaCopy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
        <button
          onClick={handleUseHook}
          className="flex items-center gap-2 px-4 py-2 bg-brand-dark hover:bg-brand-blue text-white text-sm rounded-lg transition-colors"
        >
          <FaEdit className="w-4 h-4" />
          Use This Hook
        </button>
      </div>
    </div>
  );
}

