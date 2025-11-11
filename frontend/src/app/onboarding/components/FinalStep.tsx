import { StepCard } from './StepCard';
import { FaLock } from 'react-icons/fa';

interface FinalStepProps {
  userName: string;
  userRole: string;
  userCompany: string;
  generatedPostText: string | null;
  onUnlock: () => void;
  onBack: () => void;
}

export const FinalStep = ({
  generatedPostText,
  userName,
  userRole,
  userCompany,
  onUnlock,
}: FinalStepProps) => {
  const handleUnlock = () => {
    // Call the unlock handler (localStorage saving is now handled in the hook)
    onUnlock();
  };

  return (
    <div className="flex min-h-screen p-8">
      {/* Left Section - Post Idea Intro */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-white leading-tight">
            Here&apos;s a post idea based on your style
          </h1>
        </div>
      </div>

      {/* Right Section - Post Card with Overlay */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-[900px] mx-auto relative">
          <StepCard>
            <div className="space-y-4 p-6">
              {/* Post Content - Visible in background */}
              <div className="text-white">
                <p className="whitespace-pre-wrap">
                  {userName} {userRole} {userCompany} {generatedPostText}
                </p>
              </div>
            </div>

            {/* Unlock Overlay - lighter background so post is visible */}
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center p-6 rounded-lg">
              <div className="text-white text-opacity-80 mb-4">
                <FaLock className="h-12 w-12 mx-auto" />
              </div>
              <h2 className="text-white text-3xl font-bold text-center mb-6">
                Sign up to unlock this post&apos;s full potential
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
              <div className="mt-6 text-white text-opacity-50 text-sm text-center"></div>
            </div>
          </StepCard>
        </div>
      </div>
    </div>
  );
};
