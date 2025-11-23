import React from 'react';
import { FaLightbulb, FaStar, FaFire, FaRocket, FaBookmark, FaArrowRight } from 'react-icons/fa';

export type StoryTag = 'Thought-Provoking' | 'Insightful' | 'Contrarian' | 'Engaging';

interface StoryCardProps {
  content: string;
  tag: StoryTag;
  className?: string;
}

const getTagIcon = (tag: StoryTag) => {
  switch (tag) {
    case 'Thought-Provoking':
      return <FaLightbulb className="w-3 h-3" />;
    case 'Insightful':
      return <FaStar className="w-3 h-3" />;
    case 'Contrarian':
      return <FaFire className="w-3 h-3" />;
    case 'Engaging':
      return <FaRocket className="w-3 h-3" />;
    default:
      return null;
  }
};

export function StoryCard({ content, tag, className = '' }: StoryCardProps) {
  return (
    <div
      className={`bg-brand-dark/30 backdrop-blur-sm border border-white/10 rounded-xl p-5 flex flex-col gap-4 relative group hover:border-white/30 transition-all duration-300 ${className}`}
    >
      <div className="absolute top-4 right-4 text-white/40 hover:text-white cursor-pointer transition-colors">
        <FaBookmark className="w-4 h-4" />
      </div>

      <div className="flex-1">
        <p className="text-lg font-medium text-white/90 leading-relaxed">
          {content}
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto pt-4">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-medium text-white/80">
          {tag}
          {getTagIcon(tag)}
        </div>
      </div>

      <button className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg flex items-center justify-center gap-2 text-sm font-medium text-white transition-all group-hover:bg-brand-blue/50">
        Create
        <FaArrowRight className="w-3 h-3" />
      </button>
    </div>
  );
}

