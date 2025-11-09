interface WelcomeSectionProps {
  title: string;
  subtitle: string;
}

export const WelcomeSection = ({ title, subtitle }: WelcomeSectionProps) => {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-white">{title}</h1>
      <p className="text-lg text-white/80">{subtitle}</p>
    </div>
  );
};
