import { StepCard } from './StepCard';
import { FormInput } from './FormInput';
import { NavigationButtons } from './NavigationButtons';
import { OnboardingFormData } from '../hooks/useOnboarding';

interface PersonalInfoStepProps {
  formData: OnboardingFormData;
  onInputChange: (field: keyof OnboardingFormData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  isFormValid: boolean;
}

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Energy',
  'Retail',
  'Transportation',
  'Other',
];

export const PersonalInfoStep = ({
  formData,
  onInputChange,
  onNext,
  onBack,
  isFormValid,
}: PersonalInfoStepProps) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter' && isFormValid) {
      e.preventDefault();
      onNext();
    }
  };

  return (
    <div className="w-[900px] mt-8">
      <StepCard>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tell us about yourself</h1>
          <p className="text-white/80">This helps us personalize your experience</p>
        </div>

        <div className="space-y-6">
          <FormInput
            id="name"
            label="Full Name"
            value={formData.name}
            onChange={value => onInputChange('name', value)}
            placeholder="Enter your full name"
            required
            onKeyDown={handleKeyDown}
          />

          <FormInput
            id="company"
            label="Company"
            value={formData.company}
            onChange={value => onInputChange('company', value)}
            placeholder="Enter your company name"
            required
            onKeyDown={handleKeyDown}
          />

          <FormInput
            id="role"
            label="Role/Title"
            value={formData.role}
            onChange={value => onInputChange('role', value)}
            placeholder="e.g. Marketing Manager, CEO, Developer"
            required
            onKeyDown={handleKeyDown}
          />

          <FormInput
            id="industry"
            label="Industry"
            type="select"
            value={formData.industry}
            onChange={value => onInputChange('industry', value)}
            placeholder="Select your industry"
            options={industries}
            required
            onKeyDown={handleKeyDown}
          />
        </div>

        <NavigationButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!isFormValid}
          showBack={false}
        />
      </StepCard>
    </div>
  );
};
