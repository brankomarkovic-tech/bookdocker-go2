import { createClient } from '@supabase/supabase-js';
import { Expert } from '../types';
import { supabase } from '../supabaseClient';

export class DuplicateEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

// TODO: The admin client requires a secret key and must be moved to a secure backend function (e.g., Supabase Edge Function).
// For now, this is disabled to allow the frontend to deploy without exposing secrets.
const getAdminClient = () => {
    console.error("Admin client is disabled in the production frontend for security reasons.");
    // Returning the public client to prevent crashes, but admin actions will fail RLS.
    return supabase;
};

const formatSupabaseError = (error: any): string => {
    if (!error) return "An unknown error occurred.";
    return `Database error: ${error.message} (Code: ${error.code})`;
}

export const getExperts = async (signal?: AbortSignal): Promise<Expert[]> => {
  try {
    const query = supabase.from('experts').select('*');
    if (signal) {
        query.abortSignal(signal);
    }
    const { data, error } = await query;

    if (error) throw error;
    // The data from Supabase is already in the correct camelCase format if columns are named correctly.
    // Assuming the data is clean for now.
    return (data || []) as Expert[];
  } catch (error) {
    console.error("Supabase error in getExperts:", error);
    throw new Error(formatSupabaseError(error));
  }
};

export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'isExample' | 'updatedAt'>): Promise<Expert> => {
  try {
    const { data: existing } = await supabase
      .from('experts')
      .select('id')
      .eq('email', expertData.email)
      .single();

    if (existing) {
      throw new DuplicateEmailError('An expert with this email address already exists.');
    }
  } catch (error: any) {
    if (error.code !== 'PGRST116') { // no rows found is OK
      throw new Error(formatSupabaseError(error));
    }
  }

  const dbExpertData = {
      ...expertData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      isExample: false,
  };

  try {
    const { data, error } = await supabase
      .from('experts')
      .insert(dbExpertData)
      .select()
      .single();

    if (error) throw error;
    return data as Expert;
  } catch (error) {
    throw new Error(formatSupabaseError(error));
  }
};

export const updateExpert = async (expertId: string, profileData: Partial<Expert>): Promise<Expert> => {
    // Using admin client for updates is now a backend-only operation.
    // This will likely fail due to RLS policies, which is expected for now.
    const supabaseAdmin = getAdminClient();
    const dbProfileData = {
        ...profileData,
        updatedAt: new Date().toISOString(),
    };

    try {
        const { data, error } = await supabaseAdmin
            .from('experts')
            .update(dbProfileData)
            .eq('id', expertId)
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new Error("Update did not return data.");
        return data as Expert;
    } catch (error) {
        console.error("Supabase error updating expert:", error);
        throw new Error(formatSupabaseError(error));
    }
};

export const deleteMultipleExperts = async (expertIds: string[]): Promise<void> => {
  if (expertIds.length === 0) return;
  // This is an admin action and will fail until moved to a backend function.
  const supabaseAdmin = getAdminClient();
  try {
    const { error } = await supabaseAdmin
      .from('experts')
      .delete()
      .in('id', expertIds);

    if (error) throw error;
  } catch (error) {
    console.error("Supabase error deleting experts:", error);
    throw new Error(formatSupabaseError(error));
  }
};
