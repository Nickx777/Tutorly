-- 1. Ensure public.users table exists with correct columns
CREATE TABLE IF NOT EXISTS public.users (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  avatar_url text,
  email text,
  role text DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

-- 2. Add columns if they are missing (for existing tables)
DO $$
BEGIN
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS full_name text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email text;
    ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';
EXCEPTION
    WHEN duplicate_column THEN RAISE NOTICE 'Column already exists';
END $$;

-- 3. Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (if they don't exist, we drop first to be safe)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE USING (auth.uid() = id);

-- 5. Function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url, email, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. BACKFILL: Insert existing auth users who are missing from public.users
INSERT INTO public.users (id, full_name, avatar_url, email, role)
SELECT 
  id,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  email,
  COALESCE(raw_user_meta_data->>'role', 'student')
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT (id) DO NOTHING;

-- 8. Grant permissions
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
