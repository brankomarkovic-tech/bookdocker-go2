import { createClient } from '@supabase/supabase-js';

// These are public keys and are safe to be in the client-side code.
// Security is managed by Supabase Row Level Security (RLS) policies.
const supabaseUrl = "https://axnidlsutdupwraexlkj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bmlkbHN1dGR1cHdyYWV4bGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTM3NjMsImV4cCI6MjA3NTI2OTc2M30.QTNxzerlUJZcioaD0rXnaTWAIXpUS7V26tAij40b1ko";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are missing in supabaseClient.ts.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
