#!/bin/bash

# Check if ImageMagick is installed
if ! command -v identify &> /dev/null; then
    echo "ImageMagick is required but not installed. Please install it first."
    exit 1
fi

# Directory containing the PNG files
GUIDELINES_DIR="${HOME}/face-swap-poc/storage/guideline-images"

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
    
    # Get image dimensions
    dimensions=$(identify -format "%wx%h" "$img")
    width=$(echo $dimensions | cut -d'x' -f1)
    height=$(echo $dimensions | cut -d'x' -f2)
    
    # Get file size in bytes
    filesize=$(stat -c%s"$img")
    
    # Create file path
    file_path="/guidelines/${filename}"
    
    # Determine is_allowed based on filename prefix
    if [[ $filename =~ ^s ]]; then
        is_allowed="true"
    elif [[ $filename =~ ^f ]]; then
        is_allowed="false"
    else
        echo "Warning: Filename $filename doesn't start with 's' or 'f', skipping..."
        continue
    fi
    
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
                        fileType: 'image/png',
                        fileSize: BigInt('$filesize'),
                        filePath: '$file_path',
                        isAllowed: $is_allowed
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