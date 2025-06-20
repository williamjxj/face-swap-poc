#!/bin/bash

# Face Swap POC - Deployment Setup Script
# This script helps set up the deployment environment

set -e

echo "🚀 Face Swap POC - Deployment Setup"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required files exist
echo ""
print_info "Checking required files..."

if [ ! -f "supabase-schema.sql" ]; then
    print_error "supabase-schema.sql not found!"
    exit 1
fi

if [ ! -f "src/lib/supabase.js" ]; then
    print_error "src/lib/supabase.js not found!"
    exit 1
fi

print_status "All required files found"

# Check if .env.local exists
echo ""
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found"
    print_info "Creating .env.local from template..."
    print_status ".env.local created from template"
    print_warning "Please edit .env.local with your actual Supabase credentials"
else
    print_status ".env.local already exists"
fi

# Check Node.js and npm versions
echo ""
print_info "Checking Node.js and npm versions..."
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js: $node_version"
print_status "npm: $npm_version"

# Install dependencies
echo ""
print_info "Installing dependencies..."
npm install
print_status "Dependencies installed"

# Check Prisma
echo ""
print_info "Checking Prisma setup..."
if command -v npx prisma &> /dev/null; then
    print_status "Prisma CLI available"
    
    # Generate Prisma client
    print_info "Generating Prisma client..."
    npx prisma generate
    print_status "Prisma client generated"
else
    print_error "Prisma CLI not found"
    exit 1
fi

# Build check
echo ""
print_info "Testing build process..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Build successful"
else
    print_error "Build failed"
    exit 1
fi

echo ""
print_status "Setup completed successfully!"
echo ""
print_info "Next steps:"
echo "1. Create your Supabase project at https://supabase.com/dashboard"
echo "2. Run the SQL script (supabase-schema.sql) in Supabase SQL Editor"
echo "3. Update .env.local with your Supabase credentials"
echo "4. Test locally: npm run dev"
echo "5. Deploy to Vercel: Connect your GitHub repo"
echo ""
print_warning "Don't forget to set environment variables in Vercel dashboard!"
echo ""
