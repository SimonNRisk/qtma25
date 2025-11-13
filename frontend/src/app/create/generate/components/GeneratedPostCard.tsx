'use client';

import { useRouter } from 'next/navigation';
import { FaBookmark } from 'react-icons/fa';
import { GeneratedPost } from '../hooks/useGeneratePosts';

interface GeneratedPostCardProps {
  post: GeneratedPost;
  copiedId: string | null;
  onBookmark: (post: GeneratedPost, e: React.MouseEvent) => void;
  onCopy: (postId: string, content: string) => void;
}

export function GeneratedPostCard({ post, copiedId, onBookmark, onCopy }: GeneratedPostCardProps) {
  const router = useRouter();

  const handlePostClick = () => {
    // Only navigate if not bookmarked
    if (!post.isBookmarked) {
      router.push(`/create/edit?text=${encodeURIComponent(post.content)}`);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy(post.id, post.content);
  };

  const handleUsePost = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/create/edit?text=${encodeURIComponent(post.content)}`);
  };

  return (
    <div
      onClick={handlePostClick}
      className={`bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 transition-colors ${
        post.isBookmarked
          ? 'border-yellow-400/50 bg-yellow-400/5'
          : 'hover:bg-white/15 cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <p className="text-white/90 whitespace-pre-wrap leading-relaxed flex-1 pointer-events-none">
          {post.content}
        </p>
        <button
          onClick={e => onBookmark(post, e)}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            post.isBookmarked
              ? 'text-yellow-400 bg-yellow-400/20 hover:bg-yellow-400/30'
              : 'text-white/60 bg-white/10 hover:bg-white/20 hover:text-white'
          }`}
          aria-label={post.isBookmarked ? 'Bookmarked' : 'Bookmark this post'}
          title={post.isBookmarked ? 'Bookmarked' : 'Bookmark this post'}
        >
          <FaBookmark className={`w-5 h-5 ${post.isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
        >
          {copiedId === post.id ? 'Copied!' : 'Copy'}
        </button>
        {!post.isBookmarked && (
          <button
            onClick={handleUsePost}
            className="px-4 py-2 bg-brand-dark hover:bg-brand-blue text-white text-sm rounded-lg transition-colors"
          >
            Use This Post
          </button>
        )}
        {post.isBookmarked && (
          <span className="px-4 py-2 bg-yellow-400/20 text-yellow-400 text-sm rounded-lg">
            Bookmarked
          </span>
        )}
      </div>
    </div>
  );
}
