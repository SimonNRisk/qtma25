'use client';
import { useOnboarding } from './hooks/useOnboarding';
import { OnboardingHeader } from './components/OnboardingHeader';
import { PersonalInfoStep } from './components/PersonalInfoStep';
import { QuestionStep } from './components/QuestionStep';
import { ProfileSummaryStep } from './components/ProfileSummaryStep';
import { GoalsSelectionStep } from './components/GoalsSelectionStep';
import { HooksSelectionStep } from './components/HooksSelectionStep';
import { FinalStep } from './components/FinalStep';
import Link from 'next/link';

export default function Onboarding() {
  const {
    currentStep,
    formData,
    generatedPostText,
    isGeneratingPost,
    handleInputChange,
    handleNext,
    handleBack,
    handleGoalToggle,
    handleHookToggle,
    handleUnlock,
    handleGeneratePostAndNext,
    isFormValid,
  } = useOnboarding();

  return (
    <main className="min-h-screen bg-gradient-to-br from-[var(--login-bg-start)] via-[var(--login-bg-mid)] to-[var(--login-bg-end)]">
      {/* Login link at bottom middle */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-0">
        <Link
          href="/login"
          className="text-sm text-white/80 hover:text-white transition-colors duration-200 underline"
        >
          Already a user? Login in
        </Link>
      </div>

      <OnboardingHeader currentStep={currentStep} totalSteps={8} />

      {/* Loading screen between step 7 and 8 while generating post */}
      {isGeneratingPost ? (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          {/* Steps */}
          {currentStep === 5 ? (
            <ProfileSummaryStep
              formData={{
                name: formData.name,
                company: formData.company,
                role: formData.role,
                companyMission: formData.companyMission,
                targetAudience: formData.targetAudience,
                topicsToPost: formData.topicsToPost,
              }}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : currentStep === 6 ? (
            <GoalsSelectionStep
              selectedGoals={formData.selectedGoals}
              onGoalToggle={handleGoalToggle}
              onBack={handleBack}
              onNext={handleNext}
            />
          ) : currentStep === 7 ? (
            !isGeneratingPost ? (
              <HooksSelectionStep
                selectedHooks={formData.selectedHooks}
                onHookToggle={handleHookToggle}
                onBack={handleBack}
                onNext={handleGeneratePostAndNext}
              />
            ) : null
          ) : currentStep === 8 && !isGeneratingPost && generatedPostText ? (
            <FinalStep
              formData={{
                companyMission: formData.companyMission,
                targetAudience: formData.targetAudience,
                topicsToPost: formData.topicsToPost,
                selectedGoals: formData.selectedGoals,
                selectedHooks: formData.selectedHooks,
              }}
              generatedPostText={generatedPostText}
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

              {currentStep === 3 && (
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

              {currentStep === 4 && (
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
        </>
      )}
    </main>
  );
}
