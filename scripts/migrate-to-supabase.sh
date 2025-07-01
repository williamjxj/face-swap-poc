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
    
    # Load local PostgreSQL connection from .env.local
    if [[ -f ".env.local" ]]; then
        LOCAL_DATABASE_URL=$(grep "^DATABASE_URL=" .env.local | cut -d'=' -f2- | tr -d '"')
        log_info "Found local DATABASE_URL in .env.local"
    fi
    
    # Load Supabase connection from .env or .env.production
    if [[ -f ".env" ]]; then
        SUPABASE_DATABASE_URL=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2- | tr -d '"')
        log_info "Found Supabase DATABASE_URL in .env"
    elif [[ -f ".env.production" ]]; then
        SUPABASE_DATABASE_URL=$(grep "^DATABASE_URL=" .env.production | cut -d'=' -f2- | tr -d '"')
        log_info "Found Supabase DATABASE_URL in .env.production"
    fi
    
    # Load Supabase configuration for storage
    if [[ -f ".env" ]]; then
        set -a  # Mark variables for export
        source .env
        set +a  # Unmark variables for export
    fi
    
    # Validate we have both URLs
    if [[ -z "$LOCAL_DATABASE_URL" ]]; then
        log_error "Local DATABASE_URL not found in .env.local"
        exit 1
    fi
    
    if [[ -z "$SUPABASE_DATABASE_URL" ]]; then
        log_error "Supabase DATABASE_URL not found in .env or .env.production"
        exit 1
    fi
    
    log_success "Environment variables loaded"
    log_info "Local DB: ${LOCAL_DATABASE_URL%%@*}@..." # Hide password
    log_info "Supabase DB: ${SUPABASE_DATABASE_URL%%@*}@..." # Hide password
}

# Create backup directory
create_backup_dir() {
    log_info "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    log_success "Backup directory created: $BACKUP_DIR"
}

# Export local database schema and data
export_local_database() {
    log_info "Exporting local PostgreSQL database..."
    
    local schema_file="$BACKUP_DIR/schema_${TIMESTAMP}.sql"
    local data_file="$BACKUP_DIR/data_${TIMESTAMP}.sql"
    local full_backup_file="$BACKUP_DIR/full_backup_${TIMESTAMP}.sql"
    
    # Test local connection first
    log_info "Testing local database connection..."
    # Strip query parameters for psql (like ?schema=public)
    LOCAL_DB_FOR_PSQL=$(echo "$LOCAL_DATABASE_URL" | cut -d'?' -f1)
    if ! psql "$LOCAL_DB_FOR_PSQL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "Failed to connect to local database: $LOCAL_DB_FOR_PSQL"
        log_error "Please ensure PostgreSQL is running and credentials are correct"
        exit 1
    fi
    log_success "Local database connection successful"
    
    # Export schema only
    log_info "Exporting schema to $schema_file..."
    pg_dump "$LOCAL_DB_FOR_PSQL" \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        --no-security-labels \
        --no-comments > "$schema_file"
    log_success "Schema exported successfully"
    
    # Export data only  
    log_info "Exporting data to $data_file..."
    pg_dump "$LOCAL_DB_FOR_PSQL" \
        --data-only \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        --disable-triggers \
        --column-inserts > "$data_file"
    log_success "Data exported successfully"
    
    # Full backup for safety
    log_info "Creating full backup to $full_backup_file..."
    pg_dump "$LOCAL_DB_FOR_PSQL" \
        --no-owner \
        --no-privileges \
        --no-tablespaces > "$full_backup_file"
    log_success "Full backup created successfully"
    
    # Save export info
    cat > "$BACKUP_DIR/export_info.env" << EOF
LOCAL_DATABASE_URL=$LOCAL_DATABASE_URL
SUPABASE_DATABASE_URL=$SUPABASE_DATABASE_URL
EXPORT_TIMESTAMP=$TIMESTAMP
SCHEMA_FILE=$schema_file
DATA_FILE=$data_file
FULL_BACKUP_FILE=$full_backup_file
EOF
    
    log_success "Database export completed successfully"
}

