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
          // Personal info
          name: parsedData.name || prev.name,
          company: parsedData.company || prev.company,
          role: parsedData.role || prev.role,
          email: parsedData.email || prev.email,
          industry: parsedData.industry || prev.industry,
          // Company details
          companyMission: parsedData.companyMission || prev.companyMission,
          targetAudience: parsedData.targetAudience || prev.targetAudience,
          topicsToPost: parsedData.topicsToPost || prev.topicsToPost,
          // Preferences
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
      // Include personal info if we're past step 1 (where personal info is collected)
      saveToLocalStorage(currentStep >= 1);
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

  // Save complete onboarding data to localStorage
  const saveToLocalStorage = (includePersonalInfo = false) => {
    try {
      console.log('💾 Saving to localStorage:', {
        includePersonalInfo,
        currentStep,
        formData: {
          name: formData.name,
          company: formData.company,
          role: formData.role,
          email: formData.email,
          industry: formData.industry,
        },
      });

      const onboardingData = {
        // Personal info (only if requested)
        ...(includePersonalInfo && {
          name: formData.name,
          company: formData.company,
          role: formData.role,
          email: formData.email,
          industry: formData.industry,
        }),
        // Company details
        companyMission: formData.companyMission,
        targetAudience: formData.targetAudience,
        topicsToPost: formData.topicsToPost,
        // Preferences
        selectedGoals: formData.selectedGoals,
        selectedHooks: formData.selectedHooks,
        // Metadata
        timestamp: new Date().toISOString(),
      };

      console.log('💾 Data being saved:', onboardingData);
      localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
      localStorage.setItem('onboarding_completed', 'true');
      console.log('✅ Successfully saved to localStorage');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Note: handleSubmit is kept for LinkedIn step compatibility but simplified
  const handleSubmit = async () => {
    // Save to localStorage first
    saveToLocalStorage(true);

    // The actual API submission is handled by syncOnboardingDataAfterSignup()
    // after user signs up, so we don't need to duplicate that logic here
    console.log('Onboarding data saved to localStorage, will sync after signup');
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

  const handleUnlock = async () => {
    // Save complete onboarding data to localStorage (including personal info)
    saveToLocalStorage(true);

    // Redirect to signup page
    window.location.href = '/signup';
  };

  const isFormValid = () => {
    return !!(formData.name && formData.company && formData.role && formData.industry);
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
