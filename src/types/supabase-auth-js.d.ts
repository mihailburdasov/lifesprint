import '@supabase/auth-js';

declare module '@supabase/auth-js/src/lib/fetch' {
  export function _sessionResponse(data: any): {
    data: {
      session: any | null;
      user: any;
    };
    error: null;
  };
}
