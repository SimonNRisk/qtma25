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
      className={`w-full p-4 rounded-xl border text-left transition-colors ${
        isSelected
          ? 'border-white bg-white/20'
          : 'border-white/40 bg-transparent hover:border-white/60 hover:bg-white/10'
      }`}
    >
      <p className="text-white font-medium mb-2">{text}</p>
      <div className="flex flex-wrap gap-1">
        <span className="text-xs text-white/70">Tags:</span>
        {tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-white/20 text-white text-xs rounded-full border border-white/30"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  );
};
