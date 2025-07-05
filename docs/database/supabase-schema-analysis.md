# Supabase Database Schema Implementation Analysis

## Overview

This document analyzes the current Supabase database schema implementation for the Face Swap POC application, comparing the actual codebase usage with the available SQL schema files.

## Schema Files Comparison

### 1. `database-migration.sql` (Currently Used)
- **Purpose**: Migration from Prisma PascalCase to Supabase snake_case
- **NextAuth**: Separate `next_auth` schema with dedicated tables
- **Structure**: Snake_case naming convention
- **Status**: ✅ **ACTIVELY USED BY CODEBASE**

### 2. `supabase_schema.sql` (Deprecated)
- **Purpose**: Alternative schema design
- **NextAuth**: Integrated into `public` schema
- **Structure**: Different field names and relationships
- **Status**: ❌ **NOT USED - DEPRECATED**

## Current Database Structure (In Use)

### Core Tables

#### 1. Users Table (`public.users`)
```sql
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT,
  last_login TIMESTAMPTZ,
  last_logout TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Code Usage:**
- Authentication via JWT strategy (no database sessions)
- User management through `src/lib/supabase-db.js`
- Fields: `email`, `name`, `password_hash`, `last_login`, `last_logout`

#### 2. Target Templates Table (`public.target_templates`)
```sql
CREATE TABLE public.target_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,  -- Used for categorization: 'image' | 'multi-face'
  video_url TEXT,
  thumbnail_url TEXT,
  file_path TEXT,
  file_size BIGINT DEFAULT 0,
  duration REAL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Code Usage:**
- Template categorization via `description` field
- Fields: `name`, `description`, `video_url`, `thumbnail_url`, `file_path`
- **Issue**: UI not properly filtering by `description` field

#### 3. Face Sources Table (`public.face_sources`)
```sql
CREATE TABLE public.face_sources (
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
```

**Code Usage:**
- User-uploaded face images
- Fields: `author_id`, `original_filename`, `file_path`, `file_size`, `mime_type`

#### 4. Generated Media Table (`public.generated_media`)
```sql
CREATE TABLE public.generated_media (
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
```

**Code Usage:**
- Face-swapped output media
- Fields: `output_filename`, `processing_status`, `author_id`, `face_source_id`, `template_id`

#### 5. Guidelines Table (`public.guidelines`)
```sql
CREATE TABLE public.guidelines (
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
```

**Code Usage:**
- Static guideline images (8 images)
- Business rule: `is_allowed = true` if filename starts with 's'

## Authentication Implementation

### NextAuth Configuration
- **Strategy**: JWT-only (no database sessions)
- **Providers**: Google OAuth, Azure AD, Credentials
- **User Management**: Custom functions in `supabase-db.js`
- **Schema**: Does NOT use `next_auth` schema from `database-migration.sql`

### Key Implementation Details
```javascript
// src/services/auth.js
export const authOptions = {
  // Removed Supabase adapter to use pure JWT strategy
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}
```

## Data Access Layer

### Supabase Client Configuration
```javascript
// src/lib/supabase.js
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',  // Uses public schema only
  },
})
```

### Database Operations
- **File**: `src/lib/supabase-db.js`
- **Pattern**: Direct Supabase client queries
- **Naming**: Snake_case database fields converted to camelCase for UI

## Current Issues

### 1. Template Categorization Bug
- **Problem**: All templates show in 'Image' tab regardless of `description` field
- **Expected**: Templates with `description='multi-face'` should show in 'Multiple-face' tab
- **Root Cause**: UI filtering logic not implemented correctly

### 2. Schema Documentation Inconsistency
- **Problem**: Multiple SQL files with different structures
- **Impact**: Developer confusion about actual schema
- **Solution**: Remove deprecated `supabase_schema.sql`

## Recommendations

1. **Fix Template Categorization**: Update UI logic to filter by `description` field
2. **Remove Deprecated Files**: Delete `supabase_schema.sql` to avoid confusion
3. **Update Documentation**: Ensure all docs reference current schema structure
4. **Consider Schema Validation**: Add runtime validation for critical fields like `description`

## Storage Integration

### Supabase Storage Buckets
- **guideline-images**: Static 8 images (read-only)
- **template-videos**: User-uploaded templates and generated media
- **Integration**: Direct file upload/download via Supabase Storage API

## Security Implementation

### Row Level Security (RLS)
- **Enabled**: All user-related tables have RLS policies
- **Pattern**: Users can only access their own data
- **Exception**: Templates and guidelines have public read access

### Policies Example
```sql
-- Users can manage own face sources
CREATE POLICY "Users can manage own face sources" 
ON public.face_sources FOR ALL 
USING (auth.uid()::text = author_id::text);

-- Public read access to templates
CREATE POLICY "Public read access to templates" 
ON public.target_templates FOR SELECT 
USING (is_active = true);
```

## Migration History

1. **Original**: Prisma with PascalCase naming
2. **Current**: Direct Supabase with snake_case naming
3. **NextAuth**: Migrated from database adapter to JWT-only strategy

---

**Last Updated**: 2025-01-05  
**Schema Version**: database-migration.sql (without next_auth schema)  
**Status**: Production Active
