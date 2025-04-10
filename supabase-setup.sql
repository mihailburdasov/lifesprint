-- Supabase SQL setup for Lifesprint application

-- Create profiles table to store additional user information
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  telegram_nickname TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create user_progress table to store user progress data
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  current_day INTEGER NOT NULL,
  days JSONB DEFAULT '{}'::JSONB NOT NULL,
  week_reflections JSONB DEFAULT '{}'::JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Set up Row Level Security (RLS) for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Set up Row Level Security (RLS) for user_progress table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user_progress table
CREATE POLICY "Users can view their own progress" 
  ON user_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" 
  ON user_progress FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
  ON user_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to automatically update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at column
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
BEFORE UPDATE ON user_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create a profile for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create a profile for new users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Instructions for use:
-- 1. Go to the Supabase SQL Editor
-- 2. Paste this entire script
-- 3. Click "Run" to execute the script
-- 4. Verify that the tables and policies have been created
