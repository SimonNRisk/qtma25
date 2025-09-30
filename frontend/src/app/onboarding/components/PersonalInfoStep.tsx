import { StepCard } from './StepCard'
import { FormInput } from './FormInput'
import { NavigationButtons } from './NavigationButtons'
import { OnboardingFormData } from '../hooks/useOnboarding'

interface PersonalInfoStepProps {
  formData: OnboardingFormData
  onInputChange: (field: keyof OnboardingFormData, value: string) => void
  onNext: () => void
  onBack: () => void
  isFormValid: boolean
}

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Marketing',
  'Consulting',
  'Real Estate',
  'Manufacturing',
  'Retail',
  'Other'
]

export const PersonalInfoStep = ({ formData, onInputChange, onNext, onBack, isFormValid }: PersonalInfoStepProps) => {
  return (
    <StepCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Tell us about yourself</h1>
        <p className="text-gray-600">This helps us personalize your experience</p>
      </div>

      <div className="space-y-6">
        <FormInput
          id="name"
          label="Full Name"
          value={formData.name}
          onChange={(value) => onInputChange('name', value)}
          placeholder="Enter your full name"
          required
        />

        <FormInput
          id="company"
          label="Company"
          value={formData.company}
          onChange={(value) => onInputChange('company', value)}
          placeholder="Enter your company name"
          required
        />

        <FormInput
          id="role"
          label="Role/Title"
          value={formData.role}
          onChange={(value) => onInputChange('role', value)}
          placeholder="e.g. Marketing Manager, CEO, Developer"
          required
        />

        <FormInput
          id="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={(value) => onInputChange('email', value)}
          placeholder="Enter your email address"
          required
        />

        <FormInput
          id="industry"
          label="Industry"
          type="select"
          value={formData.industry}
          onChange={(value) => onInputChange('industry', value)}
          placeholder="Select your industry"
          options={industries}
          required
        />
      </div>

      <NavigationButtons onBack={onBack} onNext={onNext} nextDisabled={!isFormValid} />
    </StepCard>
  )
}
