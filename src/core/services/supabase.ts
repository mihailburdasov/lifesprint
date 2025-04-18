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
      'Accept': 'application/json',  // Specific Accept header for JSON responses
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',  // Prevent caching
      'Pragma': 'no-cache',  // For older browsers
      'Accept-Profile': 'public',  // Specify the Postgres schema
      'Accept-Encoding': 'gzip, deflate, br',  // Accept compressed responses
      'Prefer': 'return=representation'  // Request full representation of data
    }
  },
  // Add specific settings for the PostgREST client
  db: {
    schema: 'public'
  }
});

// Log Supabase configuration for debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase configuration:', {
    url: supabaseUrl,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Accept-Profile': 'public',
      'Accept-Encoding': 'gzip, deflate, br',
      'Prefer': 'return=representation'
    }
  });
}

// Add a function to get a fetch-compatible URL with proper headers
export const getSupabaseUrl = (path: string, userId?: string) => {
  // Check if the path already contains query parameters
  const hasQueryParams = path.includes('?');
  
  // Use the appropriate separator (? or &) based on whether query params already exist
  const url = `${supabaseUrl}${path}${userId ? `${hasQueryParams ? '&' : '?'}user_id=eq.${userId}` : ''}`;
  
  return {
    url,
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Accept': 'application/json',  // Specific Accept header for JSON responses
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      'Cache-Control': 'no-cache',  // Prevent caching
      'Pragma': 'no-cache',  // For older browsers
      'Accept-Profile': 'public',  // Specify the Postgres schema
      'Accept-Encoding': 'gzip, deflate, br'  // Accept compressed responses
    }
  };
};

// Create a direct fetch function for troubleshooting
export const fetchFromSupabase = async (path: string, options = {}) => {
  const fullUrl = `${supabaseUrl}${path}`;
  const headers = {
    'apikey': supabaseAnonKey || '',
    'Authorization': `Bearer ${supabaseAnonKey || ''}`,
    'Accept': 'application/json',  // Specific Accept header for JSON responses
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Accept-Profile': 'public',
    'Accept-Encoding': 'gzip, deflate, br'
  };

  try {
    logger.debug(`Fetching from Supabase: ${fullUrl}`, LogContext.SYNC);
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
      ...options
    });

    if (!response.ok) {
      logger.error(`Supabase fetch error: ${response.status} ${response.statusText}`, LogContext.SYNC);
      throw new Error(`Error fetching from Supabase: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    logger.error('Failed to fetch from Supabase', LogContext.SYNC, error);
    throw error;
  }
};
