import Image from 'next/image';

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
            <Image src="/astro-white.png" alt="Astro" width={100} height={48} />
          </div>

          {/* Progress Bar */}
          <div className="relative w-96 h-3 border-2 border-white/60 rounded-full overflow-hidden bg-transparent">
            {/* Completed portion (darker blue) */}
            <div
              className="absolute top-0 left-0 h-full bg-astro-lazuli transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
