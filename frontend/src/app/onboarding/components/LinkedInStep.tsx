import { StepCard } from './StepCard';
import { NavigationButtons } from './NavigationButtons';

interface LinkedInStepProps {
  linkedinConnected: boolean;
  isConnectingLinkedIn: boolean;
  onLinkedInConnect: () => void;
  onBack: () => void;
  onSubmit: () => void;
  onSkip?: () => void;
}

export const LinkedInStep = ({
  linkedinConnected,
  isConnectingLinkedIn,
  onLinkedInConnect,
  onBack,
  onSubmit,
  onSkip,
}: LinkedInStepProps) => {
  return (
    <StepCard>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">First Things First</h1>
        <p className="text-gray-600">
          Connect your LinkedIn to unlock posting, scheduling, and personalization.
        </p>
      </div>

      <div className="space-y-6">
        <div className="text-center">
          {linkedinConnected ? (
            <>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                LinkedIn Connected Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your LinkedIn account is now connected and ready to use.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.064-2.064 2.064zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Connect Your LinkedIn Account
              </h2>
              <p className="text-gray-600 mb-6">
                Authorize our app to post content on your behalf. We'll only post what you create.
              </p>

              <div className="space-y-3">
                <button
                  onClick={onLinkedInConnect}
                  disabled={isConnectingLinkedIn}
                  className="bg-brand-blue text-white px-8 py-4 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg w-full"
                >
                  {isConnectingLinkedIn ? 'Connecting...' : 'Connect with LinkedIn'}
                </button>

                {onSkip && (
                  <button
                    onClick={onSkip}
                    className="text-gray-500 hover:text-gray-700 font-medium text-sm underline transition-colors"
                  >
                    Skip for now
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-500 mt-4">
                You can skip this step and connect later if needed.
              </p>
            </>
          )}
        </div>
      </div>

      <NavigationButtons
        onBack={onBack}
        onNext={onSubmit}
        nextText="Complete Setup"
        showBack={false}
      />
    </StepCard>
  );
};
