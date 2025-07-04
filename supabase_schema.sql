-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (compatible with NextAuth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    password_hash VARCHAR(255),
    last_login TIMESTAMP WITH TIME ZONE,
    last_logout TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- NextAuth required fields
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT
);

-- NextAuth required tables
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    id_token TEXT,
    scope TEXT,
    session_state TEXT,
    token_type TEXT,
    
    UNIQUE(provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    
    PRIMARY KEY (identifier, token)
);

-- Target Templates table
CREATE TABLE IF NOT EXISTS target_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    thumbnail_path VARCHAR(255),
    file_size BIGINT NOT NULL,
    duration INTEGER,
    mime_type VARCHAR(255),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id)
);

-- Face Sources table
CREATE TABLE IF NOT EXISTS face_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    usage_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id)
);

-- Generated Media table
CREATE TABLE IF NOT EXISTS generated_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    temp_path VARCHAR(255),
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    download_count INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    author_id UUID REFERENCES users(id),
    template_id UUID REFERENCES target_templates(id),
    face_source_id UUID REFERENCES face_sources(id)
);

-- Guidelines table
CREATE TABLE IF NOT EXISTS guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    file_type VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    is_allowed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    tx_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id),
    generated_media_id VARCHAR(255) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_account ON users(account);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_target_templates_author_id ON target_templates(author_id);
CREATE INDEX IF NOT EXISTS idx_target_templates_is_active ON target_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_face_sources_author_id ON face_sources(author_id);
CREATE INDEX IF NOT EXISTS idx_face_sources_is_active ON face_sources(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_media_author_id ON generated_media(author_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_is_active ON generated_media(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_media_template_id ON generated_media(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_media_face_source_id ON generated_media(face_source_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for guidelines table
CREATE TRIGGER update_guidelines_updated_at 
    BEFORE UPDATE ON guidelines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for better security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE target_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE face_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for other tables (users can only access their own data)
CREATE POLICY "Users can view own target templates" ON target_templates FOR SELECT USING (auth.uid()::text = author_id::text);
CREATE POLICY "Users can insert own target templates" ON target_templates FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Users can update own target templates" ON target_templates FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can view own face sources" ON face_sources FOR SELECT USING (auth.uid()::text = author_id::text);
CREATE POLICY "Users can insert own face sources" ON face_sources FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Users can update own face sources" ON face_sources FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can view own generated media" ON generated_media FOR SELECT USING (auth.uid()::text = author_id::text);
CREATE POLICY "Users can insert own generated media" ON generated_media FOR INSERT WITH CHECK (auth.uid()::text = author_id::text);
CREATE POLICY "Users can update own generated media" ON generated_media FOR UPDATE USING (auth.uid()::text = author_id::text);

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Guidelines can be viewed by all authenticated users
CREATE POLICY "Authenticated users can view guidelines" ON guidelines FOR SELECT TO authenticated USING (true);

-- Allow service role to bypass RLS
CREATE POLICY "Service role bypass" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass accounts" ON accounts FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass sessions" ON sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass target_templates" ON target_templates FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass face_sources" ON face_sources FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass generated_media" ON generated_media FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass guidelines" ON guidelines FOR ALL TO service_role USING (true);
CREATE POLICY "Service role bypass payments" ON payments FOR ALL TO service_role USING (true);
