interface NavigationButtonsProps {
  onBack: () => void;
  onNext: () => void;
  showBack?: boolean;
  showNext?: boolean;
  nextDisabled?: boolean;
  nextText?: string;
  backText?: string;
}

export const NavigationButtons = ({
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextText = 'Next',
  backText = 'Back',
}: NavigationButtonsProps) => {
  return (
    <div className="flex justify-between mt-8">
      {showBack && (
        <button
          onClick={onBack}
          className="px-6 py-3 border border-white/60 text-white rounded-xl font-medium hover:bg-white/10 transition-colors"
        >
          {backText}
        </button>
      )}

      {showNext && (
        <div className="relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent blur-xl opacity-30 pointer-events-none" />
          <button
            onClick={onNext}
            disabled={nextDisabled}
            className="relative px-8 py-3 rounded-2xl text-base font-semibold tracking-wide text-white transition hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-50 border border-[var(--login-button-border)] bg-gradient-to-br from-[var(--login-button-start)] via-[var(--login-button-mid)] to-[var(--login-button-end)] login-button"
          >
            {nextText}
          </button>
        </div>
      )}
    </div>
  );
};
