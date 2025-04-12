import { createClient } from '@supabase/supabase-js';
import { logService } from './logService';

// Get environment variables with fallback values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please check your environment variables.');
}

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Configured' : 'Missing');

// Create Supabase client with auto token refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Setup auth state change listener for token refresh events
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'TOKEN_REFRESHED') {
    logService.info('Supabase JWT token refreshed successfully');
  } else if (event === 'SIGNED_OUT') {
    logService.info('User signed out');
  }
});

// Setup a periodic token refresh check
const REFRESH_TOKEN_THRESHOLD = 10 * 60 * 1000; // 10 minutes in milliseconds

export const setupTokenRefresh = () => {
  // Check token expiration every 5 minutes
  setInterval(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        const expiresAt = data.session.expires_at;
        if (expiresAt) {
          const expiresAtDate = new Date(expiresAt * 1000); // Convert to milliseconds
          const now = new Date();
          
          // If token expires in less than the threshold, refresh it
          if (expiresAtDate.getTime() - now.getTime() < 5 * 60 * 1000) {
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) {
              console.error('Error refreshing session:', refreshError);
            } else if (refreshData.session) {
              console.log('Session refreshed successfully');
            }
          }
        }
      }
    } catch (error) {
      logService.error('Error checking token expiration', error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};
