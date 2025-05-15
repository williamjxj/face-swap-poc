#!/bin/bash

# Check if ffprobe is installed (part of ffmpeg)
if ! command -v ffprobe &> /dev/null; then
    echo "ffmpeg is required but not installed. Please install it first."
    exit 1
fi

# Directories containing the generated media files
OUTPUTS_DIR="${HOME}/face-swap-poc/public/outputs"

# Check if directory exists
if [ ! -d "$OUTPUTS_DIR" ]; then
    echo "Error: Directory $OUTPUTS_DIR does not exist"
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
            
            // Clear existing generated media
            await prisma.generatedMedia.deleteMany({});
            console.log('Cleared existing generated media');
        } catch (error) {
            console.error('Database error:', error.message);
            process.exit(1);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    checkDatabase();
"

# Process each media file (both MP4 and images)
for media in "$OUTPUTS_DIR"/*.{mp4,jpg,jpeg,png}; do
    # Skip if no media files found
    [ -e "$media" ] || continue
    
    filename=$(basename "$media")
    base_name="${filename%.*}"
    
    echo "Processing $filename..."
    
    # Get file size in bytes
    filesize=$(stat -c%s "$media")
    
    # Get mime type
    mime_type=$(file --mime-type -b "$media")
    
    # Determine media type based on extension
    if [[ "$filename" == *.mp4 ]]; then
        media_type="video"
        # Get video duration using ffprobe
        duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$media")
        # Round duration to nearest integer
        duration=$(printf "%.0f" "$duration")
    else
        media_type="image"
        duration=null
    fi
    
    # Create file path
    file_path="/outputs/${filename}"
    
    # Insert into database using Prisma
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createGeneratedMedia() {
            try {
                const result = await prisma.generatedMedia.create({
                    data: {
                        name: '$filename',
                        type: '$media_type',
                        filePath: '$file_path',
                        fileSize: BigInt('$filesize'),
                        isActive: true,
                        playCount: 0,
                        downloadCount: 0,
                        isPaid: false
                    }
                });
                console.log('Created generated media record for $filename');
            } catch (error) {
                console.error('Error creating generated media for $filename:', error.message);
                if (error.code === 'P2022') {
                    console.error('Database schema mismatch. Please run: npx prisma db push');
                }
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createGeneratedMedia();
    "
done

echo "Generated media import completed!" 
