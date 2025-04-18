-- Enable Row Level Security (RLS) on the user_progress table
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies
-- 1. Allow users to read only their own progress
CREATE POLICY "Users can read their own progress" 
  ON public.user_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- 2. Allow users to update only their own progress
CREATE POLICY "Users can update their own progress" 
  ON public.user_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- 3. Allow users to insert their own progress
CREATE POLICY "Users can insert their own progress" 
  ON public.user_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to delete their own progress (optional)
CREATE POLICY "Users can delete their own progress" 
  ON public.user_progress 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
