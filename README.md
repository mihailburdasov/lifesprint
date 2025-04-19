# LifeSprint App

## Deployment to Vercel

### Prerequisites
- A Vercel account
- Git repository with your project

### Setup Environment Variables
1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Environment Variables" section
3. Add the following variables:
   - `REACT_APP_SUPABASE_URL`: Your Supabase project URL
   - `REACT_APP_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `REACT_APP_LOG_LEVEL`: Set to `ERROR` for production

### Deployment Steps
1. Connect your Git repository to Vercel
2. Configure the build settings:
   - Build Command: `npm run build`
   - Output Directory: `build`
3. Deploy the project

### Troubleshooting
If you encounter 406 (Not Acceptable) errors with Supabase:
1. Check your CORS settings in Supabase dashboard
2. Ensure your Vercel domain is added to the allowed origins
3. Verify that environment variables are correctly set in Vercel

## Local Development

### Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. Run `npm install` to install dependencies
4. Run `npm start` to start the development server

### TypeScript Patches

The project includes patches for TypeScript errors in the Supabase Auth library. These patches are not applied automatically during installation to avoid deployment issues on Vercel.

To apply the patches locally:
1. Run `npm run apply-patches` after installation
2. This will apply the patches in the `patches/` directory to fix TypeScript errors

Note: The patches are not needed for the application to function correctly, as the necessary headers are already included in the Supabase client configuration in `src/core/services/supabase.ts`.
