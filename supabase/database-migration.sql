-- Database Migration: Prisma PascalCase to Supabase snake_case + NextAuth
-- Run this in your Supabase SQL Editor

-- 1. Create NextAuth schema and tables
CREATE SCHEMA IF NOT EXISTS next_auth;

-- NextAuth tables
CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS next_auth.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- 2. Create new snake_case tables for your app data
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  last_login TIMESTAMPTZ,
  last_logout TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.target_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  duration REAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.face_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.generated_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  face_source_id UUID REFERENCES public.face_sources(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.target_templates(id) ON DELETE SET NULL,
  output_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  generated_media_id UUID REFERENCES public.generated_media(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  paypal_order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guidelines (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_path TEXT NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Migrate existing data from PascalCase to snake_case tables
INSERT INTO public.users (id, email, name, password_hash, last_login, last_logout, created_at, updated_at)
SELECT id::UUID, email, name, password_hash, last_login, last_logout, created_at, updated_at
FROM public."User"
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.target_templates (id, name, description, video_url, thumbnail_url, file_path, file_size, duration, is_active, created_at, updated_at)
SELECT id::UUID, name, description, "videoUrl", "thumbnailUrl", "filePath", "fileSize", duration, "isActive", "createdAt", "updatedAt"
FROM public."TargetTemplate"
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.face_sources (id, author_id, original_filename, file_path, file_size, mime_type, is_active, last_used_at, created_at, updated_at)
SELECT id::UUID, "authorId"::UUID, "originalFilename", "filePath", "fileSize", "mimeType", "isActive", "lastUsedAt", "createdAt", "updatedAt"
FROM public."FaceSource"
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.generated_media (id, author_id, face_source_id, template_id, output_filename, file_path, file_size, processing_status, is_active, created_at, updated_at)
SELECT id::UUID, "authorId"::UUID, "faceSourceId"::UUID, "templateId"::UUID, "outputFilename", "filePath", "fileSize", "processingStatus", "isActive", "createdAt", "updatedAt"
FROM public."GeneratedMedia"
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.payments (id, user_id, generated_media_id, amount, currency, payment_method, payment_status, stripe_session_id, paypal_order_id, created_at, updated_at)
SELECT id::UUID, "userId"::UUID, "generatedMediaId"::UUID, amount, currency, "paymentMethod", "paymentStatus", "stripeSessionId", "paypalOrderId", "createdAt", "updatedAt"
FROM public."Payment"
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.guidelines (id, title, content, is_active, created_at, updated_at)
SELECT id::UUID, title, content, "isActive", "createdAt", "updatedAt"
FROM public."Guideline"
ON CONFLICT (id) DO NOTHING;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_face_sources_author ON public.face_sources(author_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_author ON public.generated_media(author_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_created ON public.generated_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_target_templates_active ON public.target_templates(is_active);

-- NextAuth indexes
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON next_auth.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON next_auth.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON next_auth.sessions(session_token);

-- 5. Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read own data" ON public.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can manage own face sources" ON public.face_sources FOR ALL USING (auth.uid()::text = author_id::text);
CREATE POLICY "Users can manage own generated media" ON public.generated_media FOR ALL USING (auth.uid()::text = author_id::text);
CREATE POLICY "Users can manage own payments" ON public.payments FOR ALL USING (auth.uid()::text = user_id::text);

-- Public read access for templates and guidelines
CREATE POLICY "Public read access to templates" ON public.target_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read access to guidelines" ON public.guidelines FOR SELECT USING (is_active = true);

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA next_auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA next_auth TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT ON public.target_templates TO anon, authenticated;
GRANT SELECT ON public.guidelines TO anon, authenticated;

-- 7. Add next_auth to exposed schemas (for API access)
-- This needs to be done in Supabase Dashboard: Settings > API > Exposed schemas
-- Add "next_auth" to the list
