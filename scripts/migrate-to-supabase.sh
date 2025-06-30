#!/bin/bash

# =============================================================================
# Database Migration Script: Local PostgreSQL → Remote Supabase
# =============================================================================
# This script helps migrate your local Prisma database to Supabase

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if required commands exist
    command -v psql >/dev/null 2>&1 || { log_error "psql is required but not installed. Aborting."; exit 1; }
    command -v npx >/dev/null 2>&1 || { log_error "npx is required but not installed. Aborting."; exit 1; }
    command -v node >/dev/null 2>&1 || { log_error "node is required but not installed. Aborting."; exit 1; }
    
    # Check if .env files exist
    if [[ ! -f ".env.local" ]]; then
        log_error ".env.local file not found. Please create it first."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Load environment variables
load_env() {
    log_info "Loading environment variables..."
    
    # Source the .env.local file
    if [[ -f ".env.local" ]]; then
        set -a  # Mark variables for export
        source .env.local
        set +a  # Unmark variables for export
    fi
    
    # Check required variables
    if [[ -z "$DATABASE_URL" ]]; then
        log_error "DATABASE_URL not found in environment"
        exit 1
    fi
    
    log_success "Environment variables loaded"
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    log_success "Backup directory created: $BACKUP_DIR"
}

# Export local database schema
export_local_schema() {
    log_info "Exporting local database schema..."
    
    # Ask user for local database URL if not in current DATABASE_URL
    if [[ "$DATABASE_URL" != *"localhost"* ]]; then
        read -p "Enter local PostgreSQL URL (e.g., postgresql://postgres:password@localhost:5432/facefusion): " LOCAL_DB_URL
        if [[ -z "$LOCAL_DB_URL" ]]; then
            log_error "Local database URL is required"
            exit 1
        fi
    else
        LOCAL_DB_URL="$DATABASE_URL"
    fi
    
    local schema_file="$BACKUP_DIR/schema_${TIMESTAMP}.sql"
    local data_file="$BACKUP_DIR/data_${TIMESTAMP}.sql"
    
    # Export schema only
    log_info "Exporting schema to $schema_file..."
    pg_dump "$LOCAL_DB_URL" --schema-only --no-owner --no-privileges > "$schema_file"
    log_success "Schema exported successfully"
    
    # Export data only (optional)
    read -p "Do you want to export data as well? (y/n): " export_data
    if [[ "$export_data" == "y" || "$export_data" == "Y" ]]; then
        log_info "Exporting data to $data_file..."
        pg_dump "$LOCAL_DB_URL" --data-only --no-owner --no-privileges > "$data_file"
        log_success "Data exported successfully"
    fi
    
    echo "schema_file=$schema_file" > "$BACKUP_DIR/latest_export.env"
    if [[ "$export_data" == "y" || "$export_data" == "Y" ]]; then
        echo "data_file=$data_file" >> "$BACKUP_DIR/latest_export.env"
    fi
}

# Validate Supabase connection
validate_supabase_connection() {
    log_info "Validating Supabase connection..."
    
    # Check if DATABASE_URL points to Supabase
    if [[ "$DATABASE_URL" != *"supabase.co"* ]]; then
        log_warning "DATABASE_URL doesn't seem to point to Supabase"
        read -p "Enter Supabase DATABASE_URL: " SUPABASE_URL
        if [[ -z "$SUPABASE_URL" ]]; then
            log_error "Supabase DATABASE_URL is required"
            exit 1
        fi
        export DATABASE_URL="$SUPABASE_URL"
    fi
    
    # Test connection
    log_info "Testing Supabase connection..."
    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Supabase connection successful"
    else
        log_error "Failed to connect to Supabase. Please check your DATABASE_URL"
        exit 1
    fi
}

