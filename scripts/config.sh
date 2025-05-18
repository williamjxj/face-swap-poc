#!/usr/bin/env bash

# Base directories
APP_DIR=${HOME}/face-swap-poc
PUBLIC_DIR=${APP_DIR}/public
SOURCE_DIR=${PUBLIC_DIR}/sources
VIDEOS_DIR=${PUBLIC_DIR}/videos
THUMBNAIL_DIR=${PUBLIC_DIR}/thumbnails
OUTPUT_DIR=${PUBLIC_DIR}/outputs
ASSET_DIR=${APP_DIR}/storage/assets
DOWNLOAD_DIR=${APP_DIR}/storage/downloads

if [ -f "${APP_DIR}/.env" ]; then
  echo "Loading environment variables from ${APP_DIR}/.env"
  FILE=${APP_DIR}/.env
elif [ -f "${APP_DIR}/.env.local" ]; then
  echo "Loading environment variables from ${APP_DIR}/.env.local"
  FILE=${APP_DIR}/.env.local
else
  echo "No .env file found in ${APP_DIR}. Using default values."
fi

source ${FILE}
