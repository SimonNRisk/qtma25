import { useState } from 'react';
import { API_URL } from '@/lib/api';

interface OnboardingData {
  name: string;
  company: string;
  role: string;
  companyMission: string;
  targetAudience: string;
  topicsToPost: string;
  selectedGoals: string[];
  selectedHooks: string[];
}

function getOnboardingData(): OnboardingData | null {
  const onboardingData = localStorage.getItem('onboarding_data');
  if (!onboardingData) {
    return null;
  }
  try {
    const parsed = JSON.parse(onboardingData);
    return {
      name: parsed.name || '',
      company: parsed.company || '',
      role: parsed.role || '',
      companyMission: parsed.companyMission || '',
      targetAudience: parsed.targetAudience || '',
      topicsToPost: parsed.topicsToPost || '',
      selectedGoals: parsed.selectedGoals || [],
      selectedHooks: parsed.selectedHooks || [],
    };
  } catch (error) {
    console.error('Error parsing onboarding data:', error);
    return null;
  }
}

export const useGenerateFirstPost = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postText, setPostText] = useState<string | null>(null);

  const generateFirstPost = async (): Promise<string | null> => {
    // Get onboarding data
    const onboardingData = getOnboardingData();
    if (!onboardingData) {
      setError('No onboarding data found');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/anthropic/first-post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: onboardingData.name,
          role: onboardingData.role,
          company: onboardingData.company,
          core_mission: onboardingData.companyMission,
          target_audience: onboardingData.targetAudience,
          specific_topics: onboardingData.topicsToPost,
          selected_goals: onboardingData.selectedGoals,
          selected_hooks: onboardingData.selectedHooks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setPostText(data.post_text);
      console.log(data.post_text);
      return data.post_text;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate post';
      setError(errorMessage);
      console.error('Error generating first post:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateFirstPost,
    isLoading,
    error,
    postText,
  };
};
