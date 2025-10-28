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
          <p className="text-xl font-semibold text-gray-900">
            {mainQuestion}
          </p>
        </div>

        {/* Sub Header */}
        {subHeader && (
          <p className="text-gray-600 text-sm">
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
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 border-2 border-gray-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
