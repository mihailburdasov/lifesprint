import { createClient } from '@supabase/supabase-js';
import { logService } from './logService';

// Get environment variables with fallback values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://yvmukcseklazffqaxpso.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2bXVrY3Nla2xhemZmcWF4cHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyNzI0NTYsImV4cCI6MjA1OTg0ODQ1Nn0.j25gSyYfv4gBE6wprJ_U6ZZ5o55HOmvphk2BiJuglCw';

// Log Supabase configuration for debugging
console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Configured' : 'Missing');

// Create Supabase client with auto token refresh
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

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
        const expiresAtDate = new Date(expiresAt * 1000); // Convert to milliseconds
        const now = new Date();
        
        // If token expires in less than the threshold, refresh it
        if (expiresAtDate.getTime() - now.getTime() < REFRESH_TOKEN_THRESHOLD) {
          const { error } = await supabase.auth.refreshSession();
          
          if (error) {
            logService.error('Failed to refresh token', error);
          } else {
            logService.info('Token refreshed proactively');
          }
        }
      }
    } catch (error) {
      logService.error('Error checking token expiration', error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};
