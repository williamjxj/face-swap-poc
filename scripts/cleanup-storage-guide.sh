#!/bin/bash

# =============================================================================
# Supabase Storage Cleanup Script
# =============================================================================
# This script helps identify and clean up duplicate/unused Supabase Storage buckets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo "============================================="
echo "🧹 Supabase Storage Cleanup Guide"
echo "============================================="

log_info "Based on your database analysis, here are the cleanup recommendations:"

echo ""
echo "📋 BUCKETS TO KEEP (actively used by your application):"
echo "  ✅ generated-outputs (17 files)"
echo "  ✅ guideline-images (8 files)"
echo "  ✅ face-sources (4 files)"
echo "  ✅ template-videos (1 file)"
echo "  ✅ template-thumbnails (1 file)"

echo ""
echo "🗑️ BUCKETS SAFE TO DELETE:"
echo "  ❌ assets (unused by application)"
echo "  ❌ Any buckets with similar names like:"
echo "     - generated-output (missing 's')"
echo "     - template-video (missing 's')"
echo "     - face-source (missing 's')"
echo "     - guideline-image (missing 's')"
echo "     - Any buckets with different naming patterns"

echo ""
log_warning "MANUAL CLEANUP STEPS:"
echo ""
echo "1. Go to your Supabase Dashboard → Storage"
echo "2. Look for duplicate buckets with similar names"
echo "3. For each duplicate bucket:"
echo "   a. Check if it's empty or contains old files"
echo "   b. If empty → Delete immediately"
echo "   c. If contains files → Compare with correct bucket"
echo "   d. Move important files to correct bucket if needed"
echo "   e. Delete the duplicate bucket"

echo ""
echo "🔍 COMMON DUPLICATE PATTERNS TO LOOK FOR:"
echo "  • Buckets with singular names (e.g., 'face-source' vs 'face-sources')"
echo "  • Buckets with typos or different formatting"
echo "  • Old buckets from previous migrations"
echo "  • Test buckets created during development"

echo ""
echo "⚠️ BEFORE DELETING ANY BUCKET:"
echo "  1. Download a backup of the files if they seem important"
echo "  2. Verify the correct bucket contains the same files"
echo "  3. Test your application after deletion"

echo ""
log_info "If you see any buckets not in the 'KEEP' list above, they are likely duplicates or old buckets."

echo ""
echo "🚀 After cleanup, your Supabase Storage should only have these 5 buckets:"
echo "  • generated-outputs"
echo "  • template-videos"
echo "  • template-thumbnails"
echo "  • face-sources"
echo "  • guideline-images"

echo ""
log_success "Cleanup guide complete! 🎉"
