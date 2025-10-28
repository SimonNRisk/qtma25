interface HookCardProps {
  text: string;
  tags: string[];
  isSelected: boolean;
  onClick: () => void;
}

export const HookCard = ({ text, tags, isSelected, onClick }: HookCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-lg border text-left transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <p className="text-gray-900 font-medium mb-2">{text}</p>
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-gray-500">Tags:</span>
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
};
