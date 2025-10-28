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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
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
              <h2 className="text-2xl font-bold text-black">
                Catchy Header
              </h2>

              {/* Bio Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Bio</label>
                <div className="border-b-2 border-gray-300 pb-2">
                  <p className="text-gray-600">
                    {formData.companyMission || 'Company mission not provided'}
                  </p>
                </div>
              </div>

              {/* Tone Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Tone</label>
                <div className="border-b-2 border-gray-300 pb-2">
                  <p className="text-gray-600">Professional & Engaging</p>
                </div>
              </div>

              {/* Keywords Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {formData.topicsToPost ? (
                    formData.topicsToPost.split(',').map((topic, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-black"
                      >
                        {topic.trim()}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-black">
                        Marketing
                      </span>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-black">
                        Founder
                      </span>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm text-black">
                        Startup
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Separator */}
              <div className="border-t-2 border-dashed border-blue-200 my-4"></div>

              {/* Analytics Section */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Analytics</label>
                <div className="border-b-2 border-gray-300 pb-2">
                  <p className="text-gray-600">Target Audience: {formData.targetAudience || 'Not specified'}</p>
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