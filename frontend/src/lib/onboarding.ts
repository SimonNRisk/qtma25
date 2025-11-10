import { session } from './session';
import { API_URL } from './api';

export interface OnboardingContext {
  id: string;
  user_id: string;
  name: string;
  company: string;
  role: string;
  email: string;
  industry: string;
  company_mission: string;
  target_audience: string;
  topics_to_post: string;
  selected_goals: string[];
  selected_hooks: string[];
  created_at: string;
  updated_at: string;
}

export async function getOnboardingData(): Promise<OnboardingContext | null> {
  try {
    if (!session.isAuthenticated()) {
      return null;
    }

    const user = session.getUser();
    if (!user) {
      return null;
    }

    const accessToken = session.access();
    if (!accessToken) {
      return null;
    }

    // Try to get from backend API first
    try {
      const response = await fetch(`${API_URL}/api/onboarding/data`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          return result.data;
        }
      }
    } catch (error) {
      console.warn('Error fetching from backend:', error);
    }

    // If not found in backend, try localStorage as fallback
    try {
      const storedData = localStorage.getItem('onboarding_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert localStorage format to OnboardingContext format
        return {
          id: 'local-' + Date.now(),
          user_id: user.id,
          name: parsedData.name || '',
          company: parsedData.company || '',
          role: parsedData.role || '',
          email: user.email || '', // Use email from user account
          industry: parsedData.industry || '',
          company_mission: parsedData.companyMission || '',
          target_audience: parsedData.targetAudience || '',
          topics_to_post: parsedData.topicsToPost || '',
          selected_goals: parsedData.selectedGoals || [],
          selected_hooks: parsedData.selectedHooks || [],
          created_at: parsedData.timestamp || new Date().toISOString(),
          updated_at: parsedData.timestamp || new Date().toISOString(),
        };
      }
    } catch (localStorageError) {
      console.warn('Error reading from localStorage:', localStorageError);
    }

    return null;
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return null;
  }
}

export async function updateOnboardingData(updates: Partial<OnboardingContext>): Promise<boolean> {
  try {
    if (!session.isAuthenticated()) {
      return false;
    }

    const user = session.getUser();
    if (!user) {
      return false;
    }

    const accessToken = session.access();
    if (!accessToken) {
      return false;
    }

    // Use backend API for updates
    const response = await fetch(`${API_URL}/api/onboarding/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error updating onboarding data:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating onboarding data:', error);
    return false;
  }
}

// Simple function to sync localStorage data to Supabase after signup
export async function syncOnboardingDataAfterSignup(): Promise<boolean> {
  try {
    if (!session.isAuthenticated()) {
      return false;
    }

    return await syncLocalStorageToSupabase();
  } catch (error) {
    console.error('Error syncing onboarding data after signup:', error);
    return false;
  }
}

export async function syncLocalStorageToSupabase(completeFormData?: {
  name?: string;
  company?: string;
  role?: string;
  email?: string;
  industry?: string;
  companyMission?: string;
  targetAudience?: string;
  topicsToPost?: string;
  selectedGoals?: string[];
  selectedHooks?: string[];
}): Promise<boolean> {
  try {
    // Use custom session management instead of Supabase auth
    if (!session.isAuthenticated()) {
      return false;
    }

    const user = session.getUser();
    if (!user) {
      return false;
    }

    // Get the access token for backend API authentication
    const accessToken = session.access();
    if (!accessToken) {
      return false;
    }

    // Prepare data for backend API
    let onboardingData;

    if (completeFormData) {
      onboardingData = {
        name: completeFormData.name || '',
        company: completeFormData.company || '',
        role: completeFormData.role || '',
        email: '', // Email will be populated from user account
        industry: completeFormData.industry || '',
        company_mission: completeFormData.companyMission || '',
        target_audience: completeFormData.targetAudience || '',
        topics_to_post: completeFormData.topicsToPost || '',
        selected_goals: completeFormData.selectedGoals || [],
        selected_hooks: completeFormData.selectedHooks || [],
      };
    } else {
      // Fallback: Get data from localStorage
      const storedData = localStorage.getItem('onboarding_data');
      if (!storedData) {
        return false;
      }

      const parsedData = JSON.parse(storedData);

      onboardingData = {
        name: parsedData.name || '',
        company: parsedData.company || '',
        role: parsedData.role || '',
        email: '', // Email will be populated from user account
        industry: parsedData.industry || '',
        company_mission: parsedData.companyMission || '',
        target_audience: parsedData.targetAudience || '',
        topics_to_post: parsedData.topicsToPost || '',
        selected_goals: parsedData.selectedGoals || [],
        selected_hooks: parsedData.selectedHooks || [],
      };
    }

    // Use backend API instead of direct Supabase
    const response = await fetch(`${API_URL}/api/onboarding/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(onboardingData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error syncing to backend:', errorData);
      return false;
    }

    await response.json();

    // Clear localStorage after successful sync
    localStorage.removeItem('onboarding_data');
    localStorage.removeItem('onboarding_completed');
    return true;
  } catch (error) {
    console.error('Error syncing to backend:', error);
    return false;
  }
}
