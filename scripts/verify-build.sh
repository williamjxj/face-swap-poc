#!/bin/bash

# Build Verification Script
# This script tests if the project builds successfully and checks for common issues

echo "🔍 Checking Face Swap POC Build Configuration..."

# Check if required files exist
echo "📁 Checking environment files..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "❌ .env file missing"
fi

if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
else
    echo "❌ .env.local file missing"
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production file exists"
else
    echo "❌ .env.production file missing"
fi

# Check for DATABASE_URL in environment files
echo ""
echo "🔗 Checking DATABASE_URL configuration..."
if grep -q "DATABASE_URL" .env 2>/dev/null; then
    echo "✅ DATABASE_URL found in .env"
else
    echo "❌ DATABASE_URL missing in .env"
fi

if grep -q "DATABASE_URL" .env.local 2>/dev/null; then
    echo "✅ DATABASE_URL found in .env.local"
else
    echo "❌ DATABASE_URL missing in .env.local"
fi

if grep -q "DATABASE_URL" .env.production 2>/dev/null; then
    echo "✅ DATABASE_URL found in .env.production"
else
    echo "❌ DATABASE_URL missing in .env.production"
fi

# Test build
echo ""
echo "🏗️  Testing build process..."
npm run build > build.log 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "🎉 Your project is ready for deployment!"
    echo ""
    echo "📋 Next steps for Vercel deployment:"
    echo "1. Push your changes to GitHub"
    echo "2. Connect your repository to Vercel"
    echo "3. Set environment variables in Vercel dashboard:"
    echo "   - DATABASE_URL (your production database)"
    echo "   - NEXTAUTH_SECRET (generate a new one for production)"
    echo "   - MODAL_CREATE_API and MODAL_QUERY_API (your production APIs)"
    echo "4. Deploy!"
else
    echo "❌ Build failed. Check build.log for details:"
    echo ""
    tail -20 build.log
fi

echo ""
echo "📚 For more details, see docs/DEPLOYMENT_ENVIRONMENT_GUIDE.md"
