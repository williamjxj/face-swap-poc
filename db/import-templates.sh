#!/bin/bash

# Check if ffprobe is installed (part of ffmpeg)
if ! command -v ffprobe &> /dev/null; then
    echo "ffmpeg is required but not installed. Please install it first."
    exit 1
fi

source "$(dirname "$0")/config.sh"

# Check if directories exist
if [ ! -d "$VIDEOS_DIR" ]; then
    echo "Error: Directory $VIDEOS_DIR does not exist"
    exit 1
fi

if [ ! -d "$THUMBNAIL_DIR" ]; then
    echo "Error: Directory $THUMBNAIL_DIR does not exist"
    exit 1
fi

# First, ensure database is ready
echo "Checking database connection..."
node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function checkDatabase() {
        try {
            // Try to query the database
            await prisma.\$queryRaw\`SELECT 1\`;
            console.log('Database connection successful');
            
            // Clear existing templates
            await prisma.targetTemplate.deleteMany({});
            console.log('Cleared existing templates');
        } catch (error) {
            console.error('Database error:', error.message);
            process.exit(1);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkDatabase();
"

# Process each video file (both MP4 and WAV)
for video in "$VIDEOS_DIR"/*.{mp4,wav}; do
    # Skip if no video files found
    [ -e "$video" ] || continue
    
    filename=$(basename "$video")
    base_name="${filename%.*}"
    thumbnail_name="${base_name}_thumbnail.webp"
    thumbnail_path="$THUMBNAIL_DIR/$thumbnail_name"
    
    # Check if corresponding thumbnail exists
    if [ ! -f "$thumbnail_path" ]; then
        echo "Warning: No thumbnail found for $filename, skipping..."
        continue
    fi
    
    echo "Processing $filename..."
    
    # Get video duration using ffprobe
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$video")
    # Round duration to nearest integer
    duration=$(printf "%.0f" "$duration")
    
    # Get file size in bytes using macOS stat
    filesize=$(stat -f%z "$video")
    
    # Get mime type
    mime_type=$(file --mime-type -b "$video")
    
    # Create file paths
    video_path="/videos/${filename}"
    thumbnail_path="/thumbnails/${thumbnail_name}"
    
    # Insert into database using Prisma
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createTemplate() {
            try {
                const result = await prisma.targetTemplate.create({
                    data: {
                        filename: '$filename',
                        type: 'video',
                        filePath: '$video_path',
                        thumbnailPath: '$thumbnail_path',
                        fileSize: BigInt('$filesize'),
                        duration: $duration,
                        mimeType: '$mime_type',
                        usageCount: 0,
                        isActive: true
                    }
                });
                console.log('Created template record for $filename');
            } catch (error) {
                console.error('Error creating template for $filename:', error.message);
                if (error.code === 'P2022') {
                    console.error('Database schema mismatch. Please run: npx prisma db push');
                }
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createTemplate();
    "
done

echo "Template import completed!" 