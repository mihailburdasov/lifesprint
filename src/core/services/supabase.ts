import { createClient } from '@supabase/supabase-js';
import { logger, LogContext } from './LoggingService';

// Validate environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('REACT_APP_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('REACT_APP_SUPABASE_ANON_KEY');
  
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
  logger.error(errorMessage, LogContext.SYSTEM);
  
  // In development, show a more visible error
  if (process.env.NODE_ENV === 'development') {
    console.error('🔴 CRITICAL ERROR: ' + errorMessage);
    console.error('Please check your .env file and make sure these variables are set correctly.');
  }
}

// Create Supabase client with proper options to fix 406 errors
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'Accept': '*/*',  // More permissive Accept header
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',  // Prevent caching
      'Pragma': 'no-cache'  // For older browsers
    }
  }
});

// Add a function to get a fetch-compatible URL with proper headers
export const getSupabaseUrl = (path: string, userId?: string) => {
  const url = `${supabaseUrl}${path}${userId ? `?user_id=eq.${userId}` : ''}`;
  
  return {
    url,
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': '*/*',  // More permissive Accept header
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Cache-Control': 'no-cache',  // Prevent caching
      'Pragma': 'no-cache'  // For older browsers
    }
  };
};
