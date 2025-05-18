#!/usr/bin/env bash

source "$(dirname "$0")/config.sh"

# Get output_path from command line argument
output_path="$1"
if [ -z "$output_path" ]; then
    echo "Usage: $0 <output_path>"
    exit 1
fi

# Query status using output_path
curl --location "${QUERY_API}" \
    --header 'Content-Type: application/json' \
    --data "{\"output_path\":\"${output_path}\"}"
