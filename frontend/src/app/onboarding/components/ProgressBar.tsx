interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressBar = ({ currentStep, totalSteps }: ProgressBarProps) => {
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="mb-6 px-12 flex flex-row items-center justify-between  align-stretch">
      <span className="text-black font-['Helvetica_Neue'] text-[25px] not-italic font-normal leading-[100%]">Astro</span>
      <div>{currentStep} of {totalSteps}</div>
    </div>
  );
};
