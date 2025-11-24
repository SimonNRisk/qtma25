import { getOnboardingData } from '@/lib/onboarding';
import { useState, useEffect } from 'react';

export const useGetIndustry = () => {
  const [rawIndustry, setRawIndustry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchIndustry = async () => {
      const onboardingData = await getOnboardingData();
      setRawIndustry(onboardingData?.industry ?? null);
      setLoading(false);
    };
    fetchIndustry();
  }, []);
  const industry = normalizeIndustry(rawIndustry);

  return { industry, loading };
};

function normalizeIndustry(industry: string | null) {
  if (!industry) {
    return 'other';
  }
  return industry.toLowerCase();
}
