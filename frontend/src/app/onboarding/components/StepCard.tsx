interface StepCardProps {
  children: React.ReactNode
}

export const StepCard = ({ children }: StepCardProps) => {
  return <div className="bg-white rounded-lg shadow-lg p-8">{children}</div>
}