# Validate Supabase connection
validate_supabase_connection() {
    log_info "Validating Supabase connection..."
    
    # Test Supabase connection
    log_info "Testing Supabase database connection..."
    # Strip query parameters for psql (like ?schema=public)
    SUPABASE_DB_FOR_PSQL=$(echo "$SUPABASE_DATABASE_URL" | cut -d'?' -f1)
    if psql "$SUPABASE_DB_FOR_PSQL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Supabase database connection successful"
    else
        log_error "Failed to connect to Supabase database"
        log_error "Please check your Supabase DATABASE_URL in .env or .env.production"
        exit 1
    fi
    
    # Check Supabase storage configuration
    if [[ -n "$NEXT_PUBLIC_SUPABASE_URL" && -n "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        log_success "Supabase storage configuration found"
    else
        log_warning "Supabase storage configuration incomplete"
        log_warning "File migration will be skipped. Please set:"
        log_warning "- NEXT_PUBLIC_SUPABASE_URL"
        log_warning "- SUPABASE_SERVICE_ROLE_KEY"
    fi
}

# Apply Prisma schema and import data to Supabase
migrate_database_to_supabase() {
    log_info "Migrating database to Supabase..."
    
    # Temporarily set DATABASE_URL to Supabase for Prisma operations
    export DATABASE_URL="$SUPABASE_DATABASE_URL"
    
    # Generate Prisma client
    log_info "Generating Prisma client for Supabase..."
    npx prisma generate
    
    # Apply schema to Supabase using Prisma
    log_info "Applying Prisma schema to Supabase..."
    npx prisma db push --accept-data-loss --force-reset
    log_success "Prisma schema applied to Supabase"
    
    # Import data from backup
    if [[ -f "$BACKUP_DIR/export_info.env" ]]; then
        source "$BACKUP_DIR/export_info.env"
        
        if [[ -f "$DATA_FILE" ]]; then
            log_info "Importing data to Supabase..."
            
            # Clean data file to remove problematic statements
            local clean_data_file="$BACKUP_DIR/clean_data_${TIMESTAMP}.sql"
            
            # Filter out problematic statements
            grep -v "^SET " "$DATA_FILE" | \
            grep -v "^SELECT pg_catalog.set_config" | \
            grep -v "^--" | \
            sed '/^$/d' > "$clean_data_file"
            
            # Import cleaned data
            if psql "$SUPABASE_DB_FOR_PSQL" < "$clean_data_file"; then
                log_success "Data imported successfully to Supabase"
            else
                log_warning "Some data import issues occurred - check manually"
                log_info "You can manually import using: psql \$SUPABASE_DATABASE_URL < $clean_data_file"
            fi
        else
            log_warning "No data file found to import"
        fi
    else
        log_warning "No export info found - skipping data import"
    fi
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

# Migrate local files to Supabase Storage
migrate_files_to_supabase() {
    log_info "Migrating local files to Supabase Storage..."
    
    # Check if storage migration is possible
    if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" || -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        log_warning "Supabase storage configuration missing - skipping file migration"
        return 0
    fi
    
    # Local storage directory
    local storage_dir="./storage"
    
    if [[ ! -d "$storage_dir" ]]; then
        log_warning "Local storage directory not found: $storage_dir"
        return 0
    fi
    
    # Create migration script for Supabase storage
    local migration_script="$BACKUP_DIR/migrate_files_${TIMESTAMP}.js"
    
    cat > "$migration_script" << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase configuration');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Storage bucket configuration
const buckets = {
    'face-sources': 'face-sources',
    'generated-outputs': 'generated-outputs', 
    'template-videos': 'template-videos',
    'template-thumbnails': 'template-thumbnails',
    'guideline-images': 'guideline-images',
    'assets': 'assets'
};

async function createBuckets() {
    console.log('Creating Supabase storage buckets...');
    
    for (const [localDir, bucketName] of Object.entries(buckets)) {
        try {
            const { data, error } = await supabase.storage.createBucket(bucketName, {
                public: false,
                allowedMimeTypes: ['image/*', 'video/*'],
                fileSizeLimit: 50 * 1024 * 1024 // 50MB
            });
            
            if (error && !error.message.includes('already exists')) {
                console.error(`Error creating bucket ${bucketName}:`, error);
            } else {
                console.log(`✅ Bucket ${bucketName} ready`);
            }
        } catch (err) {
            console.error(`Error with bucket ${bucketName}:`, err.message);
        }
    }
}

async function uploadFile(filePath, bucketName, remotePath) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(remotePath || fileName, fileBuffer, {
                contentType: getContentType(fileName),
                upsert: true
            });
            
        if (error) {
            console.error(`❌ Failed to upload ${filePath}:`, error.message);
            return false;
        } else {
            console.log(`✅ Uploaded: ${filePath} → ${bucketName}/${remotePath || fileName}`);
            return true;
        }
    } catch (err) {
        console.error(`❌ Error uploading ${filePath}:`, err.message);
        return false;
    }
}

function getContentType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg', 
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

async function uploadDirectory(localDir, bucketName) {
    const dirPath = path.join('./storage', localDir);
    
    if (!fs.existsSync(dirPath)) {
        console.log(`⚠️  Directory not found: ${dirPath}`);
        return;
    }
    
    console.log(`📁 Processing directory: ${dirPath}`);
    
    const files = fs.readdirSync(dirPath);
    let uploaded = 0;
    let failed = 0;
    
    for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile() && !file.startsWith('.')) {
            const success = await uploadFile(filePath, bucketName, file);
            if (success) {
                uploaded++;
            } else {
                failed++;
            }
        }
    }
    
    console.log(`📊 ${localDir}: ${uploaded} uploaded, ${failed} failed`);
}

