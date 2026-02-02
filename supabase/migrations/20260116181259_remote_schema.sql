-- Add monthly_points column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'monthly_points'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN monthly_points integer NOT NULL DEFAULT 0;
  END IF;
END $$;
