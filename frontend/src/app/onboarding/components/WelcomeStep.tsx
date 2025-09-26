import { StepCard } from './StepCard'
import { NavigationButtons } from './NavigationButtons'

interface WelcomeStepProps {
  onNext: () => void
}

export const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <StepCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Welcome!</h1>
        <p className="text-gray-600">Let's get you set up with your LinkedIn content platform</p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Your Account</h2>
          <p className="text-gray-600 mb-6">Sign up to start creating amazing LinkedIn content</p>

          <button
            onClick={onNext}
            className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-lg w-full"
          >
            Continue (Skip for now)
          </button>
        </div>
      </div>
    </StepCard>
  )
}
