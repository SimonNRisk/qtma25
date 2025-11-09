import { FaRocket } from 'react-icons/fa';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export const OnboardingHeader = ({ currentStep, totalSteps }: OnboardingHeaderProps) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full px-12 py-6">
      <div className="flex items-center justify-center gap-6">
        {/* Logo and Name */}
        <div className="flex items-center gap-3">
          <FaRocket className="text-white text-2xl" />
          <span className="text-white font-['Helvetica_Neue'] text-[25px] font-normal">Astro</span>
        </div>

        {/* Progress Bar */}
        <div className="relative w-64 h-2 border border-white/60 rounded-full overflow-hidden">
          {/* Completed portion (light blue) */}
          <div
            className="absolute top-0 left-0 h-full bg-[#9bc6e9] transition-all duration-300 ease-in-out"
            style={{ width: `${progress}%` }}
          />
          {/* Transparent background for incomplete portion is just the parent */}
        </div>
      </div>
    </div>
  );
};
