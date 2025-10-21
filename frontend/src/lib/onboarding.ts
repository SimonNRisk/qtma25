import { supabase } from './supabase';

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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return null;
    }

    // First try to get from Supabase
    const { data, error } = await supabase
      .from('onboarding_context')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    if (data && !error) {
      return data;
    }

    // If not found in Supabase, try localStorage as fallback
    try {
      const storedData = localStorage.getItem('onboarding_data');
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        // Convert localStorage format to OnboardingContext format
        return {
          id: 'local-' + Date.now(),
          user_id: session.user.id,
          name: '',
          company: '',
          role: '',
          email: '',
          industry: '',
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

    if (error) {
      console.error('Error fetching onboarding data:', error);
    }

    return null;
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return null;
  }
}

export async function updateOnboardingData(updates: Partial<OnboardingContext>): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    const { error } = await supabase
      .from('onboarding_context')
      .update(updates)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error updating onboarding data:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating onboarding data:', error);
    return false;
  }
}

export async function syncLocalStorageToSupabase(): Promise<boolean> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return false;
    }

    // Get data from localStorage
    const storedData = localStorage.getItem('onboarding_data');
    if (!storedData) {
      return false;
    }

    const parsedData = JSON.parse(storedData);

    // Save to Supabase
    const { error } = await supabase.from('onboarding_context').upsert({
      user_id: session.user.id,
      company_mission: parsedData.companyMission,
      target_audience: parsedData.targetAudience,
      topics_to_post: parsedData.topicsToPost,
      selected_goals: parsedData.selectedGoals,
      selected_hooks: parsedData.selectedHooks,
    });

    if (error) {
      console.error('Error syncing localStorage to Supabase:', error);
      return false;
    }

    // Clear localStorage after successful sync
    localStorage.removeItem('onboarding_data');
    return true;
  } catch (error) {
    console.error('Error syncing localStorage to Supabase:', error);
    return false;
  }
}
