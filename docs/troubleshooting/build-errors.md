# 🚨 Build Error Troubleshooting

This guide covers common build errors and their solutions for the Face Swap POC application.

## 🏗️ Next.js Build Errors

### Environment Variable Issues

#### Error: "Environment variable not found during build"

```bash
Error: Environment variable not found: DATABASE_URL
Error occurred prerendering page "/api/auth/session"
```

**Root Cause:** Next.js requires certain environment variables at build time.

**Solutions:**

1. **Add Fallback Values in next.config.js:**

   ```javascript
   // next.config.js
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     env: {
       DATABASE_URL:
         process.env.DATABASE_URL || 'postgresql://fallback:fallback@localhost:5432/fallback',
       NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'fallback-secret-key-minimum-32-characters',
       NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
     },
     // ... other config
   }
   ```

2. **Create Build-Specific Environment File:**

   ```bash
   # .env.build
   DATABASE_URL="postgresql://build:build@localhost:5432/build"
   NEXTAUTH_SECRET="build-time-secret-key-minimum-32"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Conditional Environment Loading:**
   ```javascript
   // In your lib/db.js or similar
   const DATABASE_URL =
     process.env.DATABASE_URL ||
     (process.env.NODE_ENV === 'development'
       ? 'postgresql://localhost:5432/dev'
       : 'postgresql://fallback')
   ```

#### Error: "Invalid DATABASE_URL format"

```bash
Error: Invalid `prisma.user.findMany()` invocation
Invalid database URL
```

**Solutions:**

1. **Verify URL Format:**

   ```bash
   # Correct format
   DATABASE_URL="postgresql://username:password@hostname:port/database"

   # For Supabase
   DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
   ```

2. **Escape Special Characters:**
   ```bash
   # If password contains special characters
   DATABASE_URL="postgresql://postgres:p%40ssw%23rd@localhost:5432/db"
   ```

### Prisma Build Errors

#### Error: "Prisma Client not generated"

```bash
Error: @prisma/client did not initialize yet
Module not found: Can't resolve '@prisma/client'
```

**Solutions:**

1. **Generate Client During Build:**

   ```json
   // package.json
   {
     "scripts": {
       "build": "npx prisma generate && next build",
       "postinstall": "npx prisma generate"
     }
   }
   ```

2. **Verify Prisma Schema:**

   ```bash
   npx prisma validate
   npx prisma format
   npx prisma generate
   ```

3. **Clean and Rebuild:**
   ```bash
   rm -rf node_modules .next
   npm install
   npx prisma generate
   npm run build
   ```

#### Error: "Schema validation failed"

```bash
Error: Schema parsing error at line X
Invalid model definition
```

**Solutions:**

1. **Check Schema Syntax:**

   ```prisma
   // Common issues in schema.prisma

   // ❌ Missing @@map or wrong syntax
   model User {
     id String @id @default(cuid())
     // Missing @@map("users")
   }

   // ✅ Correct syntax
   model User {
     id String @id @default(cuid())
     @@map("users")
   }
   ```

2. **Validate Relations:**

   ```prisma
   // ❌ Missing relation
   model User {
     id String @id
     posts Post[]
   }

   model Post {
     id String @id
     // Missing user relation
   }

   // ✅ Correct relation
   model Post {
     id String @id
     userId String
     user User @relation(fields: [userId], references: [id])
   }
   ```

### TypeScript Build Errors

#### Error: "Type 'undefined' is not assignable to type 'string'"

```bash
Type 'string | undefined' is not assignable to type 'string'
Property 'x' does not exist on type 'y'
```

**Solutions:**

1. **Add Type Guards:**

   ```typescript
   // ❌ Error prone
   const user = session.user
   const name = user.name.toLowerCase()

   // ✅ Safe approach
   const user = session?.user
   const name = user?.name?.toLowerCase() || 'Unknown'
   ```

2. **Update TypeScript Configuration:**

   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": false,
       "strictNullChecks": true
     }
   }
   ```

3. **Add Proper Types:**
   ```typescript
   // Define proper interfaces
   interface UserSession {
     user?: {
       id: string
       name?: string
       email?: string
     }
   }
   ```

### ESLint Build Errors

#### Error: "ESLint configuration error"

```bash
Error: Failed to load config "@next/eslint-plugin-next"
Parsing error: Unexpected token
```

**Solutions:**

1. **Update ESLint Configuration:**

   ```javascript
   // eslint.config.mjs
   import { ESLint } from '@eslint/eslintrc'

   export default [
     {
       files: ['**/*.{js,jsx,ts,tsx}'],
       languageOptions: {
         ecmaVersion: 'latest',
         sourceType: 'module',
       },
       rules: {
         '@typescript-eslint/no-unused-vars': [
           'error',
           {
             argsIgnorePattern: '^_',
             varsIgnorePattern: '^_',
           },
         ],
       },
     },
   ]
   ```

2. **Disable ESLint During Build (Temporary):**

   ```javascript
   // next.config.js
   const nextConfig = {
     eslint: {
       ignoreDuringBuilds: true, // Only for emergency fixes
     },
   }
   ```

