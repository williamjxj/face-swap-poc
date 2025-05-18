#!/usr/bin/env bash

source "$(dirname "$0")/config.sh"

cd "${APP_DIR}/scripts" || exit 1

CAPTURE_TIME="00:00:01"         # Timestamp to capture frame (HH:MM:SS)
IMAGE_FORMAT="webp"             # webp, png, or jpeg
QUALITY=85                      # Quality (1-100)

# Create output directory if missing
mkdir -p "$THUMBNAIL_DIR"

# Loop through supported video types
shopt -s nullglob
for video in "${VIDEOS_DIR}"/*.{mp4,mov,avi,mkv}; do
    base=$(basename "$video")
    name="${base%.*}"
    output="$THUMBNAIL_DIR/${name}_thumbnail.${IMAGE_FORMAT}"

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
