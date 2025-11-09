import { useState, useEffect } from 'react';
import { StepCard } from './StepCard';
import { NavigationButtons } from './NavigationButtons';
import { WelcomeSection } from './WelcomeSection';

interface ProfileSummaryStepProps {
  formData: {
    companyMission: string;
    targetAudience: string;
    topicsToPost: string;
  };
  onBack: () => void;
  onNext: () => void;
}

export const ProfileSummaryStep = ({ formData, onBack, onNext }: ProfileSummaryStepProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 3 second loader
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Section - Welcome */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-md">
          <WelcomeSection 
            title="Nice to meet you!"
            subtitle="Here's what we learned."
          />
        </div>
      </div>

      {/* Right Section - Profile Summary */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-[632px]">
          <StepCard>
            <div className="space-y-6">
              {/* Header */}
              <h2 className="text-2xl font-bold text-white">
                Catchy Header
              </h2>

              {/* Bio Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Bio</label>
                <div className="border-b-2 border-white/30 pb-2">
                  <p className="text-white/90">
                    {formData.companyMission || 'Company mission not provided'}
                  </p>
                </div>
              </div>

              {/* Tone Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Tone</label>
                <div className="border-b-2 border-white/30 pb-2">
                  <p className="text-white/90">Professional & Engaging</p>
                </div>
              </div>

              {/* Keywords Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {formData.topicsToPost ? (
                    formData.topicsToPost.split(',').map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-sm text-white"
                      >
                        {topic.trim()}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-sm text-white">
                        Marketing
                      </span>
                      <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-sm text-white">
                        Founder
                      </span>
                      <span className="px-3 py-1 bg-white/20 border border-white/40 rounded-full text-sm text-white">
                        Startup
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t-2 border-dashed border-white/30 my-4"></div>

              {/* Analytics Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Analytics</label>
                <div className="border-b-2 border-white/30 pb-2">
                  <p className="text-white/90">Target Audience: {formData.targetAudience || 'Not specified'}</p>
                </div>
              </div>

              {/* Navigation */}
              <NavigationButtons
                onBack={onBack}
                onNext={onNext}
                showBack={true}
                showNext={true}
                nextText="Next →"
                backText="← Back"
              />
            </div>
          </StepCard>
        </div>
      </div>
    </div>
  );
};