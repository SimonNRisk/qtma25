import { FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { getUserName, handlePostClick } from './utils/utils';

interface HookCardProps {
  hook: {
    id: string;
    content: string;
  };
  user: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
}

export const HookCard = ({ hook, user }: HookCardProps) => {
  const router = useRouter();
  return (
    <div
      key={hook.id}
      className="aspect-[4/5] rounded-xl bg-white p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* Profile Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
          <FaUser className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{getUserName(user)}</div>
          <div className="text-gray-500 text-xs">LinkedIn Header</div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto mb-4">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{hook.content}</p>
      </div>

      {/* Edit Button */}
      <button
        className="w-full py-3 bg-brand-dark hover:bg-brand-blue text-foreground font-medium rounded-lg transition-colors"
        onClick={() => handlePostClick({ content: hook.content }, router)}
      >
        Edit
      </button>
    </div>
  );
};