3. **Fix Common ESLint Errors:**

   ```bash
   # Automatically fix issues
   npm run lint-fix

   # Or manually
   npx eslint --fix "src/**/*.{js,jsx,ts,tsx}"
   ```

## 🚢 Deployment Build Errors

### Vercel Build Failures

#### Error: "Build failed with exit code 1"

**Common Causes and Solutions:**

1. **Check Build Logs in Vercel:**

   ```bash
   # In Vercel Dashboard → Deployments → View Build Logs
   # Look for specific error messages
   ```

2. **Memory Issues:**

   ```javascript
   // vercel.json
   {
     "functions": {
       "app/api/**/*.js": {
         "maxDuration": 30
       }
     },
     "builds": [
       {
         "src": "package.json",
         "use": "@vercel/node",
         "config": {
           "maxLambdaSize": "50mb"
         }
       }
     ]
   }
   ```

3. **Environment Variables Missing:**
   ```bash
   # Check Vercel Environment Variables
   # Project Settings → Environment Variables
   # Ensure all required variables are set
   ```

#### Error: "Module not found" in production

```bash
Module not found: Can't resolve 'some-module'
Error: Cannot find module 'xyz'
```

**Solutions:**

1. **Check Dependencies:**

   ```json
   // package.json - move from devDependencies to dependencies if needed
   {
     "dependencies": {
       "@prisma/client": "^6.7.0",
       "next": "15.2.4"
     },
     "devDependencies": {
       "prisma": "^6.7.0"
     }
   }
   ```

2. **Update Import Paths:**

   ```javascript
   // ❌ Problematic import
   import { helper } from '../../../utils/helper'

   // ✅ Use path alias
   import { helper } from '@/utils/helper'
   ```

3. **Check Next.js Configuration:**
   ```javascript
   // next.config.js
   const nextConfig = {
     experimental: {
       outputFileTracingIncludes: {
         '/api/**/*': ['./prisma/**/*'],
       },
     },
   }
   ```

### Database Migration Errors During Build

#### Error: "Migration failed during deployment"

```bash
Error: Migration engine failed to start
Database is not accessible during build
```

**Solutions:**

1. **Separate Migration from Build:**

   ```json
   // package.json
   {
     "scripts": {
       "build": "next build",
       "postdeploy": "npx prisma migrate deploy"
     }
   }
   ```

2. **Use Build-Safe Database URL:**

   ```javascript
   // lib/db.js
   const prisma = new PrismaClient({
     datasources: {
       db: {
         url:
           process.env.NODE_ENV === 'production'
             ? process.env.DATABASE_URL
             : process.env.DATABASE_URL || 'postgresql://localhost:5432/fallback',
       },
     },
   })
   ```

3. **Skip Database Access During Build:**
   ```javascript
   // In API routes or components
   if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
     return { props: {} } // Skip database operations during build
   }
   ```

## 🔧 Quick Fix Commands

### Reset and Rebuild

```bash
#!/bin/bash
# scripts/reset-and-rebuild.sh

echo "🧹 Cleaning project..."

# Clean Next.js cache
rm -rf .next

# Clean node modules
rm -rf node_modules
rm -f package-lock.json

# Clean Prisma generated files
rm -rf node_modules/@prisma/client
rm -rf prisma/generated

echo "📦 Reinstalling dependencies..."
npm install

echo "🔧 Regenerating Prisma client..."
npx prisma generate

echo "🏗️ Building project..."
npm run build

echo "✅ Reset and rebuild completed"
```

### Build Verification Script

```bash
#!/bin/bash
# scripts/verify-build.sh

echo "🔍 Verifying build requirements..."

# Check environment variables
echo "📁 Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️ DATABASE_URL not set, using fallback"
    export DATABASE_URL="postgresql://fallback:fallback@localhost:5432/fallback"
fi

if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️ NEXTAUTH_SECRET not set, using fallback"
    export NEXTAUTH_SECRET="fallback-secret-key-minimum-32-characters"
fi

# Validate Prisma schema
echo "🔧 Validating Prisma schema..."
npx prisma validate || exit 1

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate || exit 1

# Run linting
echo "🔍 Running lint checks..."
npm run lint || echo "⚠️ Lint issues found"

# Build project
echo "🏗️ Building project..."
npm run build || exit 1

echo "✅ Build verification completed successfully"
```

## 📋 Build Error Checklist

When encountering build errors, check:

- [ ] All required environment variables are set
- [ ] DATABASE_URL is properly formatted
- [ ] Prisma schema is valid (`npx prisma validate`)
- [ ] Prisma client is generated (`npx prisma generate`)
- [ ] Dependencies are properly installed
- [ ] TypeScript errors are resolved
- [ ] ESLint errors are fixed
- [ ] Import paths are correct
- [ ] No client-side code in server components
- [ ] OAuth URLs match deployment URLs

## 📚 Related Documentation

- [common-issues.md](./common-issues.md) - General troubleshooting
- [deployment-issues.md](./deployment-issues.md) - Deployment-specific problems
- [../VERCEL_DEPLOYMENT_CHECKLIST.md](../VERCEL_DEPLOYMENT_CHECKLIST.md) - Deployment guide

---

**Note**: Always run builds locally first to catch issues before deploying. Use the verification script regularly to ensure your environment is properly configured.
