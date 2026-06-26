-- Create initial schema for Violet Career OS

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  userId UUID NOT NULL,
  fullName TEXT,
  email TEXT,
  phone TEXT,
  github TEXT,
  linkedin TEXT,
  portfolio TEXT,
  location TEXT,
  education JSONB,
  skills TEXT[],
  experience JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  requirements TEXT[],
  status TEXT NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Emails Table
CREATE TABLE IF NOT EXISTS public.emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id),
  sender TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  processed BOOLEAN DEFAULT false,
  receivedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Achievements Table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  isAppliedToResume BOOLEAN DEFAULT false,
  detectedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Approvals Table
CREATE TABLE IF NOT EXISTS public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Memory Table
CREATE TABLE IF NOT EXISTS public.memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL REFERENCES auth.users(id),
  identity JSONB,
  preference JSONB,
  history JSONB,
  learning JSONB
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (allow users to read/write only their own data)
CREATE POLICY "Users can access their own data" ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can access their own applications" ON public.applications FOR ALL USING (auth.uid() = userId);
CREATE POLICY "Users can access their own emails" ON public.emails FOR ALL USING (auth.uid() = userId);
CREATE POLICY "Users can access their own achievements" ON public.achievements FOR ALL USING (auth.uid() = userId);
CREATE POLICY "Users can access their own approvals" ON public.approvals FOR ALL USING (auth.uid() = userId);
CREATE POLICY "Users can access their own memory" ON public.memory FOR ALL USING (auth.uid() = userId);