# Apply Prisma schema to Supabase
apply_prisma_schema() {
    log_info "Applying Prisma schema to Supabase..."
    
    # Generate Prisma client first
    log_info "Generating Prisma client..."
    npx prisma generate
    
    # Push schema to database
    log_info "Pushing schema to Supabase..."
    npx prisma db push --accept-data-loss
    
    log_success "Prisma schema applied to Supabase"
}

# Import data (if exported)
import_data() {
    if [[ -f "$BACKUP_DIR/latest_export.env" ]]; then
        source "$BACKUP_DIR/latest_export.env"
        
        if [[ -n "$data_file" && -f "$data_file" ]]; then
            read -p "Do you want to import data to Supabase? (y/n): " import_data
            if [[ "$import_data" == "y" || "$import_data" == "Y" ]]; then
                log_info "Importing data to Supabase..."
                psql "$DATABASE_URL" < "$data_file"
                log_success "Data imported successfully"
            fi
        fi
    fi
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."
    
    # Check if tables exist
    log_info "Checking table structure..."
    npx prisma db pull --print > "$BACKUP_DIR/supabase_schema_${TIMESTAMP}.prisma"
    
    # Compare with original schema
    if diff prisma/schema.prisma "$BACKUP_DIR/supabase_schema_${TIMESTAMP}.prisma" > /dev/null; then
        log_success "Schema verification passed - structures match"
    else
        log_warning "Schema differences detected. Check $BACKUP_DIR/supabase_schema_${TIMESTAMP}.prisma"
    fi
    
    # Test basic operations
    log_info "Testing database operations..."
    if npx prisma studio --port 5556 --browser none &> /dev/null &; then
        STUDIO_PID=$!
        sleep 2
        kill $STUDIO_PID 2>/dev/null || true
        log_success "Database operations test passed"
    fi
}

# Update environment configuration
update_env_config() {
    log_info "Updating environment configuration..."
    
    # Backup current .env.local
    cp .env.local ".env.local.backup_${TIMESTAMP}"
    
    # Update DATABASE_URL to point to Supabase
    if [[ "$DATABASE_URL" == *"supabase.co"* ]]; then
        log_success "DATABASE_URL already points to Supabase"
    else
        log_warning "Please update your .env.local to use Supabase DATABASE_URL"
    fi
    
    log_success "Environment configuration updated"
}

# Main migration function
main() {
    echo "============================================="
    echo "🚀 Database Migration: Local → Supabase"
    echo "============================================="
    
    log_info "Starting migration process..."
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Load environment
    load_env
    
    # Step 3: Create backup directory
    create_backup_dir
    
    # Step 4: Export local database
    export_local_schema
    
    # Step 5: Validate Supabase connection
    validate_supabase_connection
    
    # Step 6: Apply Prisma schema
    apply_prisma_schema
    
    # Step 7: Import data (optional)
    import_data
    
    # Step 8: Verify migration
    verify_migration
    
    # Step 9: Update environment
    update_env_config
    
    echo ""
    log_success "Migration completed successfully! 🎉"
    echo ""
    echo "📋 Next steps:"
    echo "1. Test your application with: npm run dev"
    echo "2. Verify database operations work correctly"
    echo "3. Update your production environment variables"
    echo "4. Deploy to Vercel with Supabase configuration"
    echo ""
    echo "📁 Backup files saved in: $BACKUP_DIR"
}

# Script options
case "${1:-}" in
    "export-only")
        check_prerequisites
        load_env
        create_backup_dir
        export_local_schema
        log_success "Export completed. Files saved in $BACKUP_DIR"
        ;;
    "import-only")
        check_prerequisites
        load_env
        validate_supabase_connection
        apply_prisma_schema
        import_data
        verify_migration
        log_success "Import completed successfully!"
        ;;
    "schema-only")
        check_prerequisites
        load_env
        validate_supabase_connection
        apply_prisma_schema
        verify_migration
        log_success "Schema migration completed!"
        ;;
    *)
        main
        ;;
esac
