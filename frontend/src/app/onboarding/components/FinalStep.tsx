import { StepCard } from './StepCard';

interface FinalStepProps {
  formData: {
    companyMission: string;
    targetAudience: string;
    topicsToPost: string;
    selectedGoals: string[];
    selectedHooks: string[];
  };
  onUnlock: () => void;
  onBack: () => void;
}

export const FinalStep = ({ formData, onUnlock, onBack }: FinalStepProps) => {
  const handleUnlock = () => {
    // Call the unlock handler (localStorage saving is now handled in the hook)
    onUnlock();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Section - Post Idea Intro */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Here's a post idea based on your style
          </h1>
        </div>
      </div>

      {/* Right Section - Post Card with Overlay */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-[632px] mx-auto relative">
          <StepCard>
            <div className="space-y-4 p-6">
              {/* Post Header */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">First Name Last Name</p>
                  <p className="text-sm text-gray-600">Industry Company Name</p>
                </div>
              </div>

              {/* Post Content */}
              <div className="space-y-3">
                <p className="text-gray-800">
                  When I first started building [Company Name], I thought customer growth was
                  measured by volume. Send more cold emails. Run more ads. Post more often. But
                  after months of hustle, I had...3 paying customers. It wasn't until a mentor asked
                  me one question that everything clicked: "Have you actually tried talking to the
                  people you're trying to serve?" That hit me hard. I realized I'd been pitching
                  features, not listening to problems. So I changed my approach completely. I
                  reached out to 20
                </p>
                <p className="text-gray-500 text-sm">
                  Instead I asked:
                  <br />
                  • What is your biggest headache area?
                  <br />• How are you solving it today?
                </p>
              </div>

              {/* Tags */}
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-gray-500">Tags:</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  Personal Story
                </span>
              </div>
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center p-6 rounded-lg">
              <div className="text-white text-opacity-80 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-white text-3xl font-bold text-center mb-6">
                Sign up to unlock this post's full potential
              </h2>
              <div className="relative w-full max-w-xs">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
                <button
                  onClick={handleUnlock}
                  className="relative w-full px-8 py-4 rounded-2xl text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button text-lg"
                >
                  Unlock
                </button>
              </div>
              <div className="mt-6 text-white text-opacity-50 text-sm text-center">
                How do you feel about this post?
                <div className="flex justify-center space-x-4 mt-2">
                  <button className="opacity-50 cursor-not-allowed px-3 py-1 rounded border border-white border-opacity-30">
                    I like it
                  </button>
                  <button className="opacity-50 cursor-not-allowed px-3 py-1 rounded border border-white border-opacity-30">
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </StepCard>
        </div>
      </div>
    </div>
  );
};
