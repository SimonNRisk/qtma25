import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface OnboardingFormData {
  name: string;
  company: string;
  role: string;
  email: string;
  industry: string;
  companyMission: string;
  targetAudience: string;
  topicsToPost: string;
  selectedGoals: string[];
  selectedHooks: string[];
}

export const useOnboarding = () => {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [isConnectingLinkedIn, setIsConnectingLinkedIn] = useState(false);
  const [linkedinConnected, setLinkedinConnected] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    company: '',
    role: '',
    email: '',
    industry: '',
    companyMission: '',
    targetAudience: '',
    topicsToPost: '',
    selectedGoals: [],
    selectedHooks: [],
  });

  // Check if user is returning from LinkedIn authentication
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLinkedinConnected(true);
      setCurrentStep(3); // Go to LinkedIn step
    }
  }, [searchParams]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('onboarding_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setFormData(prev => ({
          ...prev,
          companyMission: parsedData.companyMission || prev.companyMission,
          targetAudience: parsedData.targetAudience || prev.targetAudience,
          topicsToPost: parsedData.topicsToPost || prev.topicsToPost,
          selectedGoals: parsedData.selectedGoals || prev.selectedGoals,
          selectedHooks: parsedData.selectedHooks || prev.selectedHooks,
        }));
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
  }, []);

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 10) {
      // Save to localStorage when moving to next step (for persistence)
      saveToLocalStorage();
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleLinkedInConnect = async () => {
    setIsConnectingLinkedIn(true);
    try {
      const response = await fetch('http://localhost:8000/api/linkedin/auth');
      const data = await response.json();

      if (response.ok && data.auth_url) {
        window.location.href = data.auth_url;
      } else {
        alert(data.detail || 'Failed to get LinkedIn authorization URL.');
      }
    } catch (err) {
      alert('Network error or backend is not running.');
      console.error(err);
    } finally {
      setIsConnectingLinkedIn(false);
    }
  };

  // Save onboarding data to localStorage
  const saveToLocalStorage = () => {
    try {
      const onboardingData = {
        companyMission: formData.companyMission,
        targetAudience: formData.targetAudience,
        topicsToPost: formData.topicsToPost,
        selectedGoals: formData.selectedGoals,
        selectedHooks: formData.selectedHooks,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
      localStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      // Save to localStorage first
      saveToLocalStorage();

      // Get current user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        console.error('Error getting session:', sessionError);
        alert('Please sign in to complete onboarding.');
        return;
      }

      // Prepare onboarding data for backend
      const onboardingData = {
        name: formData.name,
        company: formData.company,
        role: formData.role,
        email: formData.email,
        industry: formData.industry,
        company_mission: formData.companyMission,
        target_audience: formData.targetAudience,
        topics_to_post: formData.topicsToPost,
        selected_goals: formData.selectedGoals,
        selected_hooks: formData.selectedHooks,
      };

      // Submit to backend endpoint
      const response = await fetch('http://localhost:8000/api/onboarding/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(onboardingData),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Error saving onboarding data:', result);
        alert(result.detail || 'Error saving data. Please try again.');
        return;
      }

      console.log('Onboarding data saved successfully:', result);
      alert('Onboarding complete! Your data has been saved.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const handleSkip = () => {
    // Move to next step when skipping LinkedIn connection
    handleNext();
  };

  const handleGoalToggle = (goal: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGoals: prev.selectedGoals.includes(goal)
        ? prev.selectedGoals.filter(g => g !== goal)
        : [...prev.selectedGoals, goal],
    }));
  };

  const handleHookToggle = (hook: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHooks: prev.selectedHooks.includes(hook)
        ? prev.selectedHooks.filter(h => h !== hook)
        : [...prev.selectedHooks, hook],
    }));
  };

  const handleUnlock = () => {
    // Save to localStorage before redirecting
    saveToLocalStorage();
    // Redirect to signup page
    window.location.href = '/signup';
  };

  const isFormValid = () => {
    return !!(
      formData.name &&
      formData.company &&
      formData.role &&
      formData.email &&
      formData.industry
    );
  };

  return {
    currentStep,
    isConnectingLinkedIn,
    linkedinConnected,
    formData,
    handleInputChange,
    handleNext,
    handleBack,
    handleLinkedInConnect,
    handleSubmit,
    handleSkip,
    handleGoalToggle,
    handleHookToggle,
    handleUnlock,
    isFormValid,
  };
};
