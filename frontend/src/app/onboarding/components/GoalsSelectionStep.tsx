import { StepCard } from './StepCard';
import { NavigationButtons } from './NavigationButtons';
import { WelcomeSection } from './WelcomeSection';

interface GoalsSelectionStepProps {
  selectedGoals: string[];
  onGoalToggle: (goal: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export const GoalsSelectionStep = ({
  selectedGoals,
  onGoalToggle,
  onBack,
  onNext,
}: GoalsSelectionStepProps) => {
  const goals = [
    'Generate leads',
    'Attract investors',
    'Recruit talent',
    'Build brand',
    'Build thought leadership',
    'Grow network',
    'Share industry insights',
    'Boost engagement',
    'Plan and schedule content',
    'Grow audience',
    'Stay organized',
    'Save time on posting',
    'Other'
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left Section - Welcome */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md">
          <WelcomeSection 
            title="What do you hope to achieve on Astro?"
            subtitle=""
          />
        </div>
      </div>

      {/* Right Section - Goals Selection */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[632px]">
          <StepCard>
            <div className="space-y-6">
              {/* Sub Header */}
              <p className="text-lg text-white/90">
                Select at least 2 goals to personalize your Astro experience.
              </p>

              {/* Goals Grid */}
              <div className="flex flex-wrap gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal}
                    onClick={() => onGoalToggle(goal)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border
                      ${selectedGoals.includes(goal)
                        ? 'bg-white/20 text-white border-white'
                        : 'bg-transparent text-white border-white/40 hover:bg-white/10 hover:border-white/60'
                      }`}
                  >
                    {goal}
                  </button>
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
                nextDisabled={selectedGoals.length < 2}
              />
            </div>
          </StepCard>
        </div>
      </div>
    </div>
  );
};
