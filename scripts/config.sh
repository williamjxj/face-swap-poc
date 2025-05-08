#!/usr/bin/env bash

# Base directories
APP_DIR=${HOME}/my-experiments/face-swap-poc
SOURCE_DIR=${APP_DIR}/public/sources
VIDEOS_DIR=${APP_DIR}/public/videos
THUMB_DIR=${APP_DIR}/public/thumbnails
OUTPUT_DIR=${APP_DIR}/outputs
DOWNLOAD_DIR=${APP_DIR}/downloads

# Source environment variables
source ${APP_DIR}/.env

# API endpoints from environment
CREATE_API=$MODAL_CREATE_API
QUERY_API=$MODAL_QUERY_API

# Ensure required directories exist
mkdir -p "$SOURCE_DIR" "$VIDEOS_DIR" "$THUMB_DIR" "$OUTPUT_DIR" "$DOWNLOAD_DIR"