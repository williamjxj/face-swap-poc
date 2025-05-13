#!/usr/bin/env bash

# Source shared configuration
source "$(dirname "$0")/config.sh"

source_img="${APP_DIR}/src/assets/image.png"
target_img="${APP_DIR}/src/assets/video.mp4"

# First curl: create experiment and capture response
response=$(curl --location --request POST "https://ultimatech-research--facefusion-agent-facefusionagent-index.modal.run" \
    --form "source=@${source_img}" \
    --form "target=@${target_img}")

# Extract output_path from JSON response
output_path=$(echo "$response" | jq -r '.output_path')

# response: {"output_path":"/tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4"}
# output_path: /tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4
echo "response: $response"
echo "output_path: $output_path"

# Second curl: use output_path in the request body
curl --location "https://ultimatech-research--facefusion-agent-facefusionagent-do-29747a.modal.run" \
  --header 'Content-Type: application/json' \
  --data "{\"output_path\":\"${output_path}\"}"
