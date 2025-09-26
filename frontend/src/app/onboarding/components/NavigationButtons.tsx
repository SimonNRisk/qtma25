interface NavigationButtonsProps {
  onBack: () => void
  onNext: () => void
  showBack?: boolean
  showNext?: boolean
  nextDisabled?: boolean
  nextText?: string
  backText?: string
}

export const NavigationButtons = ({
  onBack,
  onNext,
  showBack = true,
  showNext = true,
  nextDisabled = false,
  nextText = 'Next',
  backText = 'Back'
}: NavigationButtonsProps) => {
  return (
    <div className="flex justify-between mt-8">
      {showBack && (
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          {backText}
        </button>
      )}

      {showNext && (
        <button
          onClick={onNext}
          disabled={nextDisabled}
          className="bg-brand-blue text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {nextText}
        </button>
      )}
    </div>
  )
}
