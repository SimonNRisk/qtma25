interface StepCardProps {
  children: React.ReactNode;
}

export const StepCard = ({ children }: StepCardProps) => {
  return (
    <div className="rounded-[32px] border border-white/60 px-10 py-8 text-white shadow-[0_30px_60px_rgba(0,0,0,0.55)] bg-gradient-to-b from-[var(--login-card-start)] via-[var(--login-card-mid)] to-[var(--login-card-end)]">
      {children}
    </div>
  );
};
