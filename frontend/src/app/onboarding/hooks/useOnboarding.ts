import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface OnboardingFormData {
  name: string;
  company: string;
  role: string;
  email: string;
  industry: string;
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
  });

  // Check if user is returning from LinkedIn authentication
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setLinkedinConnected(true);
      setCurrentStep(3); // Go to LinkedIn step
    }
  }, [searchParams]);

  const handleInputChange = (field: keyof OnboardingFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
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

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name: formData.name,
            company: formData.company,
            role: formData.role,
            email: formData.email,
            industry: formData.industry,
          },
        ])
        .select();

      if (error) {
        console.error('Error saving to Supabase:', error);
        alert('Error saving data. Please try again.');
        return;
      }

      console.log('Data saved to Supabase:', data);
      alert('Onboarding complete! Your data has been saved.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving data. Please try again.');
    }
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
    isFormValid,
  };
};
