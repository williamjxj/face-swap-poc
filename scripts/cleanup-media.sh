#!/bin/bash

# Source the config file
source "$(dirname "$0")/config.sh"

if [ ! -d "$PUBLIC_DIR" ]; then
    echo "Error: Directory $PUBLIC_DIR does not exist"
    exit 1
fi

# Clean up media files in public subfolders
echo "Cleaning up media files..."

# left-side upload
rm -rf "${PUBLIC_DIR}/videos/*"
rm -rf "${PUBLIC_DIR}/thumbnails/*"

# right-side upload
rm -rf "${PUBLIC_DIR}/sources/*"

echo "Media cleanup completed successfully!"
