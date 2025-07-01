#!/bin/bash

# =============================================================================
# File Path Migration Script: Local Paths → Supabase Storage URLs
# =============================================================================
# This script updates database file paths from local public/ structure to Supabase Storage

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

# Load environment variables
load_env() {
    if [[ -f ".env.local" ]]; then
        set -a
        source .env.local
        set +a
    fi
    
    if [[ -f ".env" ]]; then
        set -a
        source .env
        set +a
    fi
}

# Main migration function
migrate_file_paths() {
    log_info "Starting file path migration to Supabase Storage URLs..."
    
    # Create Node.js script for database updates
    cat > "migrate_paths.js" << 'EOF'
const { db } = require('./src/lib/db.js');

// Mapping of old local paths to new Supabase Storage bucket structure
const pathMappings = {
  '/outputs/': 'generated-outputs/',
  '/videos/': 'template-videos/',
  '/thumbnails/': 'template-thumbnails/', 
  '/sources/': 'face-sources/',
  '/guidelines/': 'guideline-images/',
  '/assets/': 'assets/'
};

// Function to convert local path to Supabase Storage path
function convertPath(oldPath) {
  if (!oldPath) return null;
  
  for (const [localPrefix, bucketPrefix] of Object.entries(pathMappings)) {
    if (oldPath.startsWith(localPrefix)) {
      return oldPath.replace(localPrefix, bucketPrefix);
    }
  }
  
  // If no mapping found, check if it's already in correct format
  if (oldPath.includes('/')) {
    const segments = oldPath.split('/');
    const filename = segments[segments.length - 1];
    
    // Try to guess the bucket based on file extension
    const ext = filename.split('.').pop().toLowerCase();
    if (['mp4', 'avi', 'mov', 'webm'].includes(ext)) {
      if (oldPath.includes('template') || oldPath.includes('video')) {
        return `template-videos/${filename}`;
      } else {
        return `generated-outputs/${filename}`;
      }
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      if (oldPath.includes('source') || oldPath.includes('face')) {
        return `face-sources/${filename}`;
      } else if (oldPath.includes('thumbnail')) {
        return `template-thumbnails/${filename}`;
      } else if (oldPath.includes('guideline')) {
        return `guideline-images/${filename}`;
      } else {
        return `assets/${filename}`;
      }
    }
  }
  
  return oldPath; // Return as-is if can't determine
}

async function migrateFilePaths() {
  try {
    console.log('🚀 Starting file path migration...');
    
    // 1. Update GeneratedMedia table
    console.log('\n📁 Updating GeneratedMedia file paths...');
    const generatedMedia = await db.generatedMedia.findMany({
      select: { id: true, filePath: true, tempPath: true, name: true }
    });
    
    let generatedUpdated = 0;
    for (const item of generatedMedia) {
      const newFilePath = convertPath(item.filePath);
      const newTempPath = item.tempPath ? convertPath(item.tempPath) : null;
      
      if (newFilePath !== item.filePath || newTempPath !== item.tempPath) {
        await db.generatedMedia.update({
          where: { id: item.id },
          data: {
            filePath: newFilePath,
            ...(item.tempPath && { tempPath: newTempPath })
          }
        });
        
        console.log(`  ✅ ${item.name}: ${item.filePath} → ${newFilePath}`);
        generatedUpdated++;
      }
    }
    console.log(`📊 GeneratedMedia: ${generatedUpdated} records updated`);
    
    // 2. Update TargetTemplate table
    console.log('\n📁 Updating TargetTemplate file paths...');
    const templates = await db.targetTemplate.findMany({
      select: { id: true, filePath: true, thumbnailPath: true, filename: true }
    });
    
    let templatesUpdated = 0;
    for (const item of templates) {
      const newFilePath = convertPath(item.filePath);
      const newThumbnailPath = item.thumbnailPath ? convertPath(item.thumbnailPath) : null;
      
      if (newFilePath !== item.filePath || newThumbnailPath !== item.thumbnailPath) {
        await db.targetTemplate.update({
          where: { id: item.id },
          data: {
            filePath: newFilePath,
            ...(item.thumbnailPath && { thumbnailPath: newThumbnailPath })
          }
        });
        
        console.log(`  ✅ ${item.filename}: ${item.filePath} → ${newFilePath}`);
        if (item.thumbnailPath) {
          console.log(`    📷 Thumbnail: ${item.thumbnailPath} → ${newThumbnailPath}`);
        }
        templatesUpdated++;
      }
    }
    console.log(`📊 TargetTemplate: ${templatesUpdated} records updated`);
    
    // 3. Update FaceSource table
    console.log('\n📁 Updating FaceSource file paths...');
    const faceSources = await db.faceSource.findMany({
      select: { id: true, filePath: true, filename: true }
    });
    
    let faceSourcesUpdated = 0;
    for (const item of faceSources) {
      const newFilePath = convertPath(item.filePath);
      
      if (newFilePath !== item.filePath) {
        await db.faceSource.update({
          where: { id: item.id },
          data: { filePath: newFilePath }
        });
        
        console.log(`  ✅ ${item.filename}: ${item.filePath} → ${newFilePath}`);
        faceSourcesUpdated++;
      }
    }
    console.log(`📊 FaceSource: ${faceSourcesUpdated} records updated`);
    
    // 4. Update Guideline table (if exists)
    console.log('\n📁 Updating Guideline file paths...');
    try {
      const guidelines = await db.guideline.findMany({
        select: { id: true, filePath: true, filename: true }
      });
      
      let guidelinesUpdated = 0;
      for (const item of guidelines) {
        const newFilePath = convertPath(item.filePath);
        
        if (newFilePath !== item.filePath) {
          await db.guideline.update({
            where: { id: item.id },
            data: { filePath: newFilePath }
          });
          
          console.log(`  ✅ ${item.filename}: ${item.filePath} → ${newFilePath}`);
          guidelinesUpdated++;
        }
      }
      console.log(`📊 Guideline: ${guidelinesUpdated} records updated`);
    } catch (error) {
      console.log('⚠️  Guideline table not found or empty');
    }
    
    console.log('\n✅ File path migration completed successfully!');
    console.log(`📊 Total updates: ${generatedUpdated + templatesUpdated + faceSourcesUpdated} records`);
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

migrateFilePaths().catch(console.error);
EOF

    # Run the migration
    log_info "Running database path updates..."
    if node migrate_paths.js; then
        log_success "Database file paths updated successfully!"
    else
        log_error "Database migration failed"
        exit 1
    fi
    
    # Clean up
    rm migrate_paths.js
    log_success "Migration script completed!"
}

# Create Supabase Storage helper utilities
create_storage_utils() {
    log_info "Creating Supabase Storage utility functions..."
    
    cat > "src/utils/storage-helper.js" << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing Supabase key environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Bucket mapping for different file types
export const STORAGE_BUCKETS = {
  GENERATED_OUTPUTS: 'generated-outputs',
  TEMPLATE_VIDEOS: 'template-videos', 
  TEMPLATE_THUMBNAILS: 'template-thumbnails',
  FACE_SOURCES: 'face-sources',
  GUIDELINE_IMAGES: 'guideline-images',
  ASSETS: 'assets'
}

/**
 * Get the full public URL for a file in Supabase Storage
 * @param {string} filePath - The file path in the bucket (e.g., "generated-outputs/video.mp4")
 * @returns {string} Full public URL
 */
export function getStorageUrl(filePath) {
  if (!filePath) return null
  
  // If it's already a full URL, return as-is
  if (filePath.startsWith('http')) {
    return filePath
  }
  
  // Extract bucket and path
  const [bucket, ...pathParts] = filePath.split('/')
  const path = pathParts.join('/')
  
  if (!bucket || !path) {
    console.warn('Invalid file path format:', filePath)
    return null
  }
  
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Get a signed URL for private files (if needed)
 * @param {string} filePath - The file path in the bucket
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl(filePath, expiresIn = 3600) {
  if (!filePath) return null
  
  const [bucket, ...pathParts] = filePath.split('/')
  const path = pathParts.join('/')
  
  if (!bucket || !path) {
    console.warn('Invalid file path format:', filePath)
    return null
  }
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
    
  if (error) {
    console.error('Error creating signed URL:', error)
    return null
  }
  
  return data.signedUrl
}

/**
 * Upload a file to Supabase Storage
 * @param {File|Buffer} file - The file to upload
 * @param {string} filePath - The destination path (e.g., "generated-outputs/video.mp4")
 * @param {Object} options - Upload options
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function uploadFile(file, filePath, options = {}) {
  try {
    const [bucket, ...pathParts] = filePath.split('/')
    const path = pathParts.join('/')
    
    if (!bucket || !path) {
      return { success: false, error: 'Invalid file path format' }
    }
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: options.overwrite || false,
        ...options
      })
      
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} filePath - The file path to delete
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(filePath) {
  try {
    const [bucket, ...pathParts] = filePath.split('/')
    const path = pathParts.join('/')
    
    if (!bucket || !path) {
      return { success: false, error: 'Invalid file path format' }
    }
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])
      
    if (error) {
      return { success: false, error: error.message }
    }
    
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
EOF

    log_success "Supabase Storage utilities created!"
}

# Update application code to use new storage system
update_app_code() {
    log_info "Updating application code to use Supabase Storage..."
    
    # This will be done in separate steps after running this script
    log_warning "Manual code updates needed:"
    echo "  1. Update components to use getStorageUrl() function"
    echo "  2. Update file upload logic to use uploadFile() function"  
    echo "  3. Update file deletion logic to use deleteFile() function"
    echo "  4. Replace hardcoded /public/ paths with storage URLs"
}

# Main execution
main() {
    echo "============================================="
    echo "🔄 File Path Migration: Local → Supabase Storage"
    echo "============================================="
    
    load_env
    migrate_file_paths
    create_storage_utils
    update_app_code
    
    echo ""
    log_success "Migration completed! 🎉"
    echo ""
    echo "📋 Next steps:"
    echo "1. Update your React components to use getStorageUrl() for displaying files"
    echo "2. Update file upload components to use uploadFile() function"
    echo "3. Test that all images and videos display correctly" 
    echo "4. Deploy the updated application"
}

main
