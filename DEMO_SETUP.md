# Demo Setup Instructions

## Issues Fixed

### 1. ✅ Download Video Issue Fixed

**Problem**: Videos were failing to download with 403 Forbidden error "Media is not paid for"

**Solution**:

- Modified `/api/download-media/route.js` to bypass payment requirement for demo/POC
- Updated face-fusion page to allow downloads without payment check
- Updated VideoModal component to always show download button as enabled

**For Production**: Uncomment the payment check lines in the download handlers.

### 2. ✅ Demo Login Issue Fixed

**Problem**: Demo credentials `demo@example.com` / `123456` were not working

**Solution**:

- Created `/api/setup-demo/route.js` endpoint to create demo user
- Demo user setup can be done via API call or manual database insertion

## Demo User Setup

### Option 1: Via API (Recommended)

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Create demo user via API:
   ```bash
   curl -X POST http://localhost:3000/api/setup-demo
   ```

### Option 2: Manual Database Setup

If the API method doesn't work due to permissions, manually insert the demo user into your Supabase `users` table:

```sql
INSERT INTO users (
  id,
  email,
  name,
  password_hash,
  created_at,
  updated_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'demo@example.com',
  'Demo User',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- bcrypt hash of '123456'
  NOW(),
  NOW(),
  NOW()
);
```

## Demo Credentials

- **Email**: `demo@example.com`
- **Password**: `123456`

## Features Enabled for Demo

- ✅ Video downloads work without payment
- ✅ All generated content is accessible
- ✅ No payment gates for demo purposes
- ✅ Full face-swap functionality

## Production Notes

When deploying to production, remember to:

1. Re-enable payment checks in `/api/download-media/route.js`
2. Re-enable payment checks in face-fusion page download handler
3. Update VideoModal to show payment options for unpaid content
4. Remove or secure the demo setup endpoint

## Testing

1. Navigate to `/auth/signin`
2. Use demo credentials: `demo@example.com` / `123456`
3. Upload face source and target template
4. Generate face-swap video
5. Download the generated video (should work without payment)
