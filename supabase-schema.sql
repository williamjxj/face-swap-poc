-- Face Swap POC Database Schema for Supabase
-- Run this in Supabase SQL Editor after creating your project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account TEXT UNIQUE NOT NULL,
    name TEXT,
    password_hash TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    last_logout TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create TargetTemplate table
CREATE TABLE IF NOT EXISTS "TargetTemplate" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    type TEXT NOT NULL, -- 'video', 'image', 'gif', 'multi-face'
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,
    file_size BIGINT NOT NULL,
    duration INTEGER,
    mime_type TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES "User"(id)
);

-- Create FaceSource table
CREATE TABLE IF NOT EXISTS "FaceSource" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES "User"(id)
);

-- Create GeneratedMedia table
CREATE TABLE IF NOT EXISTS "GeneratedMedia" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'video', 'image'
    temp_path TEXT,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES "User"(id),
    template_id UUID REFERENCES "TargetTemplate"(id),
    face_source_id UUID REFERENCES "FaceSource"(id)
);

-- Create Guideline table
CREATE TABLE IF NOT EXISTS "Guideline" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT NOT NULL,
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL NOT NULL,
    currency TEXT NOT NULL, -- 'USD', 'ETH', 'BTC'
    status TEXT NOT NULL, -- 'pending', 'completed', 'failed'
    type TEXT NOT NULL, -- 'crypto', 'fiat'
    tx_hash TEXT, -- for crypto transactions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES "User"(id),
    generated_media_id TEXT NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_account ON "User"(account);
CREATE INDEX IF NOT EXISTS idx_target_template_author ON "TargetTemplate"(author_id);
CREATE INDEX IF NOT EXISTS idx_target_template_active ON "TargetTemplate"(is_active);
CREATE INDEX IF NOT EXISTS idx_face_source_author ON "FaceSource"(author_id);
CREATE INDEX IF NOT EXISTS idx_face_source_active ON "FaceSource"(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_media_author ON "GeneratedMedia"(author_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_template ON "GeneratedMedia"(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_face_source ON "GeneratedMedia"(face_source_id);
CREATE INDEX IF NOT EXISTS idx_payment_user ON "Payment"(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_status ON "Payment"(status);

-- Enable Row Level Security (RLS)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TargetTemplate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FaceSource" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GeneratedMedia" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guideline" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you can customize these)
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON "User"
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON "User"
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Templates: Users can view all, but only modify their own
CREATE POLICY "Anyone can view active templates" ON "TargetTemplate"
    FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage own templates" ON "TargetTemplate"
    FOR ALL USING (auth.uid()::text = author_id::text);

-- Face sources: Users can only manage their own
CREATE POLICY "Users can manage own face sources" ON "FaceSource"
    FOR ALL USING (auth.uid()::text = author_id::text);

-- Generated media: Users can only manage their own
CREATE POLICY "Users can manage own generated media" ON "GeneratedMedia"
    FOR ALL USING (auth.uid()::text = author_id::text);

-- Guidelines: Everyone can read, only admins can modify (you'll need to implement admin logic)
CREATE POLICY "Anyone can view guidelines" ON "Guideline"
    FOR SELECT USING (true);

-- Payments: Users can only see their own payments
CREATE POLICY "Users can view own payments" ON "Payment"
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('face-sources', 'face-sources', false),
    ('target-templates', 'target-templates', true),
    ('generated-media', 'generated-media', false),
    ('thumbnails', 'thumbnails', true),
    ('guidelines', 'guidelines', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload face sources" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'face-sources' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own face sources" ON storage.objects
    FOR SELECT USING (bucket_id = 'face-sources' AND auth.uid()::text = owner::text);

CREATE POLICY "Anyone can view templates" ON storage.objects
    FOR SELECT USING (bucket_id = 'target-templates');

CREATE POLICY "Users can upload generated media" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'generated-media' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view own generated media" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-media' AND auth.uid()::text = owner::text);

CREATE POLICY "Anyone can view thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

CREATE POLICY "Anyone can view guidelines" ON storage.objects
    FOR SELECT USING (bucket_id = 'guidelines');

-- Success message
SELECT 'Face Swap POC database schema created successfully!' as status;
