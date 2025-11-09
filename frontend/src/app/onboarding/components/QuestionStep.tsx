import { StepCard } from './StepCard';
import { NavigationButtons } from './NavigationButtons';

interface QuestionStepProps {
  mainQuestion: string;
  subHeader?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextText?: string;
  backText?: string;
  inputType?: 'text' | 'textarea';
  rows?: number;
}

export const QuestionStep = ({
  mainQuestion,
  subHeader,
  placeholder = '',
  value,
  onChange,
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextText = 'Next',
  backText = 'Back',
  inputType = 'textarea',
  rows = 4,
}: QuestionStepProps) => {
  return (
    <div className="w-[632px] mx-auto">
      <StepCard>
        <div className="space-y-6">
        {/* Main Question */}
        <div className="rounded-lg">
          <p className="text-xl font-semibold text-white">
            {mainQuestion}
          </p>
        </div>

        {/* Sub Header */}
        {subHeader && (
          <p className="text-white/80 text-sm">
            {subHeader}
          </p>
        )}

        {/* Input Field */}
        <div className="space-y-2">
          {inputType === 'textarea' ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30 resize-none"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-white/60 bg-transparent px-4 py-3 text-sm text-white placeholder-white/70 shadow-inner shadow-black/20 outline-none transition focus:border-white focus:ring-2 focus:ring-white/30"
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <NavigationButtons
          onBack={onBack}
          onNext={onNext}
          showBack={showBack}
          showNext={showNext}
          nextDisabled={nextDisabled}
          nextText={nextText}
          backText={backText}
        />
      </div>
    </StepCard>
    </div>
  );
};
