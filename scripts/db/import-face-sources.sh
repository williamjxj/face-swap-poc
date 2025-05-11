#!/bin/bash

# Check if ImageMagick is installed
if ! command -v identify &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    exit 1
fi

# Directory containing the source images
SOURCES_DIR="/Users/william.jiang/my-experiments/face-swap-poc/public/sources"

# Check if directory exists
if [ ! -d "$SOURCES_DIR" ]; then
    echo "Error: Directory $SOURCES_DIR does not exist"
    exit 1
fi

# First, clear existing face sources
node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function clearFaceSources() {
        try {
            await prisma.faceSource.deleteMany({});
            console.log('Cleared existing face sources');
        } catch (error) {
            console.error('Error clearing face sources:', error);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    clearFaceSources();
"

# Process each image file (supporting common image formats)
for img in "$SOURCES_DIR"/*.{jpg,jpeg,png,webp}; do
    # Skip if no image files found
    [ -e "$img" ] || continue
    
    filename=$(basename "$img")
    echo "Processing $filename..."
    
    # Get image dimensions
    dimensions=$(identify -format "%wx%h" "$img")
    width=$(echo $dimensions | cut -d'x' -f1)
    height=$(echo $dimensions | cut -d'x' -f2)
    
    # Get file size in bytes
    filesize=$(stat -f%z "$img")
    
    # Get mime type
    mime_type=$(file --mime-type -b "$img")
    
    # Create file path
    file_path="/sources/${filename}"
    
    # Insert into database using Prisma
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createFaceSource() {
            try {
                await prisma.faceSource.create({
                    data: {
                        filename: '$filename',
                        width: $width,
                        height: $height,
                        filePath: '$file_path',
                        fileSize: BigInt('$filesize'),
                        mimeType: '$mime_type',
                        usageCount: 0,
                        isActive: true
                    }
                });
                console.log('Created face source record for $filename');
            } catch (error) {
                console.error('Error creating face source for $filename:', error);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createFaceSource();
    "
done

echo "Face source import completed!" 