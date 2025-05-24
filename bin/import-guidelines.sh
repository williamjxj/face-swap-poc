#!/bin/bash

source "$(dirname "$0")/config.sh"

# Check if directory exists
if [ ! -d "$GUIDELINES_DIR" ]; then
    echo "Error: Directory $GUIDELINES_DIR does not exist"
    exit 1
fi

# First, clear existing guidelines
node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    async function clearGuidelines() {
        try {
            await prisma.guideline.deleteMany({});
            console.log('Cleared existing guidelines');
        } catch (error) {
            console.error('Error clearing guidelines:', error);
        } finally {
            await prisma.\$disconnect();
        }
    }
    
    clearGuidelines();
"

# Process each PNG file
for img in "$GUIDELINES_DIR"/*.png; do
    # Skip if no PNG files found
    [ -e "$img" ] || continue
    
    filename=$(basename "$img")
    echo "Processing $filename..."
    
    # Get image dimensions using sips (built into macOS)
    dimensions=$(sips -g pixelWidth -g pixelHeight "$img")
    width=$(echo "$dimensions" | grep pixelWidth | awk '{print $2}')
    height=$(echo "$dimensions" | grep pixelHeight | awk '{print $2}')
    
    # Get file size in bytes using macOS stat
    filesize=$(stat -f%z "$img")
    
    # Get file type using file command
    file_type=$(file --mime-type -b "$img")
    
    # Create file path (relative to storage directory)
    file_path="/guidelines/${filename}"
    
    echo "Dimensions: ${width}x${height}"
    echo "File size: ${filesize} bytes"
    echo "File type: ${file_type}"
    
    # Insert into database using Prisma
    node -e "
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        async function createGuideline() {
            try {
                await prisma.guideline.create({
                    data: {
                        filename: '$filename',
                        width: $width,
                        height: $height,
                        fileType: '${file_type}',
                        filePath: '${file_path}',
                        fileSize: BigInt('${filesize}')
                    }
                });
                console.log('Created guideline record for $filename');
            } catch (error) {
                console.error('Error creating guideline for $filename:', error);
            } finally {
                await prisma.\$disconnect();
            }
        }
        
        createGuideline();
    "
done

echo "Guideline import completed!"