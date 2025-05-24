#!/bin/bash

# Source the config file
source "$(dirname "$0")/config.sh"

if [[ ! -d "${PUBLIC_DIR}" && ! -d "${STORAGE_DIR}" ]]; then
    echo "Error: Directory ${PUBLIC_DIR} does not exist"
    exit 1
fi 

# Function to create symbolic link if it doesn't exist
create_link() {
    local source=$1
    local target=$2
    
    if [ -L "$target" ]; then
        echo "Symbolic link $target already exists"
    else
        ln -s "$source" "$target"
        echo "Created symbolic link: $target -> $source"
    fi
}

# Create symbolic links
create_link "${STORAGE_DIR}/guideline-images" "${PUBLIC_DIR}/guidelines"
create_link "${STORAGE_DIR}/generated-outputs" "${PUBLIC_DIR}/outputs"
create_link "${STORAGE_DIR}/face-sources" "${PUBLIC_DIR}/sources"
create_link "${STORAGE_DIR}/template-thumbnails" "${PUBLIC_DIR}/thumbnails"
create_link "${STORAGE_DIR}/template-videos" "${PUBLIC_DIR}/videos"
