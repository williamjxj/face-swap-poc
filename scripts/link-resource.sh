#!/bin/bash

APP_DIR=${HOME}/face-swap-poc

cd "${APP_DIR}" || exit 1

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
create_link "storage/guideline-images" "public/guidelines"
create_link "storage/generated-outputs" "public/outputs"
create_link "storage/face-sources" "public/sources"
create_link "storage/template-thumbnails" "public/thumbnails"
create_link "storage/template-videos" "public/videos"
create_link "storage/assets" "src/assets"