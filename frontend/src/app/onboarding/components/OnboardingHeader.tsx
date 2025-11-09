import { FaRocket } from 'react-icons/fa';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingHeader = ({ currentStep, totalSteps }: OnboardingHeaderProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full border-b border-white/40">
      <div className="px-12 py-6">
        <div className="flex items-center justify-center gap-8">
          {/* Logo and Name */}
          <div className="flex items-center gap-3">
            <FaRocket className="text-white text-2xl" />
            <span className="text-white font-['Helvetica_Neue'] text-[25px] font-normal">
              Astro
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-96 h-3 border-2 border-white/60 rounded-full overflow-hidden bg-transparent">
            {/* Completed portion (darker blue) */}
            <div
              className="absolute top-0 left-0 h-full bg-[#3c698e] transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
