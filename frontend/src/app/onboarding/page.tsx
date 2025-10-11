'use client';
import { useOnboarding } from './hooks/useOnboarding';
import { ProgressBar } from './components/ProgressBar';
import { WelcomeStep } from './components/WelcomeStep';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { LinkedInStep } from './components/LinkedInStep';

export default function Onboarding() {
  const {
    currentStep,
    isConnectingLinkedIn,
    linkedinConnected,
    formData,
    handleInputChange,
    handleNext,
    handleBack,
    handleLinkedInConnect,
    handleSubmit,
    isFormValid,
  } = useOnboarding();

  return (
    <main className="min-h-screen bg-brand-light">
      <div className="max-w-2xl mx-auto px-8 py-12">
        <ProgressBar currentStep={currentStep} totalSteps={3} />

        {currentStep === 1 && <WelcomeStep onNext={handleNext} />}

        {currentStep === 2 && (
          <PersonalInfoStep
            formData={formData}
            onInputChange={handleInputChange}
            onNext={handleNext}
            onBack={handleBack}
            isFormValid={isFormValid()}
          />
        )}

        {currentStep === 3 && (
          <LinkedInStep
            linkedinConnected={linkedinConnected}
            isConnectingLinkedIn={isConnectingLinkedIn}
            onLinkedInConnect={handleLinkedInConnect}
            onBack={handleBack}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </main>
  );
}
