import { StepCard } from './StepCard';
import { NavigationButtons } from './NavigationButtons';
import { HookCard } from './HookCard';

interface HooksSelectionStepProps {
  selectedHooks: string[];
  onHookToggle: (hook: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const HooksSelectionStep = ({
  selectedHooks,
  onHookToggle,
  onBack,
  onNext,
}: HooksSelectionStepProps) => {
  const hooks = [
    {
      text: "I pitched to 20 investors before our first yes. Here's what changed.",
      tags: ['Story', 'Leadership'],
    },
    {
      text: '3 mistakes killing most LinkedIn posts (and how to fix them).',
      tags: ['Tips', 'Content'],
    },
    {
      text: "Cold outreach is over— here's what works now.",
      tags: ['Opinion', 'Case Study'],
    },
    {
      text: 'We shipped a failed feature and learned three brutal lessons.',
      tags: ['Learning', 'Story'],
    },
    {
      text: "Leadership isn't just about vision. It's about small daily choices.",
      tags: ['Leadership', 'Philosophy'],
    },
    {
      text: 'What does the new AI regulation mean for founders?',
      tags: ['Industry', 'Analysis'],
    },
    {
      text: 'We tested 5 landing pages. One crushed the rest by 42%.',
      tags: ['Data', 'Case Study'],
    },
    {
      text: "Curious— what's the boldest career risk you've ever taken?",
      tags: ['Question', 'Engagement'],
    },
  ];

  return (
    <div className="w-[632px] mx-auto">
      <StepCard>
        <div className="space-y-6">
          {/* Header */}
          <h2 className="text-xl font-semibold text-white">
            Select at least 3 hooks that resemble your tone and style.
          </h2>

          {/* Hooks Grid */}
          <div className="grid grid-cols-2 gap-4">
            {hooks.map((hook, index) => (
              <HookCard
                key={index}
                text={hook.text}
                tags={hook.tags}
                isSelected={selectedHooks.includes(hook.text)}
                onClick={() => onHookToggle(hook.text)}
              />
            ))}
          </div>

          {/* Navigation */}
          <NavigationButtons
            onBack={onBack}
            onNext={onNext}
            showBack={true}
            showNext={true}
            nextText="Next →"
            backText="← Back"
            nextDisabled={selectedHooks.length < 3}
          />
        </div>
      </StepCard>
    </div>
  );
};
