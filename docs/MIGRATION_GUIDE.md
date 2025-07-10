# Migration from Prisma to Direct Supabase with Next-Auth

## What we've completed:

1. ✅ **Updated package.json**:
   - Removed Prisma dependencies (@prisma/client, prisma)
   - Added Supabase adapter for Next-Auth (@auth/supabase-adapter)
   - Updated build scripts to remove Prisma commands

2. ✅ **Created Supabase database schema** (`supabase_schema.sql`):
   - Compatible with Next-Auth requirements
   - Includes all your existing tables (users, target_templates, face_sources, etc.)
   - Added Row Level Security (RLS) policies
   - Created necessary indexes for performance

3. ✅ **Created new Supabase database helper** (`src/lib/supabase-db.js`):
   - Provides functions for all database operations
   - Uses direct Supabase client instead of Prisma
   - Maintains same API interface for easy migration

4. ✅ **Updated Next-Auth configuration** (`src/services/auth.js`):
   - Added Supabase adapter
   - Updated user lookup and session management
   - Maintains existing OAuth providers (Google, Azure AD, Credentials)

5. ✅ **Updated key API routes**:
   - `/api/auth/register` - User registration
   - `/api/face-sources` - Face source management
   - `/api/generated-media` - Generated media management
   - `/api/templates` - Template management

6. ✅ **Removed Prisma files**:
   - Deleted `prisma/` directory
   - Removed `src/lib/db.js`

## What still needs to be done:

### 1. Apply the database schema to Supabase

Run the SQL in `supabase_schema.sql` in your Supabase dashboard SQL editor.

### 2. Update remaining API routes

The following files still reference the old Prisma imports and need to be updated:

**High Priority (commonly used):**

- `src/app/api/guidelines/route.js`
- `src/app/api/download-media/route.js`
- `src/app/api/upload-source/route.js`
- `src/app/api/user/profile/route.js`
- `src/utils/auth-helper.js`

**Medium Priority:**

- `src/app/api/stripe/webhook/route.js`
- `src/app/api/paypal/route.js`
- `src/app/api/payment/success/route.js`
- `src/app/api/face-sources/[id]/route.js`
- `src/app/api/generated-media/[id]/route.js`
- `src/app/api/templates/[id]/route.js`

**Low Priority (utility/debug):**

- `src/app/api/health/route.js`
- `src/pages/api/debug-db.js`
- `src/pages/api/debug-auth.js`

### 3. Update environment variables

Make sure these environment variables are set in your deployment:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next-Auth
NEXTAUTH_URL=your_vercel_app_url
NEXTAUTH_SECRET=your_nextauth_secret

# OAuth providers (keep existing)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
AZURE_AD_CLIENT_ID=...
AZURE_AD_CLIENT_SECRET=...
AZURE_AD_TENANT_ID=...
```

### 4. Database field mapping

Note the field name changes from Prisma camelCase to Supabase snake_case:

| Prisma Field   | Supabase Field  |
| -------------- | --------------- |
| `passwordHash` | `password_hash` |
| `lastLogin`    | `last_login`    |
| `lastLogout`   | `last_logout`   |
| `createdAt`    | `created_at`    |
| `updatedAt`    | `updated_at`    |
| `filePath`     | `file_path`     |
| `fileSize`     | `file_size`     |
| `mimeType`     | `mime_type`     |
| `isActive`     | `is_active`     |
| `authorId`     | `author_id`     |

### 5. Test the deployment

1. Deploy to Vercel
2. Test authentication flows (Google, Azure AD, email/password)
3. Test core features (face upload, template selection, media generation)
4. Monitor logs for any database-related errors

## Benefits of this migration:

- ✅ Eliminates Prisma build issues in Vercel
- ✅ Simplifies the deployment process
- ✅ Uses Supabase's native authentication integration
- ✅ Reduces bundle size and build time
- ✅ Better serverless compatibility
- ✅ Leverages Supabase's built-in security features (RLS)

## Next steps:

1. Run the SQL schema in your Supabase database
2. Update the remaining API routes (I can help with this)
3. Test locally with the new setup
4. Deploy to Vercel and test production
