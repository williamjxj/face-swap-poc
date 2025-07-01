# 🚀 Face Swap POC - Deployment Guide

This guide will help you deploy your Face Swap application to Vercel with Supabase as the backend.

## 📋 Prerequisites

- [Supabase Account](https://supabase.com)
- [Vercel Account](https://vercel.com)
- [GitHub Repository](https://github.com) (for deployment)
- Node.js 18+ installed locally

## 🎯 Step 1: Set Up Supabase Project

### 1.1 Create New Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - **Name**: `face-swap-poc`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: `Southeast Asia (Singapore)` (recommended)
4. Click "Create new project"
5. Wait for project initialization (2-3 minutes)

### 1.2 Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` file
3. Paste and run the SQL script
4. Verify tables are created in **Table Editor**

### 1.3 Get Project Credentials

Go to **Settings > API** and note down:

- **Project URL**: `https://[project-id].supabase.co`
- **Project ID**: `[project-id]`
- **API Keys**:
  - `anon` key (public)
  - `service_role` key (secret - keep private!)

## 🔧 Step 2: Configure Local Environment

### 2.1 Set Up Environment Variables

1. Edit `.env.local` with your Supabase credentials:

   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-DB-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres"
   NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-ID].supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
   SUPABASE_SERVICE_ROLE_KEY="[YOUR-SERVICE-ROLE-KEY]"
   NEXTAUTH_SECRET="[GENERATE-SECURE-SECRET]"
   # ... other variables
   ```

2. Generate a secure NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

### 2.2 Test Local Setup

1. Run the setup script:

   ```bash
   ./scripts/deploy-setup.sh
   ```

2. Start development server:

   ```bash
   npm run dev
   ```

3. Test database connection:
   ```bash
   curl http://localhost:3000/api/test-db
   ```

## 🚀 Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "New Project"
4. Import your GitHub repository
5. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next` (default)

### 3.2 Set Environment Variables in Vercel

1. In Vercel project settings, go to **Environment Variables**
2. Add all variables from your `.env.local`:

| Variable                        | Value                                                                        | Environment |
| ------------------------------- | ---------------------------------------------------------------------------- | ----------- |
| `DATABASE_URL`                  | `postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres` | Production  |
| `NEXT_PUBLIC_SUPABASE_URL`      | `https://[PROJECT-ID].supabase.co`                                           | Production  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[YOUR-ANON-KEY]`                                                            | Production  |
| `SUPABASE_SERVICE_ROLE_KEY`     | `[YOUR-SERVICE-ROLE-KEY]`                                                    | Production  |
| `NEXTAUTH_SECRET`               | `[YOUR-SECURE-SECRET]`                                                       | Production  |
| `NEXTAUTH_URL`                  | `https://your-domain.vercel.app`                                             | Production  |

### 3.3 Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Visit your deployed app URL

## 🔍 Step 4: Verify Deployment

### 4.1 Test Database Connection

Visit: `https://your-app.vercel.app/api/test-db`

Expected response:

```json
{
  "status": "connected",
  "message": "Database connection successful",
  "templateCount": 0
}
```

### 4.2 Test File Upload

1. Try uploading a face source image
2. Check Supabase Storage dashboard
3. Verify files appear in correct buckets

## 🎨 Step 5: Configure Storage Buckets

### 5.1 Verify Storage Buckets

Go to **Storage** in Supabase dashboard and verify these buckets exist:

- `face-sources` (private)
- `target-templates` (public)
- `generated-media` (private)
- `thumbnails` (public)
- `guidelines` (public)

### 5.2 Configure CORS (if needed)

If you encounter CORS issues, add your Vercel domain to Supabase:

1. Go to **Settings > API**
2. Add your domain to **CORS origins**

## 🔒 Step 6: Security Configuration

### 6.1 Row Level Security (RLS)

The SQL script automatically enables RLS. Verify policies in **Authentication > Policies**.

### 6.2 API Rate Limiting

Consider implementing rate limiting for your API routes in production.

## 📊 Step 7: Monitoring & Analytics

### 7.1 Vercel Analytics

Enable Vercel Analytics in your project settings for performance monitoring.

### 7.2 Supabase Monitoring

Monitor database performance in Supabase dashboard under **Reports**.

## 🐛 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check DATABASE_URL format
   - Verify Supabase project is active
   - Check firewall/network settings

2. **File Upload Errors**
   - Verify storage buckets exist
   - Check RLS policies
   - Ensure correct file permissions

3. **Build Failures**
   - Check all environment variables are set
   - Verify Prisma schema is valid
   - Check for missing dependencies

### Debug Commands:

```bash
# Test database connection
npx prisma db pull

# Check Prisma client
npx prisma generate

# Verify build locally
npm run build
```

## 📈 Performance Optimization

1. **Database Indexing**: Already included in schema
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Configure appropriate cache headers
4. **CDN**: Supabase provides global CDN for storage

## 💰 Cost Estimation

**Monthly costs (estimated):**

- Vercel Pro: $20/month
- Supabase Pro: $25/month
- Domain: $1/month
- **Total**: ~$46/month

## 🎉 Success!

Your Face Swap POC is now deployed and ready for production use!

**Next Steps:**

- Set up custom domain
- Configure monitoring alerts
- Implement backup strategy
- Add user analytics
- Optimize performance based on usage

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
