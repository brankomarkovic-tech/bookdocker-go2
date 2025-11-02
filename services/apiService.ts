import { createClient } from '@supabase/supabase-js';
import { Expert, Book, Spotlight, SocialLinks, BookQuery, PresentOffer } from '../types';
import { supabase } from '../supabaseClient';

export class DuplicateEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEmailError';
  }
}

// TODO: The admin client requires a secret key and must be moved to a secure backend function.
const getAdminClient = () => {
    console.error("Admin client is disabled in the production frontend for security reasons.");
    return supabase;
};

const formatSupabaseError = (error: any): string => {
    if (!error) return "An unknown error occurred.";
    let message = `Database error: ${error.message}`;
    if(error.code) message += ` (Code: ${error.code})`;
    if(error.details) message += ` Details: ${error.details}`;
    return message;
}

// --- DATA TRANSLATION LAYER ---

const toSnakeCase = (str: string) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
const toCamelCase = (str: string) => str.replace(/_([a-z])/g, g => g[1].toUpperCase());

const deepTransformKeys = (obj: any, transform: (key: string) => string): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => deepTransformKeys(v, transform));
    } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
        return Object.keys(obj).reduce((acc, key) => {
            acc[transform(key)] = deepTransformKeys(obj[key], transform);
            return acc;
        }, {} as any);
    }
    return obj;
};

const mapToDbExpert = (expertData: Partial<Expert>): any => {
    // Exclude keys that are managed by the app/db or are not columns
    const { id, createdAt, updatedAt, ...rest } = expertData;
    return deepTransformKeys(rest, toSnakeCase);
};

const mapToExpert = (dbData: any): Expert => {
    const expert = deepTransformKeys(dbData, toCamelCase) as Expert;
    // Ensure nested arrays are not null/undefined
    expert.books = expert.books || [];
    expert.spotlights = expert.spotlights || [];
    return expert;
};


// --- API FUNCTIONS ---

export const getExperts = async (signal?: AbortSignal): Promise<Expert[]> => {
  try {
    const query = supabase.from('experts').select('*');
    if (signal) {
        query.abortSignal(signal);
    }
    const { data, error } = await query;

    if (error) throw error;
    
    return (data || []).map(mapToExpert);
  } catch (error) {
    console.error("Supabase error in getExperts:", error);
    throw new Error(formatSupabaseError(error));
  }
};

export const createExpert = async (expertData: Omit<Expert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Expert> => {
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

  // First, map the expert data to snake_case, which strips out the ID.
  const mappedData = mapToDbExpert({
      ...expertData,
      createdAt: new Date().toISOString(),
  });

  // Then, generate a new ID and add it to the mapped object.
  const dbExpertDataWithId = {
      ...mappedData,
      id: crypto.randomUUID(),
  };

  try {
    const { data, error } = await supabase
      .from('experts')
      .insert(dbExpertDataWithId)
      .select()
      .single();

    if (error) throw error;
    return mapToExpert(data);
  } catch (error) {
    console.error("Error adding expert:", error);
    throw new Error(formatSupabaseError(error));
  }
};

export const updateExpert = async (expertId: string, profileData: Partial<Expert>): Promise<Expert> => {
    const supabaseAdmin = getAdminClient();
    const dbProfileData = {
        ...mapToDbExpert(profileData),
        updated_at: new Date().toISOString(),
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
        return mapToExpert(data);
    } catch (error) {
        console.error("Supabase error updating expert:", error);
        throw new Error(formatSupabaseError(error));
    }
};

export const deleteMultipleExperts = async (expertIds: string[]): Promise<void> => {
  if (expertIds.length === 0) return;
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

export const invokeSendEmailFunction = async (payload: object): Promise<void> => {
    const { error } = await supabase.functions.invoke('send-email', {
        body: payload,
    });

    if (error) {
        console.error("Error invoking send-email function:", error);
        if (error.message.includes('Function not found')) {
             throw new Error("The email sending service is not available at this moment. Please try again later.");
        }
        if (error.message.includes('not configured')) {
             throw new Error("The email sending service is not configured correctly. The administrator has been notified.");
        }
        throw new Error(`Failed to send email. Please try again.`);
    }
};

export const invokeGeminiAdminAgent = async (payload: object): Promise<any> => {
    const { data, error } = await supabase.functions.invoke('gemini-admin-agent', {
        body: payload,
    });

    if (error) {
        console.error("Error invoking gemini-admin-agent function:", error);
        if (error.message.includes('Function not found')) {
             throw new Error("The AI service is not available. Please ensure the function is deployed.");
        }
        if (error.message.includes('not configured')) {
             throw new Error("The AI service is missing its API key. The administrator needs to configure this in Supabase secrets.");
        }
        throw new Error(`An AI agent error occurred. Please try again.`);
    }
    
    // The function itself might return an error in its JSON body
    if (data?.error) {
        throw new Error(data.error);
    }

    return data;
};