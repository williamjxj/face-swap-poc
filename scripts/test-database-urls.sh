#!/bin/bash

# Database URL Connection Tester Script
# Tests multiple DATABASE_URL formats to find the working one

echo "🚀 Starting Database URL Connection Tests"
echo "=========================================="

# Array of test cases
declare -a TEST_URLS=(
    'postgresql://postgres:William1\!@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres'
    'postgresql://postgres:FaceSwapPOC2025!Secure!@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres'
    'postgresql://postgres:FaceSwapPOC2025!Secure!@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres'
    'postgresql://postgres:FaceSwapPOC2025\!Secure\!@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres'
    'postgresql://postgres:FaceSwapPOC2025%21Secure%21@db.yunxidsqumhfushjcgyg.supabase.co:5432/postgres'
    'postgresql://postgres:FaceSwapPOC2025!Secure!@db.yunxidsqumhfushjcgyg.supabase.co:6543/postgres'
)

declare -a TEST_NAMES=(
    "Test 1: Escaped exclamation marks (William1\!)"
    "Test 2: Unescaped exclamation marks (FaceSwapPOC2025!Secure!)"
    "Test 3: Unescaped with quotes (FaceSwapPOC2025!Secure!)"
    "Test 4: Escaped with quotes (FaceSwapPOC2025\!Secure\!)"
    "Test 5: URL encoded (%21)"
    "Test 6: Connection pooling port 6543"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arrays to store results
WORKING_URLS=()
FAILED_URLS=()

# Function to test a single database URL
test_database_url() {
    local test_url="$1"
    local test_name="$2"
    local test_number="$3"
    
    echo ""
    echo -e "${BLUE}🔍 $test_name${NC}"
    echo "URL: $test_url"
    
    # Set both DATABASE_URL and DIRECT_URL temporarily
    export DATABASE_URL="$test_url"
    export DIRECT_URL="$test_url"
    
    echo "   ⏳ Testing connection..."
    
    # Test using psql directly for more reliable connection testing
    # Extract connection components from URL
    local host=$(echo "$test_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    local port=$(echo "$test_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    local database=$(echo "$test_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    local userpass=$(echo "$test_url" | sed -n 's/postgresql:\/\/\([^@]*\)@.*/\1/p')
    local user=$(echo "$userpass" | cut -d: -f1)
    local password=$(echo "$userpass" | cut -d: -f2-)
    
    # Test connection using psql
    if PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ SUCCESS: Connection established!${NC}"
        WORKING_URLS+=("$test_url|$test_name")
        
        # Additional test: Check if we can query tables using Prisma
        if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"User\";" > /dev/null 2>&1; then
            echo -e "   ${GREEN}✅ SUCCESS: Can query tables with Prisma${NC}"
        else
            echo -e "   ${YELLOW}⚠️  WARNING: Connected but cannot query User table with Prisma${NC}"
        fi
    else
        echo -e "   ${RED}❌ FAILED: Cannot connect to database${NC}"
        FAILED_URLS+=("$test_name")
        
        # Try to get more detailed error info
        local error_output=$(PGPASSWORD="$password" psql -h "$host" -p "$port" -U "$user" -d "$database" -c "SELECT 1;" 2>&1)
        echo -e "   ${RED}   Error details: $error_output${NC}"
    fi
    
    # Clean up
    unset DATABASE_URL
    unset DIRECT_URL
    sleep 1
}

# Run all tests
for i in "${!TEST_URLS[@]}"; do
    test_database_url "${TEST_URLS[$i]}" "${TEST_NAMES[$i]}" "$((i+1))"
done

# Summary
echo ""
echo "=========================================="
echo -e "${BLUE}📊 TEST RESULTS SUMMARY${NC}"
echo "=========================================="

if [ ${#WORKING_URLS[@]} -gt 0 ]; then
    echo ""
    echo -e "${GREEN}✅ WORKING DATABASE URLs:${NC}"
    for i in "${!WORKING_URLS[@]}"; do
        IFS='|' read -r url name <<< "${WORKING_URLS[$i]}"
        echo "$((i+1)). $name"
        echo "   URL: $url"
        echo ""
    done
    
    echo -e "${GREEN}🎉 RECOMMENDATION:${NC}"
    echo "Add this to your .env file:"
    IFS='|' read -r first_working_url first_name <<< "${WORKING_URLS[0]}"
    echo "DATABASE_URL=\"$first_working_url\""
else
    echo ""
    echo -e "${RED}❌ NO WORKING DATABASE URLs FOUND${NC}"
fi

if [ ${#FAILED_URLS[@]} -gt 0 ]; then
    echo ""
    echo -e "${RED}❌ FAILED TESTS:${NC}"
    for failed in "${FAILED_URLS[@]}"; do
        echo "- $failed"
    done
fi

echo ""
echo -e "${YELLOW}📝 NOTES:${NC}"
echo "- If all tests fail, check your Supabase project status"
echo "- Verify the password and project ID are correct"
echo "- Ensure your IP is allowed in Supabase settings"
echo "- For production, consider using connection pooling (port 6543)"
echo ""
echo "✨ Testing completed!"