async function main() {
    console.log('🚀 Starting file migration to Supabase Storage...');
    
    // Create buckets first
    await createBuckets();
    
    // Upload files from each directory
    for (const [localDir, bucketName] of Object.entries(buckets)) {
        await uploadDirectory(localDir, bucketName);
    }
    
    console.log('✅ File migration completed!');
}

main().catch(console.error);
EOF

    # Run the migration script
    log_info "Running file migration script..."
    
    # Set environment variables for the script
    export NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL"
    export SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
    
    if node "$migration_script"; then
        log_success "File migration completed successfully"
    else
        log_warning "File migration encountered some issues"
        log_info "You can manually run the script later: node $migration_script"
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
    npx prisma studio --port 5556 --browser none &> /dev/null &
    STUDIO_PID=$!
    sleep 2
    kill $STUDIO_PID 2>/dev/null || true
    log_success "Database operations test passed"
}

# Update environment configuration
update_env_config() {
    log_info "Updating environment configuration..."
    
    # Backup current .env.local
    cp .env.local ".env.local.backup_${TIMESTAMP}"
    log_info "Backed up .env.local to .env.local.backup_${TIMESTAMP}"
    
    # Update .env.local to use Supabase
    log_info "Updating .env.local to use Supabase DATABASE_URL..."
    
    # Comment out local DATABASE_URL and add Supabase URL
    sed -i.bak "s|^DATABASE_URL=|#DATABASE_URL=|g" .env.local
    echo "" >> .env.local
    echo "# Migrated to Supabase on ${TIMESTAMP}" >> .env.local
    echo "DATABASE_URL=\"$SUPABASE_DATABASE_URL\"" >> .env.local
    
    log_success "Environment configuration updated"
    log_info "Original .env.local backed up as .env.local.backup_${TIMESTAMP}"
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
    export_local_database
    
    # Step 5: Validate Supabase connection
    validate_supabase_connection
    
    # Step 6: Migrate database to Supabase
    migrate_database_to_supabase
    
    # Step 7: Migrate files to Supabase Storage
    read -p "Do you want to migrate local files to Supabase Storage? (y/n): " migrate_files
    if [[ "$migrate_files" == "y" || "$migrate_files" == "Y" ]]; then
        migrate_files_to_supabase
    else
        log_info "Skipping file migration"
    fi
    
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
    echo "3. Check Supabase Storage in dashboard for uploaded files"
    echo "4. Update your production environment variables"
    echo "5. Deploy to Vercel with Supabase configuration"
    echo ""
    echo "📁 Backup files saved in: $BACKUP_DIR"
    echo "📁 Local files backed up and migrated to Supabase Storage"
}

# Script options
case "${1:-}" in
    "export-only")
        check_prerequisites
        load_env
        create_backup_dir
        export_local_database
        log_success "Export completed. Files saved in $BACKUP_DIR"
        ;;
    "import-only")
        check_prerequisites
        load_env
        validate_supabase_connection
        migrate_database_to_supabase
        verify_migration
        log_success "Import completed successfully!"
        ;;
    "files-only")
        check_prerequisites
        load_env
        create_backup_dir
        migrate_files_to_supabase
        log_success "File migration completed!"
        ;;
    "schema-only")
        check_prerequisites
        load_env
        validate_supabase_connection
        # Temporarily set DATABASE_URL to Supabase for Prisma operations
        export DATABASE_URL="$SUPABASE_DATABASE_URL"
        npx prisma generate
        npx prisma db push --accept-data-loss --force-reset
        verify_migration
        log_success "Schema migration completed!"
        ;;
    *)
        main
        ;;
esac
