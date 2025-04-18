# Supabase Authentication for LifeSprint

This document provides instructions for setting up and using the Supabase authentication system in the LifeSprint application.

## Setup Instructions

### 1. Supabase Project Setup

1. Create a Supabase project at [https://supabase.com](https://supabase.com) if you haven't already.
2. Get your project URL and anon key from the project settings.
3. Add these credentials to your `.env` file:
   ```
   REACT_APP_SUPABASE_URL=https://your-project-url.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

### 2. Database Setup

1. Go to the SQL Editor in your Supabase dashboard.
2. Copy and paste the contents of `supabase_setup.sql` into the SQL editor.
3. Run the SQL script to create the `profiles` table and set up Row Level Security (RLS) policies.

## Authentication Features

The authentication system includes the following features:

1. **User Registration**: Users can register with email, password, name, and optional Telegram nickname.
2. **Email Confirmation**: Users must confirm their email address before they can log in.
3. **User Login**: Users can log in with email and password after confirming their email.
4. **Password Reset**: Users can request a password reset email and set a new password.
5. **User Profile**: User profiles are stored in the `profiles` table with RLS policies to ensure data security.

## Testing

You can test the authentication system using the provided `test_auth.js` script:

1. Install the required dependencies:
   ```
   npm install dotenv @supabase/supabase-js
   ```

2. Run the test script:
   ```
   node test_auth.js
   ```

The script will test the following functions:
- Sign up
- Sign in
- Get current user
- Reset password
- Update password
- Sign out

## Implementation Details

### Files

- `src/core/services/supabase.ts`: Supabase client initialization
- `src/features/auth/services/AuthService.ts`: Authentication service with methods for sign up, sign in, sign out, reset password, update password, and get current user
- `src/context/UserContext.tsx`: User context provider that uses the AuthService
- `src/features/auth/pages/AuthPage.tsx`: Authentication page with login, registration, and password reset forms
- `src/features/auth/pages/UpdatePasswordPage.tsx`: Page for updating password after reset

### Authentication Flow

1. **Registration**:
   - User fills out the registration form
   - System creates an account in Supabase Auth with user metadata (name, telegram_nickname)
   - System sends a confirmation email to the user
   - User receives a message that they need to confirm their email

2. **Email Confirmation**:
   - User receives an email with a confirmation link
   - User clicks the link to confirm their email
   - Supabase Auth marks the user as confirmed

3. **Login**:
   - User enters email and password
   - System verifies credentials with Supabase Auth
   - If this is the first login after confirmation, system creates a profile in the `profiles` table
   - System retrieves user profile and sets user context

4. **Password Reset**:
   - User requests password reset
   - System sends reset email via Supabase Auth
   - User clicks link in email and is directed to update password page
   - User enters new password
   - System updates password via Supabase Auth

5. **Logout**:
   - User clicks logout button
   - System signs out via Supabase Auth
   - System clears user context

## Security Considerations

- Row Level Security (RLS) policies ensure that users can only access their own data.
- Passwords are securely hashed by Supabase Auth.
- Authentication tokens are managed by Supabase Auth.
- Email confirmation adds an extra layer of security.
- User metadata is stored securely in Supabase Auth.

### Row Level Security (RLS) Implementation

The `profiles` table has the following RLS policies:

```sql
-- Allow users to read only their own profile
CREATE POLICY "Users can read their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update only their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);
```

These policies ensure that:
1. A user can only read their own profile
2. A user can only update their own profile
3. A user can only insert a profile with their own ID

**Important**: For these policies to work, the user must be authenticated before attempting to create a profile. This is why we create the profile during the first login after email confirmation, not during registration.

## Troubleshooting

If you encounter issues with the authentication system:

1. Check the browser console for error messages.
2. Verify that your Supabase credentials are correct in the `.env` file.
3. Ensure that the `profiles` table and RLS policies are set up correctly.
4. Check that the Supabase Auth settings are configured properly (e.g., site URL, redirect URLs).

### Common Issues

#### "new row violates row-level security policy for table 'profiles'"

This error occurs when trying to insert a profile for a user who is not authenticated. The solution is:

1. Store user metadata during registration
2. Create the profile only after the user is authenticated (during first login after email confirmation)

#### "User not found" after registration

This is normal if email confirmation is enabled. The user needs to confirm their email before they can log in.

#### Profile not created after login

Check if the user is properly authenticated and if the RLS policies are set up correctly. The `auth.uid()` function should return the user's ID when they are authenticated.
