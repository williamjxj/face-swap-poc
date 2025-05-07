#!/usr/bin/env bash

APP_DIR=${HOME}/my-experiments/face-sawp-poc
source ${APP_DIR}/.env
source_img=${APP_DIR}/src/assets/image.png
target_img=${APP_DIR}/src/assets/video.mp4

CREATE_API=$MODAL_CREATE_API
QUERY_API=$MODAL_QUERY_API

# First curl: create experiment and capture response
# curl --location --request POST https://...-index.modal.run --form source=@.../image.png --form target=@.../video.mp4
response=$(curl --location --request POST "${CREATE_API}" \
    --form "source=@${source_img}" \
    --form "target=@${target_img}")

# Extract output_path from JSON response
output_path=$(echo "$response" | jq -r '.output_path')

# response: {"output_path":"/tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4"}
# output_path: /tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4
echo "response: $response"
echo "output_path: $output_path"

# Second curl: use output_path in the request body
# curl --location https://...-download-file.modal.run --header 'Content-Type: application/json' --data '{"output_path":"/tmp/tmpdqpsuwz2/a5863cc9c493479c98a0eaf026745513.mp4"}'
curl --location "${QUERY_API}" \
  --header 'Content-Type: application/json' \
  --data "{\"output_path\":\"${output_path}\"}"
