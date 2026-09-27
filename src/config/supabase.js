import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 'https://orqtjzbteeewmtnbmmoh.supabase.co';
export const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycXRqemJ0ZWVld210bmJtbW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk0MDAwMzUsImV4cCI6MjEwNDk3NjAzNX0.PzXvdZi5DpqJpNjqhCqwPm-AgubER43pQJWHNuT0vD8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export const isolatedAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export default supabase;
