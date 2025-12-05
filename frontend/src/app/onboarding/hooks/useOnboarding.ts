import { useState, useEffect } from 'react';
import { session } from '@/lib/session';
import { syncLocalStorageToSupabase } from '@/lib/onboarding';

export interface OnboardingFormData {
  name: string;
  company: string;
  role: string;
  industry: string;
  companyMission: string;
  targetAudience: string;
  topicsToPost: string;
  selectedGoals: string[];
  selectedHooks: string[];
}

export const useOnboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedPostText, setGeneratedPostText] = useState<string | null>(null);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [formData, setFormData] = useState<OnboardingFormData>({
    name: '',
    company: '',
    role: '',
    industry: '',
    companyMission: '',
    targetAudience: '',
    topicsToPost: '',
    selectedGoals: [],
    selectedHooks: [],
  });

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
    if (currentStep < 9) {
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

  // Save complete onboarding data to localStorage
  const saveToLocalStorage = (includePersonalInfo = false) => {
    try {
      const onboardingData = {
        // Personal info (only if requested)
        ...(includePersonalInfo && {
          name: formData.name,
          company: formData.company,
          role: formData.role,
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

      localStorage.setItem('onboarding_data', JSON.stringify(onboardingData));
      localStorage.setItem('onboarding_completed', 'true');
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
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

    // Check if user is already authenticated (e.g., from OAuth)
    try {
      const isAuth = await session.isAuthenticated();
      if (isAuth) {
        // User is already authenticated - sync onboarding data immediately
        console.log('User already authenticated, syncing onboarding data...');
        const synced = await syncLocalStorageToSupabase({
          name: formData.name,
          company: formData.company,
          role: formData.role,
          industry: formData.industry,
          companyMission: formData.companyMission,
          targetAudience: formData.targetAudience,
          topicsToPost: formData.topicsToPost,
          selectedGoals: formData.selectedGoals,
          selectedHooks: formData.selectedHooks,
        });

        if (synced) {
          console.log('Onboarding data synced successfully');
        } else {
          console.warn('Failed to sync onboarding data, but continuing...');
        }

        // Redirect to profile page since user is already authenticated
        window.location.href = '/me';
        return;
      }
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      // Continue to signup flow if check fails
    }

    // User is not authenticated - redirect to signup page
    window.location.href = '/signup';
  };

  const handleGeneratePostAndNext = async (generatePostFn: () => Promise<string | null>) => {
    setIsGeneratingPost(true);
    try {
      const postText = await generatePostFn();
      if (postText) {
        setGeneratedPostText(postText);
        setIsGeneratingPost(false);
        handleNext();
      } else {
        setIsGeneratingPost(false);
        console.error('Failed to generate post');
      }
    } catch (err) {
      setIsGeneratingPost(false);
      console.error('Failed to generate post:', err);
    }
  };

  const isFormValid = () => {
    return !!(formData.name && formData.company && formData.role && formData.industry);
  };

  return {
    currentStep,
    formData,
    generatedPostText,
    isGeneratingPost,
    handleInputChange,
    handleNext,
    handleBack,
    handleGoalToggle,
    handleHookToggle,
    handleUnlock,
    handleGeneratePostAndNext,
    isFormValid,
  };
};
