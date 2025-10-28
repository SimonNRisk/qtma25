'use client';
import { useOnboarding } from './hooks/useOnboarding';
import { ProgressBar } from './components/ProgressBar';
import { WelcomeStep } from './components/WelcomeStep';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { LinkedInStep } from './components/LinkedInStep';
import { QuestionStep } from './components/QuestionStep';
import { ProfileSummaryStep } from './components/ProfileSummaryStep';
import { GoalsSelectionStep } from './components/GoalsSelectionStep';
import { HooksSelectionStep } from './components/HooksSelectionStep';
import { FinalStep } from './components/FinalStep';
import { WelcomeSection } from './components/WelcomeSection';

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
    handleSkip,
    handleGoalToggle,
    handleHookToggle,
    handleUnlock,
    isFormValid,
  } = useOnboarding();

  return (
    <main className="min-h-screen bg-white">
      <ProgressBar currentStep={currentStep} totalSteps={8} />

      {/* Steps */}
      {currentStep === 6 ? (
        <ProfileSummaryStep
          formData={{
            companyMission: formData.companyMission,
            targetAudience: formData.targetAudience,
            topicsToPost: formData.topicsToPost,
          }}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : currentStep === 7 ? (
        <GoalsSelectionStep
          selectedGoals={formData.selectedGoals}
          onGoalToggle={handleGoalToggle}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : currentStep === 8 ? (
        <HooksSelectionStep
          selectedHooks={formData.selectedHooks}
          onHookToggle={handleHookToggle}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : currentStep === 9 ? (
        <FinalStep
          formData={{
            companyMission: formData.companyMission,
            targetAudience: formData.targetAudience,
            topicsToPost: formData.topicsToPost,
            selectedGoals: formData.selectedGoals,
            selectedHooks: formData.selectedHooks,
          }}
          onUnlock={handleUnlock}
          onBack={handleBack}
        />
      ) : (
        <div className="flex justify-center items-center min-h-screen">
          {currentStep === 1 && (
            <PersonalInfoStep
              formData={formData}
              onInputChange={handleInputChange}
              onNext={handleNext}
              onBack={handleBack}
              isFormValid={isFormValid()}
            />
          )}

          {currentStep === 2 && (
            <LinkedInStep
              linkedinConnected={linkedinConnected}
              isConnectingLinkedIn={isConnectingLinkedIn}
              onLinkedInConnect={handleLinkedInConnect}
              onBack={handleBack}
              onSubmit={handleSubmit}
              onSkip={handleSkip}
            />
          )}

          {currentStep === 3 && (
            <QuestionStep
              mainQuestion="What is the core mission of your company, in one or two sentences?"
              placeholder="Enter your company's mission statement..."
              value={formData.companyMission || ''}
              onChange={value => handleInputChange('companyMission', value)}
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={!formData.companyMission?.trim()}
            />
          )}

          {currentStep === 4 && (
            <QuestionStep
              mainQuestion="Who is your primary target audience?"
              placeholder="e.g. customers, investors, partners, talent"
              value={formData.targetAudience || ''}
              onChange={value => handleInputChange('targetAudience', value)}
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={!formData.targetAudience?.trim()}
            />
          )}

          {currentStep === 5 && (
            <QuestionStep
              mainQuestion="Are there any specific topics you'd love to post about, even just rough thoughts?"
              placeholder="e.g. AI, marketing, leadership, culture, etc."
              value={formData.topicsToPost || ''}
              onChange={value => handleInputChange('topicsToPost', value)}
              onBack={handleBack}
              onNext={handleNext}
              nextDisabled={!formData.topicsToPost?.trim()}
            />
          )}
        </div>
      )}
    </main>
  );
}
