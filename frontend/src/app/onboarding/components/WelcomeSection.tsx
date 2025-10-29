interface WelcomeSectionProps {
  title: string;
  subtitle: string;
}

export const WelcomeSection = ({ title, subtitle }: WelcomeSectionProps) => {
  return (
    <div className="space-y-4">
      <h1 className="text-4xl font-bold text-black">
        {title}
      </h1>
      <p className="text-lg text-gray-600">
        {subtitle}
      </p>
    </div>
  );
};
