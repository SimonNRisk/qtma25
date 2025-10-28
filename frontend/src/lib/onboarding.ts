import { session } from './session';

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
      const response = await fetch('http://localhost:8000/api/onboarding/data', {
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
          email: parsedData.email || '',
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
    const response = await fetch('http://localhost:8000/api/onboarding/submit', {
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
    console.log('🔄 Syncing onboarding data after signup...');

    if (!session.isAuthenticated()) {
      console.log('❌ User not authenticated');
      return false;
    }

    const user = session.getUser();
    const accessToken = session.access();
    console.log('🔍 User:', user);
    console.log('🔍 Token exists:', !!accessToken);
    console.log('🔍 Token expired:', session.isTokenExpired());

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
      console.log('No authenticated session found');
      return false;
    }

    const user = session.getUser();
    if (!user) {
      console.log('Could not get user info from token');
      return false;
    }

    console.log('User is authenticated:', user.email);

    // Get the access token for backend API authentication
    const accessToken = session.access();
    if (!accessToken) {
      console.error('No access token found');
      return false;
    }

    // Prepare data for backend API
    let onboardingData;

    if (completeFormData) {
      console.log('Using complete form data...');
      onboardingData = {
        name: completeFormData.name || '',
        company: completeFormData.company || '',
        role: completeFormData.role || '',
        email: completeFormData.email || '',
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
        console.log('No onboarding data found in localStorage');
        return false;
      }

      const parsedData = JSON.parse(storedData);
      console.log('Found localStorage data:', parsedData);

      onboardingData = {
        name: parsedData.name || '',
        company: parsedData.company || '',
        role: parsedData.role || '',
        email: parsedData.email || '',
        industry: parsedData.industry || '',
        company_mission: parsedData.companyMission || '',
        target_audience: parsedData.targetAudience || '',
        topics_to_post: parsedData.topicsToPost || '',
        selected_goals: parsedData.selectedGoals || [],
        selected_hooks: parsedData.selectedHooks || [],
      };
    }

    console.log('Data to be sent to backend:', onboardingData);

    // Use backend API instead of direct Supabase
    const response = await fetch('http://localhost:8000/api/onboarding/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(onboardingData),
    });

    if (!response.ok) {
      console.error('Backend response status:', response.status);
      console.error('Backend response headers:', Object.fromEntries(response.headers.entries()));

      let errorData;
      try {
        errorData = await response.json();
        console.error('Error syncing to backend:', errorData);
      } catch (parseError) {
        console.error('Failed to parse error response as JSON:', parseError);
        const textResponse = await response.text();
        console.error('Raw error response:', textResponse);
      }
      return false;
    }

    const result = await response.json();
    console.log('Successfully saved via backend:', result);

    // Clear localStorage after successful sync
    localStorage.removeItem('onboarding_data');
    localStorage.removeItem('onboarding_completed');
    return true;
  } catch (error) {
    console.error('Error syncing to backend:', error);
    return false;
  }
}
