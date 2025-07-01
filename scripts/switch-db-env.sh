#!/bin/bash

# =============================================================================
# Database Environment Switcher Script
# =============================================================================
# Quickly switch between Local PostgreSQL and Remote Supabase configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
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

log_header() {
    echo -e "${PURPLE}🔄 $1${NC}"
}

# Check current configuration
check_current_config() {
    if [[ -f ".env.local" ]]; then
        local current_db=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '"')
        
        if [[ "$current_db" == *"localhost"* ]]; then
            echo -e "${GREEN}Current: Local PostgreSQL${NC}"
        elif [[ "$current_db" == *"supabase.co"* ]]; then
            echo -e "${BLUE}Current: Remote Supabase${NC}"
        else
            echo -e "${YELLOW}Current: Unknown/Custom${NC}"
        fi
        echo "Database URL: $current_db"
    else
        echo -e "${RED}No .env.local file found${NC}"
    fi
}

# Switch to Local PostgreSQL
switch_to_local() {
    log_header "Switching to Local PostgreSQL..."
    
    # Backup current config
    if [[ -f ".env.local" ]]; then
        cp .env.local .env.local.backup.$(date +%s)
        log_info "Current config backed up"
    fi
    
    # Create new .env.local for local PostgreSQL
    cat > .env.local << 'EOF'
# =============================================================================
# Local PostgreSQL Configuration
# =============================================================================

# Database Configuration
DATABASE_URL="postgresql://postgres:William1!@localhost:5432/facefusion"

# Next.js Configuration
NODE_ENV=development
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret-key"

# OAuth Providers (Development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"

# Modal API Configuration (Development)
MODAL_CREATE_API="http://localhost:8000/create"
MODAL_QUERY_API="http://localhost:8000/query"

# Storage Configuration
STORAGE_PATH="./storage"
EOF
    
    log_success "Switched to Local PostgreSQL configuration"
    log_info "Please update the database credentials in .env.local if needed"
}

# Switch to Remote Supabase
switch_to_supabase() {
    log_header "Switching to Remote Supabase..."
    
    # Backup current config
    if [[ -f ".env.local" ]]; then
        cp .env.local .env.local.backup.$(date +%s)
        log_info "Current config backed up"
    fi
    
    # Check if we have existing Supabase config
    local supabase_url=""
    local supabase_anon_key=""
    local supabase_db_url=""
    
    if [[ -f ".env" ]]; then
        supabase_url=$(grep "^NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' || echo "")
        supabase_anon_key=$(grep "^NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2- | tr -d '"' || echo "")
        supabase_db_url=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"' || echo "")
    fi
    
    # Create new .env.local for Supabase
    cat > .env.local << EOF
# =============================================================================
# Remote Supabase Configuration
# =============================================================================

# Database Configuration (Supabase)
DATABASE_URL="${supabase_db_url:-postgresql://postgres:William1!@db.[PROJECT-ID].supabase.co:5432/postgres}"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="${supabase_url:-https://[PROJECT-ID].supabase.co}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${supabase_anon_key:-[SUPABASE-ANON-KEY]}"
SUPABASE_SERVICE_ROLE_KEY="[SUPABASE-SERVICE-ROLE-KEY]"

# Next.js Configuration
NODE_ENV=development
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="local-development-secret-key"

# OAuth Providers (Development)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"

# Modal API Configuration (Development)
MODAL_CREATE_API="https://your-modal-api.com/create"
MODAL_QUERY_API="https://your-modal-api.com/query"

# Storage Configuration
STORAGE_PATH="./storage"
EOF
    
    log_success "Switched to Remote Supabase configuration"
    log_warning "Please update the Supabase credentials in .env.local:"
    echo "  - DATABASE_URL with your Supabase database URL"
    echo "  - NEXT_PUBLIC_SUPABASE_URL with your Supabase project URL"
    echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY with your anon key"
    echo "  - SUPABASE_SERVICE_ROLE_KEY with your service role key"
}

# Validate current configuration
validate_config() {
    log_info "Validating current configuration..."
    
    if [[ ! -f ".env.local" ]]; then
        log_error ".env.local file not found"
        return 1
    fi
    
    # Load environment variables
    set -a
    source .env.local
    set +a
    
    # Check required variables
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL not set"
        return 1
    fi
    
    if [[ -z "$NEXTAUTH_URL" ]]; then
        log_error "NEXTAUTH_URL not set"
        return 1
    fi
    
    # Test database connection
    log_info "Testing database connection..."
    if command -v npx >/dev/null 2>&1; then
        if npx prisma db pull --print > /dev/null 2>&1; then
            log_success "Database connection successful"
        else
            log_error "Database connection failed"
            return 1
        fi
    else
        log_warning "npx not available, skipping database test"
    fi
    
    log_success "Configuration validation passed"
}

# Generate Prisma client
generate_client() {
    log_info "Generating Prisma client..."
    
    if command -v npx >/dev/null 2>&1; then
        npx prisma generate
        log_success "Prisma client generated"
    else
        log_error "npx not available"
        return 1
    fi
}

# Show usage
show_usage() {
    echo "Database Environment Switcher"
    echo ""
    echo "Usage: $0 [option]"
    echo ""
    echo "Options:"
    echo "  local     - Switch to Local PostgreSQL"
    echo "  supabase  - Switch to Remote Supabase"
    echo "  status    - Show current configuration"
    echo "  validate  - Validate current configuration"
    echo "  help      - Show this help"
    echo ""
    echo "Interactive mode (no arguments): Choose from menu"
}

# Interactive menu
interactive_menu() {
    echo "============================================="
    echo "🔄 Database Environment Switcher"
    echo "============================================="
    echo ""
    
    check_current_config
    echo ""
    
    echo "Choose your target environment:"
    echo "1) Local PostgreSQL"
    echo "2) Remote Supabase"
    echo "3) Show current status"
    echo "4) Validate configuration"
    echo "5) Exit"
    echo ""
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            switch_to_local
            generate_client
            ;;
        2)
            switch_to_supabase
            echo ""
            read -p "Generate Prisma client now? (y/n): " gen_client
            if [[ "$gen_client" == "y" || "$gen_client" == "Y" ]]; then
                generate_client
            fi
            ;;
        3)
            check_current_config
            ;;
        4)
            validate_config
            ;;
        5)
            echo "Goodbye! 👋"
            exit 0
            ;;
        *)
            log_error "Invalid option"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "Next steps:"
    echo "  1. Update credentials in .env.local if needed"
    echo "  2. Run: npm run dev"
    echo "  3. Test your application"
}

# Main script logic
case "${1:-}" in
    "local")
        switch_to_local
        generate_client
        ;;
    "supabase")
        switch_to_supabase
        ;;
    "status")
        check_current_config
        ;;
    "validate")
        validate_config
        ;;
    "help"|"-h"|"--help")
        show_usage
        ;;
    "")
        interactive_menu
        ;;
    *)
        log_error "Unknown option: $1"
        show_usage
        exit 1
        ;;
esac
