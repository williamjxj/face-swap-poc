#!/usr/bin/env bash

# Configuration
BASE_DIR="${HOME}/face-swap-poc/public"
INPUT_DIR="${BASE_DIR}/videos"            # Folder where your videos live
OUTPUT_DIR="${BASE_DIR}/thumbnails"       # Folder where thumbnails will be saved
CAPTURE_TIME="00:00:01"         # Timestamp to capture frame (HH:MM:SS)
IMAGE_FORMAT="webp"             # webp, png, or jpeg
QUALITY=85                      # Quality (1-100)

# Create output directory if missing
mkdir -p "$OUTPUT_DIR"

# Loop through supported video types
shopt -s nullglob
for video in "$INPUT_DIR"/*.{mp4,mov,avi,mkv}; do
    # Build output filename
    base=$(basename "$video")
    name="${base%.*}"
    output="$OUTPUT_DIR/${name}_thumbnail.${IMAGE_FORMAT}"

    # Run ffmpeg quietly
    ffmpeg -ss "$CAPTURE_TIME" -i "$video" \
        -frames:v 1 -qscale:v "$QUALITY" \
        -y "$output"

    if [[ $? -eq 0 ]]; then
        echo "Captured thumbnail: $output"
    else
        echo "Failed to capture thumbnail for: $video" >&2
    fi
done
shopt -u nullglob
