#!/usr/bin/env bash

source "$(dirname "$0")/config.sh"

source_img="${ASSET_DIR}/image.png"
target_img="${ASSET_DIR}/video.mp4"

# First curl: create experiment and capture response
response=$(curl --location --request POST "${MODAL_QUERY_API}" \
    --form "source=@${source_img}" \
    --form "target=@${target_img}")

# Extract output_path from JSON response
output_path=$(echo "$response" | jq -r '.output_path')

# response: {"output_path":"/tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4"}
# output_path: /tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4
echo "response: $response"
echo "output_path: $output_path"

# Second curl: use output_path in the request body
curl --location "${MODAL_QUERY_API}" \
  --header 'Content-Type: application/json' \
  --data "{\"output_path\":\"${output_path}\"}"
